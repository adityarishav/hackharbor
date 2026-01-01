from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import re
from sqlalchemy import func
import models, database, auth, schemas, email_utils

router = APIRouter()

def validate_password(password: str) -> tuple[bool, str]:
        if len(password) < 6:
            return False, "Password must be at least 6 characters long."
        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter."
        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter."
        if not re.search(r"\d", password):
            return False, "Password must contain at least one number."
        if not re.search(r"[^a-zA-Z0-9]", password):
            return False, "Password must contain at least one special character."

        return True, "Password is valid."

@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    print("--- Entering create_user function ---")
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        print("--- User already exists, raising HTTPException ---")
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        print("--- User already exists, raising HTTPException ---")
        raise HTTPException(status_code=400, detail="email already registered")
    
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
    
    # Send welcome email in background
    if user.email:
        background_tasks.add_task(email_utils.send_welcome_email, user.email, user.username)
        
    print("--- Returning created user ---")
    return db_user

@router.put("/users/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify current password if changing password or email
    if user_update.password:
        if not user_update.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not auth.verify_password(user_update.current_password, current_user.password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        is_valid, message = validate_password(user_update.password)
        if is_valid == False:
            raise HTTPException(status_code=400, detail=message)
        hashed_password = auth.get_password_hash(user_update.password)
        current_user.password = hashed_password

    if user_update.email:
        # Check if email is taken by another user
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users/profile", response_model=dict)
def get_user_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # 1. Calculate Total Score
    challenge_score = db.query(func.sum(models.ChallengeFlag.points)).join(
        models.ChallengeSubmission, models.ChallengeFlag.id == models.ChallengeSubmission.challenge_flag_id
    ).filter(
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.is_correct == True
    ).scalar() or 0

    machine_score = db.query(models.Submission).filter(models.Submission.user_id == current_user.id).count() * 10
    total_score = challenge_score + machine_score

    # 2. Calculate Rank
    # Get all users and their scores
    users = db.query(models.User).all()
    user_scores = []
    for user in users:
        c_score = db.query(func.sum(models.ChallengeFlag.points)).join(
            models.ChallengeSubmission, models.ChallengeFlag.id == models.ChallengeSubmission.challenge_flag_id
        ).filter(
            models.ChallengeSubmission.user_id == user.id,
            models.ChallengeSubmission.is_correct == True
        ).scalar() or 0
        m_score = db.query(models.Submission).filter(models.Submission.user_id == user.id).count() * 10
        user_scores.append({"id": user.id, "score": c_score + m_score})
    
    # Sort by score descending
    user_scores.sort(key=lambda x: x['score'], reverse=True)
    
    # Find current user's rank
    rank = next((i + 1 for i, u in enumerate(user_scores) if u['id'] == current_user.id), 0)

    # 3. Get Counts
    solved_challenges = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.is_correct == True
    ).count()

    solved_machines = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id
    ).count()

    # 4. Get Recent Activity
    recent_submissions = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id
    ).order_by(models.Submission.created_at.desc()).limit(5).all()

    activity_log = []
    for sub in recent_submissions:
        machine = db.query(models.Machine).filter(models.Machine.id == sub.machine_id).first()
        activity_log.append({
            "type": "Machine",
            "name": machine.name if machine else "Unknown Machine",
            "points": 10, # Hardcoded for now
            "date": sub.created_at
        })

    recent_challenge_submissions = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.is_correct == True
    ).order_by(models.ChallengeSubmission.created_at.desc()).limit(5).all()

    for sub in recent_challenge_submissions:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == sub.challenge_id).first()
        flag = db.query(models.ChallengeFlag).filter(models.ChallengeFlag.id == sub.challenge_flag_id).first()
        activity_log.append({
            "type": "Challenge",
            "name": challenge.title if challenge else "Unknown Challenge",
            "points": flag.points if flag else 0,
            "date": sub.created_at
        })

    # Sort combined activity by date
    activity_log.sort(key=lambda x: x['date'], reverse=True)
    activity_log = activity_log[:10] # Keep top 10

    # 5. Calculate Category Scores (for Radar Chart)
    category_scores = {}
    
    # Challenge Categories
    challenge_cats = db.query(
        models.Challenge.category,
        func.sum(models.ChallengeFlag.points)
    ).join(models.ChallengeSubmission, models.Challenge.id == models.ChallengeSubmission.challenge_id)\
     .join(models.ChallengeFlag, models.ChallengeSubmission.challenge_flag_id == models.ChallengeFlag.id)\
     .filter(models.ChallengeSubmission.user_id == current_user.id, models.ChallengeSubmission.is_correct == True)\
     .group_by(models.Challenge.category).all()
    
    for cat, score in challenge_cats:
        category_scores[cat] = category_scores.get(cat, 0) + (score or 0)

    # Machine Categories (assuming 10 pts per machine)
    machine_cats = db.query(
        models.Machine.category,
        func.count(models.Submission.id)
    ).join(models.Submission, models.Machine.id == models.Submission.machine_id)\
     .filter(models.Submission.user_id == current_user.id)\
     .group_by(models.Machine.category).all()

    for cat, count in machine_cats:
        # Normalize category names if needed (e.g., "Web" vs "web")
        cat_name = cat if cat else "Uncategorized"
        category_scores[cat_name] = category_scores.get(cat_name, 0) + (count * 10)

    # 6. Calculate Daily Solves (for Heatmap)
    # Get all dates from submissions
    daily_activity = {}
    
    all_challenge_dates = db.query(func.date(models.ChallengeSubmission.created_at), func.count(models.ChallengeSubmission.id))\
        .filter(models.ChallengeSubmission.user_id == current_user.id, models.ChallengeSubmission.is_correct == True)\
        .group_by(func.date(models.ChallengeSubmission.created_at)).all()
        
    all_machine_dates = db.query(func.date(models.Submission.created_at), func.count(models.Submission.id))\
        .filter(models.Submission.user_id == current_user.id)\
        .group_by(func.date(models.Submission.created_at)).all()

    for date_obj, count in all_challenge_dates:
        date_str = date_obj.isoformat()
        daily_activity[date_str] = daily_activity.get(date_str, 0) + count

    for date_obj, count in all_machine_dates:
        date_str = date_obj.isoformat()
        daily_activity[date_str] = daily_activity.get(date_str, 0) + count

    heatmap_data = [{"date": date, "count": count} for date, count in daily_activity.items()]

    # 7. Badges Logic (Dynamic)
    badges = []
    
    # Calculate specific counts
    total_challenges_solved = solved_challenges
    total_machines_solved = solved_machines
    total_solves = total_challenges_solved + total_machines_solved

    # Calculate First Blood Count
    # Find all machines where this user has the earliest submission
    first_bloods = 0
    # Get all machine IDs the user has solved
    user_machine_submissions = db.query(models.Submission).filter(models.Submission.user_id == current_user.id).all()
    solved_machine_ids = {sub.machine_id for sub in user_machine_submissions}
    
    for m_id in solved_machine_ids:
        # Get the very first submission for this machine
        first_submission = db.query(models.Submission).filter(models.Submission.machine_id == m_id).order_by(models.Submission.created_at.asc()).first()
        if first_submission and first_submission.user_id == current_user.id:
            first_bloods += 1

    # Calculate Challenge First Bloods
    user_challenge_submissions = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.user_id == current_user.id, models.ChallengeSubmission.is_correct == True).all()
    solved_challenge_ids = {sub.challenge_id for sub in user_challenge_submissions}

    for c_id in solved_challenge_ids:
        # Get the very first correct submission for this challenge
        first_submission = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.challenge_id == c_id, models.ChallengeSubmission.is_correct == True).order_by(models.ChallengeSubmission.created_at.asc()).first()
        if first_submission and first_submission.user_id == current_user.id:
            first_bloods += 1

    # Fetch all badges from DB
    all_badges = db.query(models.Badge).all()
    
    # Fetch user's existing badges
    user_badges = db.query(models.UserBadge).filter(models.UserBadge.user_id == current_user.id).all()
    user_badge_ids = {ub.badge_id for ub in user_badges}
    
    for badge in all_badges:
        awarded = False
        if badge.id in user_badge_ids:
            awarded = True
        else:
            # Check conditions for automatic awarding
            if badge.condition_type == 'total_solves' and badge.condition_value is not None:
                if total_solves >= badge.condition_value:
                    awarded = True
            elif badge.condition_type == 'total_challenges_solved' and badge.condition_value is not None:
                if total_challenges_solved >= badge.condition_value:
                    awarded = True
            elif badge.condition_type == 'total_machines_solved' and badge.condition_value is not None:
                if total_machines_solved >= badge.condition_value:
                    awarded = True
            elif badge.condition_type == 'first_blood_count' and badge.condition_value is not None:
                if first_bloods >= badge.condition_value:
                    awarded = True
            elif badge.condition_type == 'specific_machine_id' and badge.condition_value is not None:
                # Check if user has solved this specific machine
                if badge.condition_value in solved_machine_ids:
                    awarded = True
            elif badge.condition_type == 'specific_challenge_id' and badge.condition_value is not None:
                # Check if user has solved this specific challenge
                has_solved_challenge = db.query(models.ChallengeSubmission).filter(
                    models.ChallengeSubmission.user_id == current_user.id,
                    models.ChallengeSubmission.challenge_id == badge.condition_value,
                    models.ChallengeSubmission.is_correct == True
                ).first()
                if has_solved_challenge:
                    awarded = True
            elif badge.condition_type == 'category_score' and badge.condition_value is not None:
                # Parse category from description or name if not explicitly stored?
                if ':' in badge.condition_type:
                    cat_type, cat_name = badge.condition_type.split(':', 1)
                    if cat_type == 'category_score':
                        if category_scores.get(cat_name, 0) >= badge.condition_value:
                            awarded = True
            
            if awarded:
                # Award the badge!
                new_user_badge = models.UserBadge(user_id=current_user.id, badge_id=badge.id)
                db.add(new_user_badge)
                db.commit() # Commit immediately to save progress
                user_badge_ids.add(badge.id)

        if awarded:
            badges.append({"name": badge.name, "icon": badge.icon, "description": badge.description})

    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "total_score": total_score,
        "rank": rank,
        "solved_challenges": solved_challenges,
        "solved_machines": solved_machines,
        "first_blood_count": first_bloods, 
        "recent_activity": activity_log, 
        "category_scores": category_scores,
        "heatmap_data": heatmap_data,
        "badges": badges
    }

@router.get("/users/me/score", response_model=dict)
def get_my_score(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    score = db.query(models.Submission.flag_id).filter(
        models.Submission.user_id == current_user.id
    ).distinct().count()
    return {"score": score}

@router.get("/users/me/submissions", response_model=list[schemas.Submission])
def get_my_submissions(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    submissions = db.query(models.Submission).filter(models.Submission.user_id == current_user.id).all()
    return submissions

@router.get("/admin/users", response_model=list[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.put("/admin/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.role = user.role
    db.commit()
    db.refresh(db_user)
    return db_user

 
