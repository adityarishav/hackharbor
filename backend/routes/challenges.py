from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session, selectinload
import models, database, auth, schemas, docker
from sqlalchemy.sql import func
from docker_utils import get_or_create_docker_network, VULNVERSE_NETWORK_NAME
import os

router = APIRouter()

UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)



@router.post("/admin/challenges", response_model=schemas.Challenge)
def create_admin_challenge(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    difficulty: str = Form(...),
    points: int = Form(...),
    flags: str = Form(...), 
    file: UploadFile | None = File(None),
    docker_image: str | None = Form(None),
    release_date: str | None = Form(None), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    file_path = None
    if file:
        file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        file_path = file_location.replace("\\", "/")

    challenge_ip_address = None
    
    parsed_release_date = None
    if release_date:
        try:
            from datetime import datetime
            parsed_release_date = datetime.fromisoformat(release_date.replace('Z', '+00:00'))
        except ValueError:
            pass 

    db_challenge = models.Challenge(
        title=title,
        description=description,
        category=category,
        difficulty=difficulty,
        points=points,
        file_path=file_path,
        docker_image=docker_image,  
        ip_address=challenge_ip_address, 
        is_deleted=False,
        release_date=parsed_release_date
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)


    parsed_flags = [f.strip() for f in flags.split(',') if f.strip()]
    for flag_str in parsed_flags:
        if ':' in flag_str:
            parts = flag_str.rsplit(':', 1)
            flag_val = parts[0].strip()
            try:
                flag_points = int(parts[1].strip())
            except ValueError:
                flag_points = 0
        else:
            flag_val = flag_str
            flag_points = 0 

        db_challenge_flag = models.ChallengeFlag(
            challenge_id=db_challenge.id, 
            flag=flag_val,
            points=flag_points
        )
        db.add(db_challenge_flag)
    db.commit()
    db.refresh(db_challenge) 

    return db_challenge

@router.get("/challenges", response_model=list[schemas.Challenge])
def read_challenges(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    challenges = db.query(models.Challenge).filter(models.Challenge.is_deleted == False).offset(skip).limit(limit).all()
    return challenges

@router.get("/challenges/{challenge_id}", response_model=schemas.Challenge)
def read_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).options(selectinload(models.Challenge.active_users), selectinload(models.Challenge.flags)).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return db_challenge

@router.get("/challenges/{challenge_id}/flags_status", response_model=list[dict])
def get_challenge_flags_status(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    flags_status = []
    for flag in challenge.flags:
        if flag.is_deleted: 
            continue
        is_submitted = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.user_id == current_user.id,
            models.ChallengeSubmission.challenge_id == challenge_id,
            models.ChallengeSubmission.challenge_flag_id == flag.id,
            models.ChallengeSubmission.is_correct == True
        ).first() is not None

        #  First Blood User
        first_submission = db.query(models.ChallengeSubmission).filter(
            models.ChallengeSubmission.challenge_id == challenge_id,
            models.ChallengeSubmission.challenge_flag_id == flag.id,
            models.ChallengeSubmission.is_correct == True
        ).order_by(models.ChallengeSubmission.created_at.asc()).first()
        
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


@router.get("/ch/upcoming", response_model=list[schemas.Challenge])
def read_upcoming_challenges(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
   
    challenges = db.query(models.Challenge).filter(models.Challenge.release_date > func.now()).offset(skip).limit(limit).all()
    return challenges

@router.get("/admin/challenges/all", response_model=list[schemas.Challenge])
def read_all_challenges_admin(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    challenges = db.query(models.Challenge).offset(skip).limit(limit).all()
    return challenges

@router.get("/admin/challenges/{challenge_id}", response_model=schemas.Challenge)
def read_admin_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).options(selectinload(models.Challenge.flags)).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return db_challenge

@router.put("/admin/challenges/{challenge_id}", response_model=schemas.Challenge)
def update_challenge(challenge_id: int, challenge: schemas.ChallengeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    db_challenge.title = challenge.title
    db_challenge.description = challenge.description
    db_challenge.category = challenge.category
    db_challenge.difficulty = challenge.difficulty
    db_challenge.points = challenge.points
    db_challenge.release_date = challenge.release_date
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)

    
    existing_flags = db.query(models.ChallengeFlag).filter(models.ChallengeFlag.challenge_id == challenge_id).all()
    existing_flag_values = {f.flag: f for f in existing_flags}
    new_flag_values = {f.flag for f in challenge.flags}

    for flag_obj in existing_flags:
        if flag_obj.flag not in new_flag_values:
            flag_obj.is_deleted = True
            db.add(flag_obj)

    for flag_data in challenge.flags:
        if flag_data.flag in existing_flag_values:
            existing_flag_values[flag_data.flag].is_deleted = False
            existing_flag_values[flag_data.flag].points = flag_data.points 
            db.add(existing_flag_values[flag_data.flag])
        else:
            
            db_flag = models.ChallengeFlag(
                challenge_id=db_challenge.id, 
                flag=flag_data.flag, 
                points=flag_data.points, 
                is_deleted=False
            )
            db.add(db_flag)
    
    db.commit()
    db.refresh(db_challenge)

    return db_challenge

@router.delete("/admin/challenges/{challenge_id}", status_code=200)
def delete_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    db_challenge.is_deleted = True
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return {"message": "Challenge soft-deleted successfully"}

@router.post("/admin/challenges/{challenge_id}/start", response_model=schemas.Challenge)
def start_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    if db_challenge.ip_address:
        return db_challenge

    try:
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        try:
            container = client.containers.get(container_name)
            container.stop()
            container.remove()
        except docker.errors.NotFound:
            pass 

        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
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

@router.post("/admin/challenges/{challenge_id}/stop", response_model=schemas.Challenge)
def stop_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

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
            pass

        db_challenge.ip_address = None
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)
        return db_challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop Docker container for challenge: {e}")



@router.post("/admin/challenges/{challenge_id}/restart", response_model=schemas.Challenge)
def restart_admin_challenge(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    try:
        if db_challenge.ip_address is not None:
            client = docker.from_env()
            container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"
            try:
                container = client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass 

        db_challenge.active_users.clear()
        db_challenge.ip_address = None
        db.commit()

        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        # image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
        )
        container.reload()
        challenge_ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        db_challenge.ip_address = challenge_ip_address
   
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)

        return {"message": f"Challenge {db_challenge.title} has been restarted successfully. New IP is {challenge_ip_address}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during challenge restart: {e}")


@router.post("/challenges/{challenge_id}/start", response_model=schemas.Challenge)
def start_challenge_user(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    if current_user not in db_challenge.active_users:
        db_challenge.active_users.append(current_user)
        db.commit()
        db.refresh(db_challenge)
    else:
        
        return db_challenge 

    
    if db_challenge.ip_address:
        return db_challenge

    try:
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        try:
            
            container = client.containers.get(container_name)
            container.stop()
            container.remove()
        except docker.errors.NotFound:
            pass 

        #  image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
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


@router.post("/challenges/{challenge_id}/stop", response_model=schemas.Challenge)
def stop_challenge_user(challenge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not db_challenge.docker_image:
        raise HTTPException(status_code=400, detail="Challenge does not have a Docker image configured.")

    # Remove the current user from the list of active users 
    if current_user in db_challenge.active_users:
        db_challenge.active_users.remove(current_user)
        db.commit()
        db.refresh(db_challenge)
        print(f"--- After removing user from active_users: active_users={[user.username for user in db_challenge.active_users]}, ip_address={db_challenge.ip_address} ---")
    else:
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
                pass 

            db_challenge.ip_address = None
            db.add(db_challenge)
            db.commit()
            db.refresh(db_challenge)
            print(f"--- After stopping challenge globally: active_users={[user.username for user in db_challenge.active_users]}, ip_address={db_challenge.ip_address} ---")
            return {"message": f"Challenge {db_challenge.title} stopped globally."}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while stopping the challenge: {e}")

    return {"message": f"Challenge {db_challenge.title} is no longer active for you, but remains running for other users."}

@router.post("/challenges/{challenge_id}/restart", response_model=schemas.Challenge)
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
                pass 

        # --- Step 2: Clear active users and IP address in DB ---
        db_challenge.active_users.clear()
        db_challenge.ip_address = None
        db.commit()

        # --- Step 3: Start a new container for the challenge ---
        client = docker.from_env()
        network = get_or_create_docker_network()
        container_name = f"challenge-{db_challenge.title.replace(' ', '-').lower()}-{db_challenge.id}"

        #  image exists
        try:
            client.images.get(db_challenge.docker_image)
        except docker.errors.ImageNotFound:
            raise HTTPException(status_code=404, detail=f"Docker image {db_challenge.docker_image} not found.")

        container = client.containers.run(
            db_challenge.docker_image,
            name=container_name,
            detach=True,
            network=network.name,
        )
        container.reload()
        challenge_ip_address = container.attrs['NetworkSettings']['Networks'][VULNVERSE_NETWORK_NAME]['IPAddress']

        # --- Step 4: Update DB with new IP 
        db_challenge.ip_address = challenge_ip_address
        db_challenge.active_users.append(current_user)
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)

        return {"message": f"Challenge {db_challenge.title} has been restarted successfully. New IP is {challenge_ip_address}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during challenge restart: {e}")


@router.get("/leaderboard", response_model=list[dict])
def get_leaderboard(db: Session = Depends(database.get_db)):
   
    users = db.query(models.User).all()
    
    leaderboard_data = []
    for user in users:
        challenge_score = db.query(func.sum(models.ChallengeFlag.points)).join(
            models.ChallengeSubmission, models.ChallengeFlag.id == models.ChallengeSubmission.challenge_flag_id
        ).filter(
            models.ChallengeSubmission.user_id == user.id,
            models.ChallengeSubmission.is_correct == True
        ).scalar() or 0

        total_score = challenge_score 
        
        leaderboard_data.append({
            "username": user.username,
            "score": total_score,
            "id": user.id
        })
    
    leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
    
    return leaderboard_data
