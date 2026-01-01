from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import json
import re
import models, database, auth, schemas, email_utils

router = APIRouter()

def generate_otp():
    import random, string
    return ''.join(random.choices(string.digits, k=4))

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

@router.post("/auth/register-request")
def register_request(request: schemas.RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    #  if user already exists
    existing_user = db.query(models.User).filter((models.User.email == request.email) | (models.User.username == request.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already registered")
    
    is_valid, message = validate_password(request.password)
    if is_valid == False:
        raise HTTPException(status_code=400, detail=message)
    
    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=4)
    
    # Store in OTP table
    payload_json = json.dumps(request.dict())
    
    # Check if otp is there or not
    db.query(models.OTPCode).filter(models.OTPCode.email == request.email, models.OTPCode.type == 'register').delete()
    
    otp_entry = models.OTPCode(
        email=request.email,
        otp=otp,
        type='register',
        payload=payload_json,
        expires_at=expires_at
    )
    db.add(otp_entry)
    db.commit()
    
    # Send Email
    background_tasks.add_task(email_utils.send_otp_email, request.email, otp, 'register')
    
    return {"message": "Verification code sent to email"}

@router.post("/auth/verify-register", response_model=schemas.User)
def verify_register(request: schemas.RegisterVerify, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    
    otp_record = db.query(models.OTPCode).filter(
        models.OTPCode.email == request.email,
        models.OTPCode.otp == request.otp,
        models.OTPCode.type == 'register'
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if otp_record.expires_at < datetime.now(timezone.utc):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Create User
    user_data = json.loads(otp_record.payload)
    hashed_password = auth.get_password_hash(user_data['password'])
    
    new_user = models.User(
        username=user_data['username'],
        email=user_data['email'],
        password=hashed_password,
        role=user_data.get('role', 'user')
    )
    db.add(new_user)
    
    # Delete OTP
    db.delete(otp_record)
    
    # otp cleanup
    db.query(models.OTPCode).filter(models.OTPCode.email == request.email).delete()
    
    db.commit()
    db.refresh(new_user)
    
    # Send Welcome Email
    background_tasks.add_task(email_utils.send_welcome_email, new_user.email, new_user.username)
    
    return new_user

@router.post("/auth/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=4)
    
    # Cleanup old reset codes
    db.query(models.OTPCode).filter(models.OTPCode.email == request.email, models.OTPCode.type == 'reset').delete()
    
    otp_entry = models.OTPCode(
        email=request.email,
        otp=otp,
        type='reset',
        expires_at=expires_at
    )
    db.add(otp_entry)
    db.commit()
    
    background_tasks.add_task(email_utils.send_otp_email, request.email, otp, 'reset')
    return {"message": "Password reset code sent"}

@router.post("/auth/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    otp_record = db.query(models.OTPCode).filter(
        models.OTPCode.email == request.email,
        models.OTPCode.otp == request.otp,
        models.OTPCode.type == 'reset'
    ).first()
    
    if not otp_record:
         raise HTTPException(status_code=400, detail="Invalid OTP")
         
    if otp_record.expires_at < datetime.now(timezone.utc):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired")
        
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_valid, message = validate_password(request.new_password)
    if is_valid == False:
        raise HTTPException(status_code=400, detail=message)
    
    user.password = auth.get_password_hash(request.new_password)
    db.delete(otp_record)
    db.commit()
    
    return {"message": "Password updated successfully"}
