from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, database, auth

router = APIRouter()

@router.get("/admin/analytics", response_model=dict)
def get_admin_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    total_users = db.query(models.User).count()
    total_machines = db.query(models.Machine).count()
    total_submissions = db.query(models.Submission).count()

    # registration trend
    user_registration_trends = [
        {"date": item.created_at.isoformat(), "count": item.count}
        for item in db.query(
            models.User.created_at,
            func.count(models.User.id).label('count')
        ).group_by(models.User.created_at).order_by(models.User.created_at).all()
    ]

    # Submission trend 
    submission_trends = [
        {"date": item.created_at.isoformat(), "count": item.count}
        for item in db.query(
            models.Submission.created_at,
            func.count(models.Submission.id).label('count')
        ).group_by(models.Submission.created_at).order_by(models.Submission.created_at).all()
    ]

    # Machine popularity
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

    # Challenge Stats
    total_challenges = db.query(models.Challenge).count()
    total_challenge_solves = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.is_correct == True).count()

    # Challenge Popularity
    challenge_popularity = [
        {"name": item.title, "submission_count": item.submission_count}
        for item in db.query(
            models.Challenge.title,
            func.count(models.ChallengeSubmission.id).label('submission_count')
        ).join(models.ChallengeSubmission).filter(models.ChallengeSubmission.is_correct == True).group_by(models.Challenge.title).order_by(func.count(models.ChallengeSubmission.id).desc()).limit(5).all()
    ]

    # Combined Skill Breakdown 
    category_counts = {}

    # Challenge Categories
    challenge_cats = db.query(
        models.Challenge.category,
        func.count(models.ChallengeSubmission.id).label('count')
    ).join(models.ChallengeSubmission).filter(models.ChallengeSubmission.is_correct == True).group_by(models.Challenge.category).all()

    for cat, count in challenge_cats:
        cat_name = cat.capitalize() if cat else "Uncategorized"
        category_counts[cat_name] = category_counts.get(cat_name, 0) + count

    # Machine Categories
    machine_cats = db.query(
        models.Machine.category,
        func.count(models.Submission.id).label('count')
    ).join(models.Submission).group_by(models.Machine.category).all()

    for cat, count in machine_cats:
        cat_name = cat.capitalize() if cat else "Uncategorized"
        category_counts[cat_name] = category_counts.get(cat_name, 0) + count

    skill_breakdown = [{"category": cat, "count": count} for cat, count in category_counts.items()]

    # Recent First Bloods
    first_bloods = []
    
    # Machine First Bloods
    machines = db.query(models.Machine).all()
    for machine in machines:
        first_submission = db.query(models.Submission).filter(models.Submission.machine_id == machine.id).order_by(models.Submission.created_at.asc()).first()
        if first_submission:
            user = db.query(models.User).filter(models.User.id == first_submission.user_id).first()
            first_bloods.append({
                "type": "Machine",
                "name": machine.name,
                "username": user.username if user else "Unknown",
                "timestamp": first_submission.created_at,
                "avatar": None
            })

    # Challenge First Bloods
    challenges = db.query(models.Challenge).all()
    for challenge in challenges:
        first_submission = db.query(models.ChallengeSubmission).filter(models.ChallengeSubmission.challenge_id == challenge.id, models.ChallengeSubmission.is_correct == True).order_by(models.ChallengeSubmission.created_at.asc()).first()
        if first_submission:
            user = db.query(models.User).filter(models.User.id == first_submission.user_id).first()
            first_bloods.append({
                "type": "Challenge",
                "name": challenge.title,
                "username": user.username if user else "Unknown",
                "timestamp": first_submission.created_at,
                "avatar": None
            })

    # Sort by timestamp desc and take top 10
    first_bloods.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_first_bloods = first_bloods[:10]

    return {
        "total_users": total_users,
        "total_machines": total_machines,
        "total_submissions": total_submissions,
        "total_challenges": total_challenges,
        "total_challenge_solves": total_challenge_solves,
        "user_registration_trends": user_registration_trends,
        "submission_trends": submission_trends,
        "machine_popularity": machine_popularity,
        "challenge_popularity": challenge_popularity,
        "skill_breakdown": skill_breakdown,
        "top_users": top_users,
        "machine_completion_rates": machine_completion_rates,
        "recent_first_bloods": recent_first_bloods
    }

@router.get("/admin/stats", response_model=dict)
def get_admin_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    total_users = db.query(models.User).count()
    active_machines = db.query(models.Machine).filter(models.Machine.ip_address != None).count()
    total_submissions = db.query(models.Submission).count() + db.query(models.ChallengeSubmission).count()
    active_sessions = db.query(models.User).join(models.active_machines_association).distinct().count()

    return {
        "total_users": total_users,
        "active_machines": active_machines,
        "total_submissions": total_submissions,
        "active_sessions": active_sessions,
    }


@router.get("/admin/badges", response_model=list[dict])
def get_badges(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    badges = db.query(models.Badge).all()
    return [{"id": b.id, "name": b.name, "description": b.description, "icon": b.icon, "condition_type": b.condition_type, "condition_value": b.condition_value} for b in badges]

@router.post("/admin/badges", response_model=dict)
def create_badge(badge: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    # Check if badge exists
    existing = db.query(models.Badge).filter(models.Badge.name == badge['name']).first()
    if existing:
        raise HTTPException(status_code=400, detail="Badge with this name already exists")
    
    new_badge = models.Badge(
        name=badge['name'],
        description=badge['description'],
        icon=badge['icon'],
        condition_type=badge.get('condition_type'),
        condition_value=badge.get('condition_value')
    )
    db.add(new_badge)
    db.commit()
    db.refresh(new_badge)
    return {"id": new_badge.id, "name": new_badge.name}

@router.put("/admin/badges/{badge_id}", response_model=dict)
def update_badge(badge_id: int, badge_data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    badge = db.query(models.Badge).filter(models.Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    badge.name = badge_data.get('name', badge.name)
    badge.description = badge_data.get('description', badge.description)
    badge.icon = badge_data.get('icon', badge.icon)
    badge.condition_type = badge_data.get('condition_type', badge.condition_type)
    badge.condition_value = badge_data.get('condition_value', badge.condition_value)
    
    db.commit()
    return {"message": "Badge updated successfully"}

@router.delete("/admin/badges/{badge_id}")
def delete_badge(badge_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    badge = db.query(models.Badge).filter(models.Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    db.delete(badge)
    db.commit()
    return {"message": "Badge deleted successfully"}
