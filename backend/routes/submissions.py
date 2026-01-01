from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth, schemas

router = APIRouter()

@router.post("/submissions/", response_model=schemas.Submission)
def create_submission(submission: schemas.SubmissionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    machine = db.query(models.Machine).filter(models.Machine.id == submission.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Check if correct flags for this machine
    is_correct_flag = db.query(models.Flag).filter(
        models.Flag.machine_id == submission.machine_id,
        models.Flag.flag == submission.flag
    ).first()

    if not is_correct_flag:
        raise HTTPException(status_code=400, detail="Incorrect flag")

    db_submission = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id,
        models.Submission.machine_id == submission.machine_id,
        models.Submission.flag_id == is_correct_flag.id # Check 
    ).first()
    if db_submission:
        raise HTTPException(status_code=400, detail="Flag already submitted")

    db_submission = models.Submission(
        user_id=current_user.id,
        machine_id=submission.machine_id,
        flag=submission.flag,
        flag_id=is_correct_flag.id 
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    # Check if this is the first successful submission by this user for this machine
    existing_submissions_by_user_for_machine = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id,
        models.Submission.machine_id == submission.machine_id
    ).count()

    if existing_submissions_by_user_for_machine == 1: 
        machine.solves += 1
        db.add(machine)
        db.commit()
        db.refresh(machine)
    
    return db_submission



@router.post("/challenges/{challenge_id}/submit", response_model=schemas.ChallengeSubmission)
def submit_challenge_flag(
    challenge_id: int,
    submission: schemas.ChallengeSubmissionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Verify the submitted flag 
    is_correct = False
    correct_challenge_flag = None
    for cf in challenge.flags:
        if submission.flag == cf.flag:
            is_correct = True
            correct_challenge_flag = cf
            break

    if not is_correct:
        raise HTTPException(status_code=400, detail="Incorrect flag")

   
    db_submission = db.query(models.ChallengeSubmission).filter(
        models.ChallengeSubmission.user_id == current_user.id,
        models.ChallengeSubmission.challenge_id == challenge_id,
        models.ChallengeSubmission.challenge_flag_id == correct_challenge_flag.id, 
        models.ChallengeSubmission.is_correct == True 
    ).first()

    if db_submission:
        raise HTTPException(status_code=400, detail="Flag already submitted correctly for this challenge")

    new_submission = models.ChallengeSubmission(
        user_id=current_user.id,
        challenge_id=challenge_id,
        challenge_flag_id=correct_challenge_flag.id, 
        submitted_flag=submission.flag, 
        is_correct=True 
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    return new_submission
