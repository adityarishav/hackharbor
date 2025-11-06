from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, selectinload
import models, database, auth, schemas, docker
from sqlalchemy.sql import func
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import json # Import json
import subprocess
import os

app = FastAPI()

app.include_router(auth.auth_router) # Include the auth router

origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://localhost:8080", 
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VULNVERSE_NETWORK_NAME = os.getenv("DOCKER_NETWORK_NAME", "vulnverse_network")

def get_or_create_docker_network():
    client = docker.from_env()
    try:
        network = client.networks.get(VULNVERSE_NETWORK_NAME)
    except docker.errors.NotFound:
        ipam_pool = docker.types.IPAMPool(subnet='172.20.0.0/16', gateway='172.20.0.1')
        ipam_config = docker.types.IPAMConfig(pool_configs=[ipam_pool])
        network = client.networks.create(VULNVERSE_NETWORK_NAME, driver="bridge", ipam=ipam_config)
    return network

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    print("--- Entering create_user function ---")
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        print("--- User already exists, raising HTTPException ---")
        raise HTTPException(status_code=400, detail="Username already registered")
    
    print("--- User does not exist, proceeding to hash password ---")
    hashed_password = auth.get_password_hash(user.password)
    print("--- Password hashed successfully ---")
    
    db_user = models.User(username=user.username, email=user.email, password=hashed_password, role=user.role)
    print("--- User model created, adding to DB session ---")
    db.add(db_user)
    print("--- Committing user to DB ---")
    db.commit()
    print("--- User committed, refreshing instance ---")
    db.refresh(db_user)
    print("--- Returning created user ---")
    return db_user



@app.get("/machines/", response_model=list[schemas.Machine])
def read_machines(skip: int = 0, limit: int = 100, search: str | None = None, show_deleted: bool = False, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Machine)
    if current_user.role == "admin" and show_deleted:
        # Admin requesting to see all machines, including deleted ones
        pass # No additional filter for is_deleted
    else:
        # Normal user, or admin not explicitly requesting deleted machines
        query = query.filter(models.Machine.is_deleted == False)

    if search:
        query = query.filter(models.Machine.name.ilike(f"%{search}%"))
    machines = query.offset(skip).limit(limit).all()
    return machines

@app.get("/machines/upcoming", response_model=list[schemas.Machine])
def read_upcoming_machines(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    machines = db.query(models.Machine).filter(models.Machine.status == "upcoming").offset(skip).limit(limit).all()
    return machines

@app.get("/machines/{machine_id}", response_model=schemas.Machine)
def read_machine(machine_id: int, db: Session = Depends(database.get_db)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if db_machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

@app.post("/machines/", response_model=schemas.Machine)
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(database.get_db)):
    db_machine = models.Machine(**machine.dict())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

@app.post("/admin/machines/", response_model=schemas.Machine)
def create_admin_machine(machine: schemas.MachineCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_machine = models.Machine(
        name=machine.name,
        description=machine.description,
        source_identifier=machine.source_identifier,
        category=machine.category,
        difficulty=machine.difficulty,
        provider=machine.provider,
        operating_system=machine.operating_system,
        config_json=machine.config_json,
        solves=machine.solves
    )
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)

    for flag_data in machine.flags:
        db_flag = models.Flag(machine_id=db_machine.id, flag=flag_data.flag)
        db.add(db_flag)
    db.commit()
    db.refresh(db_machine)
    return db_machine

@app.post("/flags/", response_model=schemas.Flag)
def create_flag(flag: schemas.FlagCreate, db: Session = Depends(database.get_db)):
    db_flag = models.Flag(**flag.dict())
    db.add(db_flag)
    db.commit()
    db.refresh(db_flag)
    return db_flag



@app.post("/machines/{machine_id}/start")
def start_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    ip_address = db_machine.ip_address
    
    # --- Start the machine if it's not already running ---
    if ip_address is None:
        try:
            client = docker.from_env()
            network = get_or_create_docker_network()
            container_name = f"vuln-app-{db_machine.id}"

            try:
                # Clean up old container if it exists
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass # No existing container, proceed

            # Automatically detect ports from the Docker image
            try:
                image = client.images.get(db_machine.source_identifier)
                exposed_ports = image.attrs['Config'].get('ExposedPorts', {})
                ports_to_publish = {port: None for port in exposed_ports.keys()}
            except docker.errors.ImageNotFound:
                raise HTTPException(status_code=404, detail=f"Docker image {db_machine.source_identifier} not found.")

            container = client.containers.run(
                db_machine.source_identifier,
                name=container_name,
                detach=True,
                network=network.name,
                ports=ports_to_publish
            )
            container.reload()
            ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

            # Update the database with the new IP address
            db_machine.ip_address = ip_address
            db.add(db_machine)
            # We commit here to make the IP available immediately
            db.commit()

        except Exception as e:
            # Rollback IP change if starting fails
            db_machine.ip_address = None
            db.commit()
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while starting the machine: {e}")

    # --- Add the current user to the list of active users for this machine ---
    if current_user not in db_machine.active_users:
        db_machine.active_users.append(current_user)
        db.commit()
        db.refresh(db_machine)

    return {"message": f"Machine {db_machine.name} is active for you with IP {ip_address}"}

@app.post("/machines/{machine_id}/stop")
def stop_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # --- Remove the current user from the list of active users ---
    if current_user in db_machine.active_users:
        db_machine.active_users.remove(current_user)
        db.commit()
        db.refresh(db_machine)
    else:
        # If user wasn't active, just return a success message.
        return {"message": "Machine is no longer active for you."}

    # --- If no users are left, stop the machine globally ---
    if not db_machine.active_users:
        try:
            client = docker.from_env()
            container_name = f"vuln-app-{db_machine.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass # Already stopped

            # Clear the IP address from the database
            db_machine.ip_address = None
            db.add(db_machine)
            db.commit()
            
            return {"message": f"Machine {db_machine.name} stopped globally."}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while stopping the machine: {e}")

    return {"message": f"Machine {db_machine.name} is no longer active for you, but remains running for other users."}

@app.post("/machines/{machine_id}/restart")
def restart_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    try:
        # --- Step 1: Hard stop the machine ---
        if db_machine.ip_address is not None: # Only stop if it's actually running
            client = docker.from_env()
            container_name = f"vuln-app-{db_machine.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass # Already stopped

        # --- Step 2: Clear state in DB ---
        db_machine.active_users.clear()
        db_machine.ip_address = None
        db.commit()

        # --- Step 3: Start the machine again ---
        ip_address = None
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"vuln-app-{db_machine.id}"
        # Automatically detect ports from the Docker image
        try:
            image = client.images.get(db_machine.source_identifier)
            exposed_ports = image.attrs['Config'].get('ExposedPorts', {})
            ports_to_publish = {port: None for port in exposed_ports.keys()}
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_machine.source_identifier} not found.")

        container = client.containers.run(
            db_machine.source_identifier,
            name=container_name,
            detach=True,
            network=network.name,
            ports=ports_to_publish
        )
        container.reload()
        ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        # --- Step 4: Update DB with new IP ---
        db_machine.ip_address = ip_address
        db.commit()

        return {"message": f"Machine {db_machine.name} has been restarted successfully. New IP is {ip_address}."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during restart: {e}")

@app.delete("/admin/machines/{machine_id}", status_code=200) # Change status code to 200 for success message
def delete_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    client = docker.from_env()
    container_name = f"vuln-app-{db_machine.id}"
    try:
        container = client.containers.get(container_name)
        container.stop()
        container.remove()
    except docker.errors.NotFound:
        pass # Container not found, already removed or never started

    # Soft delete the machine
    db_machine.is_deleted = True
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)

    return {"message": "Machine soft-deleted successfully"}

    return {"message": "Machine deleted successfully"}

@app.put("/admin/machines/{machine_id}", response_model=schemas.Machine)
def update_machine(machine_id: int, machine: schemas.MachineCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Update machine details
    db_machine.name = machine.name
    db_machine.description = machine.description
    db_machine.source_identifier = machine.source_identifier
    db_machine.category = machine.category
    db_machine.difficulty = machine.difficulty
    db_machine.provider = machine.provider
    db_machine.operating_system = machine.operating_system
    db_machine.config_json = machine.config_json
    db_machine.solves = machine.solves
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)

    # Handle flags: soft-delete, update, and add new ones
    existing_flags = db.query(models.Flag).filter(models.Flag.machine_id == machine_id).all()
    existing_flag_values = {f.flag: f for f in existing_flags}
    new_flag_values = {f.flag for f in machine.flags}

    # Soft-delete flags that are no longer present in the new list
    for flag_obj in existing_flags:
        if flag_obj.flag not in new_flag_values:
            flag_obj.is_deleted = True
            db.add(flag_obj)

    # Add new flags or reactivate existing ones
    for flag_data in machine.flags:
        if flag_data.flag in existing_flag_values:
            # Flag exists, ensure it's not deleted
            existing_flag_values[flag_data.flag].is_deleted = False
            db.add(existing_flag_values[flag_data.flag])
        else:
            # New flag, add it
            db_flag = models.Flag(machine_id=db_machine.id, flag=flag_data.flag, is_deleted=False)
            db.add(db_flag)
    
    db.commit()
    db.refresh(db_machine)

    return db_machine

@app.post("/admin/machines/{machine_id}/changelog", response_model=schemas.Changelog)
def create_changelog_entry(
    machine_id: int,
    changelog_entry: schemas.ChangelogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    db_changelog = models.Changelog(
        machine_id=machine_id,
        admin_id=current_user.id,
        description=changelog_entry.description
    )
    db.add(db_changelog)
    db.commit()
    db.refresh(db_changelog)
    return db_changelog

@app.get("/machines/{machine_id}/changelog", response_model=list[schemas.Changelog])
def get_changelog_entries(machine_id: int, db: Session = Depends(database.get_db)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    changelog_entries = db.query(models.Changelog).filter(models.Changelog.machine_id == machine_id).order_by(models.Changelog.timestamp.desc()).all()
    return changelog_entries

@app.post("/vpn/generate-config")
async def generate_vpn_config(current_user: models.User = Depends(auth.get_current_user)):
    username = current_user.username
    easyrsa_path = "/usr/local/bin/easyrsa" # Correct path found

    # Generate the client certificate if it doesn't exist
    try:
        subprocess.run(
            ["docker", "exec", "--workdir", "/etc/openvpn", "openvpn_server", easyrsa_path, "build-client-full", username, "nopass"],
            check=True, capture_output=True, text=True, timeout=30
        )
    except subprocess.CalledProcessError as e:
        # If the certificate already exists, easyrsa may return a non-zero exit code with a specific message.
        if "Request file already exists." in e.stderr or ("An client certificate with the name" in e.stderr and "already exists" in e.stderr):
            # This is not an error, the certificate/request is already there. We can proceed.
            pass
        else:
            # This is a real error.
            print(f"Error creating VPN certificate: {e.stderr}")
            raise HTTPException(status_code=500, detail=f"Error creating VPN certificate: {e.stderr}")

    # Retrieve the client configuration
    try:
        result = subprocess.run(
            ["docker", "exec", "--workdir", "/etc/openvpn", "openvpn_server", "ovpn_getclient", username],
            check=True, capture_output=True, text=True, timeout=30
        )
        config_data = result.stdout
        return PlainTextResponse(content=config_data, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={username}.ovpn"})
    except subprocess.CalledProcessError as e:
        print(f"Error generating VPN config: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Error generating VPN config: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/submissions/", response_model=schemas.Submission)
def create_submission(submission: schemas.SubmissionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    machine = db.query(models.Machine).filter(models.Machine.id == submission.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Check if the submitted flag is one of the correct flags for this machine
    is_correct_flag = db.query(models.Flag).filter(
        models.Flag.machine_id == submission.machine_id,
        models.Flag.flag == submission.flag
    ).first()

    if not is_correct_flag:
        raise HTTPException(status_code=400, detail="Incorrect flag")

    # Check for duplicate submission of this specific flag by this user for this machine
    db_submission = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id,
        models.Submission.machine_id == submission.machine_id,
        models.Submission.flag_id == is_correct_flag.id # Check for specific flag_id
    ).first()
    if db_submission:
        raise HTTPException(status_code=400, detail="Flag already submitted")

    db_submission = models.Submission(
        user_id=current_user.id,
        machine_id=submission.machine_id,
        flag=submission.flag,
        flag_id=is_correct_flag.id # Store the flag_id
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    # Check if this is the first successful submission by this user for this machine
    existing_submissions_by_user_for_machine = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id,
        models.Submission.machine_id == submission.machine_id
    ).count()

    if existing_submissions_by_user_for_machine == 1: # This is the first unique flag for this user on this machine
        machine.solves += 1
        db.add(machine)
        db.commit()
        db.refresh(machine)
    
    return db_submission

@app.get("/admin/analytics", response_model=dict)
def get_admin_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    total_users = db.query(models.User).count()
    total_machines = db.query(models.Machine).count()
    total_submissions = db.query(models.Submission).count()

    # User registration trends (e.g., users registered per day)
    user_registration_trends = [
        {"date": item.created_at.isoformat(), "count": item.count}
        for item in db.query(
            models.User.created_at,
            func.count(models.User.id).label('count')
        ).group_by(models.User.created_at).order_by(models.User.created_at).all()
    ]

    # Submission trends (e.g., submissions per day)
    submission_trends = [
        {"date": item.created_at.isoformat(), "count": item.count}
        for item in db.query(
            models.Submission.created_at,
            func.count(models.Submission.id).label('count')
        ).group_by(models.Submission.created_at).order_by(models.Submission.created_at).all()
    ]

    # Machine popularity (most started machines - requires a new field or logging starts)
    # For now, let's use submissions as a proxy for popularity
    machine_popularity = [
        {"name": item.name, "submission_count": item.submission_count}
        for item in db.query(
            models.Machine.name,
            func.count(models.Submission.id).label('submission_count')
        ).join(models.Submission).group_by(models.Machine.name).order_by(func.count(models.Submission.id).desc()).limit(5).all()
    ]

    # Top users by submissions
    top_users = [
        {"username": item.username, "submission_count": item.submission_count}
        for item in db.query(
            models.User.username,
            func.count(models.Submission.id).label('submission_count')
        ).join(models.Submission).group_by(models.User.username).order_by(func.count(models.Submission.id).desc()).limit(5).all()
    ]

    # Machine completion rates
    machine_completion_rates = []
    machines = db.query(models.Machine).all()
    for machine in machines:
        successful_submissions_for_machine = db.query(models.Submission.user_id).distinct().filter(
            models.Submission.machine_id == machine.id
        ).join(models.Flag, (models.Submission.machine_id == models.Flag.machine_id) & (models.Submission.flag == models.Flag.flag)).count()

        total_users_attempted = db.query(models.Submission.user_id).distinct().filter(
            models.Submission.machine_id == machine.id
        ).count()

        completion_rate = 0
        if total_users_attempted > 0:
            completion_rate = (successful_submissions_for_machine / total_users_attempted) * 100

        machine_completion_rates.append({
            "name": machine.name,
            "completion_rate": round(completion_rate, 2),
            "completed_count": successful_submissions_for_machine,
            "total_users_attempted": total_users_attempted
        })

    return {
        "total_users": total_users,
        "total_machines": total_machines,
        "total_submissions": total_submissions,
        "user_registration_trends": user_registration_trends,
        "submission_trends": submission_trends,
        "machine_popularity": machine_popularity,
        "top_users": top_users,
        "machine_completion_rates": machine_completion_rates
    }

@app.get("/admin/machines/difficulty_distribution", response_model=list[dict])
def get_machine_difficulty_distribution(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    difficulty_distribution = db.query(
        models.Machine.difficulty,
        func.count(models.Machine.id).label('count')
    ).group_by(models.Machine.difficulty).all()
    return [{"difficulty": item.difficulty, "count": item.count} for item in difficulty_distribution]

@app.get("/admin/machines/all", response_model=list[schemas.Machine])
def read_all_machines_admin(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    machines = db.query(models.Machine).offset(skip).limit(limit).all()
    return machines

@app.get("/admin/machines/{machine_id}", response_model=schemas.Machine)
def read_admin_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if db_machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

@app.get("/admin/users", response_model=list[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.put("/admin/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.role = user.role
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/admin/users/{user_id}", status_code=200)
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.get("/admin/stats", response_model=dict)
def get_admin_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    total_users = db.query(models.User).count()
    active_machines = db.query(models.Machine).filter(models.Machine.ip_address != None).count()
    total_submissions = db.query(models.Submission).count() + db.query(models.ChallengeSubmission).count()
    # Active sessions is harder to track without a dedicated session management system.
    # For now, we can return a placeholder or implement a simple count of users with active machines.
    active_sessions = db.query(models.User).join(models.active_machines_association).distinct().count()

    return {
        "total_users": total_users,
        "active_machines": active_machines,
        "total_submissions": total_submissions,
        "active_sessions": active_sessions,
    }

@app.get("/users/me/score", response_model=dict)
def get_my_score(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    score = db.query(models.Submission.flag_id).filter(
        models.Submission.user_id == current_user.id
    ).distinct().count()
    return {"score": score}

@app.get("/users/me/submissions", response_model=list[schemas.Submission])
def get_my_submissions(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    submissions = db.query(models.Submission).filter(models.Submission.user_id == current_user.id).all()
    return submissions

@app.get("/machines/{machine_id}/flags_status", response_model=list[dict])
def get_machine_flags_status(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    flags_status = []
    for flag in machine.flags:
        if flag.is_deleted: # Skip deleted flags
            continue
        is_submitted = db.query(models.Submission).filter(
            models.Submission.user_id == current_user.id,
            models.Submission.machine_id == machine_id,
            models.Submission.flag_id == flag.id
        ).first() is not None
        flags_status.append({"id": flag.id, "flag": flag.flag, "is_submitted": is_submitted})
    return flags_status

@app.get("/challenges", response_model=list[schemas.Challenge])
def read_challenges(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    challenges = db.query(models.Challenge).filter(models.Challenge.is_deleted == False).offset(skip).limit(limit).all()
    return challenges

@app.get("/challenges/{challenge_id}", response_model=schemas.Challenge)
def read_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).options(selectinload(models.Challenge.active_users), selectinload(models.Challenge.flags)).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return db_challenge

@app.get("/challenges/{challenge_id}/flags_status", response_model=list[dict])
def get_challenge_flags_status(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    flags_status = []
    for flag in challenge.flags:
        if flag.is_deleted: # Skip deleted flags
            continue
        is_submitted = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.user_id == current_user.id,
            models.ChallengeSubmission.challenge_id == challenge_id,
            models.ChallengeSubmission.challenge_flag_id == flag.id,
            models.ChallengeSubmission.is_correct == True
        ).first() is not None
        flags_status.append({"id": flag.id, "flag": flag.flag, "is_submitted": is_submitted})
    return flags_status

@app.get("/admin/challenges/all", response_model=list[schemas.Challenge])
def read_all_challenges_admin(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    challenges = db.query(models.Challenge).offset(skip).limit(limit).all()
    return challenges

@app.get("/admin/challenges/{challenge_id}", response_model=schemas.Challenge)
def read_admin_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).options(selectinload(models.Challenge.flags)).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return db_challenge

@app.put("/admin/challenges/{challenge_id}", response_model=schemas.Challenge)
def update_challenge(challenge_id: int, challenge: schemas.ChallengeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    db_challenge.title = challenge.title
    db_challenge.description = challenge.description
    db_challenge.category = challenge.category
    db_challenge.difficulty = challenge.difficulty
    db_challenge.points = challenge.points
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)

    # Handle flags: soft-delete, update, and add new ones
    existing_flags = db.query(models.ChallengeFlag).filter(models.ChallengeFlag.challenge_id == challenge_id).all()
    existing_flag_values = {f.flag: f for f in existing_flags}
    new_flag_values = {f.flag for f in challenge.flags}

    # Soft-delete flags that are no longer present in the new list
    for flag_obj in existing_flags:
        if flag_obj.flag not in new_flag_values:
            flag_obj.is_deleted = True
            db.add(flag_obj)

    # Add new flags or reactivate existing ones
    for flag_data in challenge.flags:
        if flag_data.flag in existing_flag_values:
            # Flag exists, ensure it's not deleted
            existing_flag_values[flag_data.flag].is_deleted = False
            db.add(existing_flag_values[flag_data.flag])
        else:
            # New flag, add it
            db_flag = models.ChallengeFlag(challenge_id=db_challenge.id, flag=flag_data.flag, is_deleted=False)
            db.add(db_flag)
    
    db.commit()
    db.refresh(db_challenge)

    return db_challenge

@app.delete("/admin/challenges/{challenge_id}", status_code=200)
def delete_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    db_challenge.is_deleted = True
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return {"message": "Challenge soft-deleted successfully"}

@app.post("/admin/challenges/{challenge_id}/start", response_model=schemas.Challenge)
def start_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    # If already running, return its current state
    if db_challenge.ip_address:
        return db_challenge

    try:
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        try:
            # Clean up old container if it exists
            container = client.containers.get(container_name)
            container.stop()
            container.remove()
        except docker.errors.NotFound:
            pass # No existing container, proceed

        # Check if image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
            # No ports published by default, challenges might expose services internally
        )
        container.reload()
        challenge_ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        db_challenge.ip_address = challenge_ip_address
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)
        return db_challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start Docker container for challenge: {e}")

@app.post("/admin/challenges/{challenge_id}/stop", response_model=schemas.Challenge)
def stop_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    # If not running, return its current state
    if not db_challenge.ip_address:
        return db_challenge

    try:
        client = docker.from_env()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        try:
            container = client.containers.get(container_name)
            container.stop()
            container.remove()
        except docker.errors.NotFound:
            pass # Already stopped

        db_challenge.ip_address = None
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)
        return db_challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop Docker container for challenge: {e}")


@app.post("/admin/challenges/{challenge_id}/restart", response_model=schemas.Challenge)
def restart_admin_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    try:
        # --- Step 1: Hard stop the challenge container if it's running ---
        if db_challenge.ip_address is not None:
            client = docker.from_env()
            container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass # Already stopped or never started

        # --- Step 2: Clear active users and IP address in DB ---
        db_challenge.active_users.clear()
        db_challenge.ip_address = None
        db.commit()

        # --- Step 3: Start a new container for the challenge ---
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        # Check if image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
            # No ports published by default, challenges might expose services internally
        )
        container.reload()
        challenge_ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        # --- Step 4: Update DB with new IP and active user (the one who restarted) ---
        db_challenge.ip_address = challenge_ip_address
        # Admin restart does not automatically add the admin as an active user
        # db_challenge.active_users.append(current_user)
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)

        return {"message": f"Challenge {db_challenge.title} has been restarted successfully. New IP is {challenge_ip_address}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during challenge restart: {e}")

@app.post("/challenges/{challenge_id}/start", response_model=schemas.Challenge)
def start_challenge_user(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    # Add the current user to the list of active users for this challenge
    if current_user not in db_challenge.active_users:
        db_challenge.active_users.append(current_user)
        db.commit()
        db.refresh(db_challenge)
    else:
        # If user wasn't active, just return a success message.
        return db_challenge # Or raise HTTPException(status_code=400, detail="User not active on this challenge")

    # If already running, return its current state
    if db_challenge.ip_address:
        return db_challenge

    try:
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        try:
            # Clean up old container if it exists
            container = client.containers.get(container_name)
            container.stop()
            container.remove()
        except docker.errors.NotFound:
            pass # No existing container, proceed

        # Check if image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
            # No ports published by default, challenges might expose services internally
        )
        container.reload()
        challenge_ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        db_challenge.ip_address = challenge_ip_address
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)
        print(f"--- After start_challenge_user: active_users={[user.username for user in db_challenge.active_users]}, ip_address={db_challenge.ip_address} ---")
        return db_challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start Docker container for challenge: {e}")

@app.post("/challenges/{challenge_id}/stop", response_model=schemas.Challenge)
def stop_challenge_user(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    # Remove the current user from the list of active users for this challenge
    if current_user in db_challenge.active_users:
        db_challenge.active_users.remove(current_user)
        db.commit()
        db.refresh(db_challenge)
        print(f"--- After removing user from active_users: active_users={[user.username for user in db_challenge.active_users]}, ip_address={db_challenge.ip_address} ---")
    else:
        # If user wasn't active, just return a success message.
        return {"message": "Challenge is no longer active for you."}

    # If no users are left, stop the challenge globally
    if not db_challenge.active_users:
        try:
            client = docker.from_env()
            container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass # Already stopped

            db_challenge.ip_address = None
            db.add(db_challenge)
            db.commit()
            db.refresh(db_challenge)
            print(f"--- After stopping challenge globally: active_users={[user.username for user in db_challenge.active_users]}, ip_address={db_challenge.ip_address} ---")
            return {"message": f"Challenge {db_challenge.title} stopped globally."}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while stopping the challenge: {e}")

    return {"message": f"Challenge {db_challenge.title} is no longer active for you, but remains running for other users."}

@app.post("/challenges/{challenge_id}/restart", response_model=schemas.Challenge)
def restart_challenge_user(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    try:
        # --- Step 1: Hard stop the challenge container if it's running ---
        if db_challenge.ip_address is not None:
            client = docker.from_env()
            container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass # Already stopped or never started

        # --- Step 2: Clear active users and IP address in DB ---
        db_challenge.active_users.clear()
        db_challenge.ip_address = None
        db.commit()

        # --- Step 3: Start a new container for the challenge ---
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        # Check if image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
            # No ports published by default, challenges might expose services internally
        )
        container.reload()
        challenge_ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        # --- Step 4: Update DB with new IP and active user (the one who restarted) ---
        db_challenge.ip_address = challenge_ip_address
        db_challenge.active_users.append(current_user) # Add current user as active after restart
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)

        return {"message": f"Challenge {db_challenge.title} has been restarted successfully. New IP is {challenge_ip_address}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during challenge restart: {e}")

UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

@app.post("/admin/challenges", response_model=schemas.Challenge)
def create_admin_challenge(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    difficulty: str = Form(...),
    points: int = Form(...),
    flags: str = Form(...), # Expect a comma-separated string of flags
    file: UploadFile | None = File(None),
    docker_image: str | None = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    file_path = None
    if file:
        file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        file_path = file_location

    challenge_ip_address = None
    # Docker container will not be started automatically. It will be started on demand.

    db_challenge = models.Challenge(
        title=title,
        description=description,
        category=category,
        difficulty=difficulty,
        points=points,
        # flag=hashed_flag, # <--- Removed single flag
        file_path=file_path,
        docker_image=docker_image,  # Store docker image name
        ip_address=challenge_ip_address, # Store assigned IP
        is_deleted=False
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)

    # Add multiple flags
    parsed_flags = [f.strip() for f in flags.split(',') if f.strip()]
    for flag_str in parsed_flags:
        db_challenge_flag = models.ChallengeFlag(challenge_id=db_challenge.id, flag=flag_str)
        db.add(db_challenge_flag)
    db.commit()
    db.refresh(db_challenge) # Refresh again to load flags relationship

    return db_challenge

@app.post("/challenges/{challenge_id}/submit", response_model=schemas.ChallengeSubmission)
def submit_challenge_flag(
    challenge_id: int,
    submission: schemas.ChallengeSubmissionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Verify the submitted flag against all stored flags for the challenge
    is_correct = False
    correct_challenge_flag = None
    for cf in challenge.flags:
        if submission.flag == cf.flag:
            is_correct = True
            correct_challenge_flag = cf
            break

    if not is_correct:
        raise HTTPException(status_code=400, detail="Incorrect flag")

    # Check for duplicate submission of this specific challenge flag by this user
    db_submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.challenge_flag_id == correct_challenge_flag.id, # Check for specific flag ID
        models.ChallengeSubmission.is_correct == True # Only consider correct submissions as duplicates
    ).first()

    if db_submission:
        raise HTTPException(status_code=400, detail="Flag already submitted correctly for this challenge")

    new_submission = models.ChallengeSubmission(
        user_id=current_user.id,
        challenge_id=challenge_id,
        challenge_flag_id=correct_challenge_flag.id, # Store the ID of the correct flag
        submitted_flag=submission.flag, # Store submitted flag
        is_correct=True # It's correct if we reached here
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    return new_submission