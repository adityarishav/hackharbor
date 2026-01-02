from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, database, auth, schemas
from docker_utils import get_or_create_docker_network, VULNVERSE_NETWORK_NAME
import docker


router = APIRouter()

def add_vpn_route(container):
    
    try:
        client = docker.from_env()
        # Find OpenVPN container IP dynamically
        try:
            vpn_container = client.containers.get("openvpn_server")
            vpn_ip = vpn_container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']
        except Exception:
            print("Failed to find 'openvpn_server' container to configure routes.")
            return

        command = f"ip route add 192.168.255.0/24 via {vpn_ip}"
        legacy_command = f"route add -net 192.168.255.0 netmask 255.255.255.0 gw {vpn_ip}"
        
        # Try 'ip route' first
        exit_code, output = container.exec_run(command)
        if exit_code != 0:
            print(f"ip route failed: {output.decode()}. Trying 'route add'...")
            # Fallback to legacy 'route'
            exit_code, output = container.exec_run(legacy_command)
            if exit_code != 0:
                print(f"Route add failed: {output.decode()}")
            else:
                print(f"Route added via 'route' command to {container.name}")
        else:
             print(f"Route added via 'ip route' to {container.name}")

    except Exception as e:
        print(f"Error executing route add on container {container.name}: {e}")

@router.get("/machines/", response_model=list[schemas.Machine])
def read_machines(skip: int = 0, limit: int = 100, search: str | None = None, show_deleted: bool = False, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Machine)
    if current_user.role == "admin":
        if not show_deleted:
            query = query.filter(models.Machine.is_deleted == False)
    else:
        # For non-admins, filter out upcoming and deleted machines
        query = query.filter(
            models.Machine.is_deleted == False,
            models.Machine.status != "upcoming"
        )

    if search:
        query = query.filter(models.Machine.name.ilike(f"%{search}%"))
    machines = query.order_by(models.Machine.id.desc()).offset(skip).limit(limit).all()
    return machines

@router.get("/machines/upcoming", response_model=list[schemas.Machine])
def read_upcoming_machines(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    machines = db.query(models.Machine).filter(models.Machine.status == "upcoming").offset(skip).limit(limit).all()
    return machines

@router.get("/machines/{machine_id}", response_model=schemas.Machine)
def read_machine(machine_id: int, db: Session = Depends(database.get_db)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if db_machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

@router.post("/machines/", response_model=schemas.Machine)
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(database.get_db)):
    db_machine = models.Machine(**machine.dict())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

@router.post("/admin/machines/", response_model=schemas.Machine)
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
        solves=machine.solves,
        status=machine.status,
        release_date=machine.release_date
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

@router.post("/flags/", response_model=schemas.Flag)
def create_flag(flag: schemas.FlagCreate, db: Session = Depends(database.get_db)):
    db_flag = models.Flag(**flag.dict())
    db.add(db_flag)
    db.commit()
    db.refresh(db_flag)
    return db_flag

@router.post("/machines/{machine_id}/start")
def start_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Check if user already has an active machine
    if current_user.active_machines:
        # If the user is already active on THIS machine, that's fine (idempotent)
        if current_user.active_machines[0].id != machine_id:
             raise HTTPException(
                status_code=409, 
                detail=f"You already have an active machine: {current_user.active_machines[0].name}",
                headers={"X-Active-Machine-Id": str(current_user.active_machines[0].id), "X-Active-Machine-Name": current_user.active_machines[0].name}
            )

    ip_address = db_machine.ip_address
    
    # Start machine 
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
                pass 

            #  detect ports 
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
                ports=ports_to_publish,
                cap_add=["NET_ADMIN"]
            )
            container.reload()
            ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

            #  Route
            add_vpn_route(container)

            # Update the database with the new IP address
            db_machine.ip_address = ip_address
            db.add(db_machine)
            # ip avalable
            db.commit()

        except Exception as e:
           
            db_machine.ip_address = None
            db.commit()
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while starting the machine: {e}")

    # Adding the current user to the list of active users
    if current_user not in db_machine.active_users:
        db_machine.active_users.append(current_user)
        db.commit()
        db.refresh(db_machine)

    return {"message": f"Machine {db_machine.name} is active for you with IP {ip_address}"}

@router.post("/machines/{machine_id}/stop")
def stop_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    #Remove the current user 
    if current_user in db_machine.active_users:
        db_machine.active_users.remove(current_user)
        db.commit()
        db.refresh(db_machine)
    else:
        return {"message": "Machine is no longer active for you."}

    #global
    if not db_machine.active_users:
        try:
            client = docker.from_env()
            container_name = f"vuln-app-{db_machine.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass 

            # Clear the IP address from the database
            db_machine.ip_address = None
            db.add(db_machine)
            db.commit()
            
            return {"message": f"Machine {db_machine.name} stopped globally."}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while stopping the machine: {e}")

    return {"message": f"Machine {db_machine.name} is no longer active for you, but remains running for other users."}

@router.post("/machines/{machine_id}/restart")
def restart_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    try:
      
        if db_machine.ip_address is not None: 
            client = docker.from_env()
            container_name = f"vuln-app-{db_machine.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass 

        db_machine.active_users.clear()
        db_machine.ip_address = None
        db.commit()

       
        ip_address = None
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"vuln-app-{db_machine.id}"
        
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
            ports=ports_to_publish,
            cap_add=["NET_ADMIN"]
        )
        container.reload()
        ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        #  Route
        add_vpn_route(container)

        
        db_machine.ip_address = ip_address
        db.commit()

        return {"message": f"Machine {db_machine.name} has been restarted successfully. New IP is {ip_address}."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during restart: {e}")

@router.delete("/admin/machines/{machine_id}", status_code=200) 
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
        pass

    
    db_machine.is_deleted = True
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)

    return {"message": "Machine deleted successfully"}

@router.put("/admin/machines/{machine_id}", response_model=schemas.Machine)
def update_machine(machine_id: int, machine: schemas.MachineCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    
    db_machine.name = machine.name
    db_machine.description = machine.description
    db_machine.source_identifier = machine.source_identifier
    db_machine.category = machine.category
    db_machine.difficulty = machine.difficulty
    db_machine.provider = machine.provider
    db_machine.operating_system = machine.operating_system
    db_machine.config_json = machine.config_json
    db_machine.solves = machine.solves
    db_machine.status = machine.status
    db_machine.release_date = machine.release_date
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)

    #flags
    existing_flags = db.query(models.Flag).filter(models.Flag.machine_id == machine_id).all()
    existing_flag_values = {f.flag: f for f in existing_flags}
    new_flag_values = {f.flag for f in machine.flags}

    #dlete old flag if any flag removed
    for flag_obj in existing_flags:
        if flag_obj.flag not in new_flag_values:
            flag_obj.is_deleted = True
            db.add(flag_obj)

    # Add new flags 
    for flag_data in machine.flags:
        if flag_data.flag in existing_flag_values:
            existing_flag_values[flag_data.flag].is_deleted = False
            db.add(existing_flag_values[flag_data.flag])
        else:
            # New flag, add it
            db_flag = models.Flag(machine_id=db_machine.id, flag=flag_data.flag, is_deleted=False)
            db.add(db_flag)
    
    db.commit()
    db.refresh(db_machine)

    return db_machine

@router.post("/admin/machines/{machine_id}/changelog", response_model=schemas.Changelog)
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

@router.get("/machines/{machine_id}/changelog", response_model=list[schemas.Changelog])
def get_changelog_entries(machine_id: int, db: Session = Depends(database.get_db)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    changelog_entries = db.query(models.Changelog).filter(models.Changelog.machine_id == machine_id).order_by(models.Changelog.timestamp.desc()).all()
    return changelog_entries

@router.get("/admin/machines/difficulty_distribution", response_model=list[dict])
def get_machine_difficulty_distribution(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    difficulty_distribution = db.query(
        models.Machine.difficulty,
        func.count(models.Machine.id).label('count')
    ).group_by(models.Machine.difficulty).all()
    return [{"difficulty": item.difficulty, "count": item.count} for item in difficulty_distribution]

@router.get("/admin/machines/all", response_model=list[schemas.Machine])
def read_all_machines_admin(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    machines = db.query(models.Machine).offset(skip).limit(limit).all()
    return machines

@router.get("/admin/machines/{machine_id}", response_model=schemas.Machine)
def read_admin_machine(machine_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if db_machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

@router.get("/machines/{machine_id}/flags_status", response_model=list[dict])
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

        # Get First Blood User
        first_submission = db.query(models.Submission).filter(
            models.Submission.machine_id == machine_id,
            models.Submission.flag_id == flag.id
        ).order_by(models.Submission.created_at.asc()).first()
        
        first_blood_user = None
        if first_submission:
            first_blood_user = db.query(models.User).filter(models.User.id == first_submission.user_id).first()
            first_blood_user = first_blood_user.username if first_blood_user else None

        flags_status.append({
            "id": flag.id, 
            "flag": flag.flag, 
            "is_submitted": is_submitted,
            "first_blood_user": first_blood_user
        })
    return flags_status
