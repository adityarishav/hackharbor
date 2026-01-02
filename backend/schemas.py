from pydantic import BaseModel, field_validator
from datetime import datetime
from fastapi import HTTPException

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    email: str
    password: str
    role: str = "user"

    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise HTTPException(status_code=422, detail='Password cannot be longer than 72 bytes')
        return v

class MachineSummary(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class ChallengeSummary(BaseModel):
    id: int
    title: str
    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    created_at: datetime
    role: str
    email: str | None = None
    active_machines: list[MachineSummary] = []
    active_challenges: list[ChallengeSummary] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    current_password: str | None = None
    role: str | None = None

class FlagBase(BaseModel):
    flag: str

class FlagCreate(FlagBase):
    pass

class Flag(FlagBase):
    id: int
    machine_id: int

    class Config:
        from_attributes = True

class MachineBase(BaseModel):
    name: str
    description: str | None = None
    source_identifier: str | None = None 
    category: str | None = None
    difficulty: str | None = None
    flags: list[FlagCreate] = []
  
    provider: str = "docker"
    operating_system: str | None = None
    config_json: str | None = None
    solves: int = 0
    release_date: datetime | None = None
    status: str = "upcoming"

class MachineCreate(MachineBase):
    pass

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"

class RegisterVerify(BaseModel):
    email: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class Machine(MachineBase):
    id: int
    ip_address: str | None = None
    is_deleted: bool
    active_users: list[User] = []

    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    
    pass

class SubmissionCreate(SubmissionBase):
    flag: str 
    machine_id: int

class Submission(SubmissionBase):
    id: int
    user_id: int
    machine_id: int
    flag_id: int 
    flag: str 
    created_at: datetime

    class Config:
        from_attributes = True

class ChangelogBase(BaseModel):
    description: str

class ChangelogCreate(ChangelogBase):
    pass

class Changelog(ChangelogBase):
    id: int
    machine_id: int
    admin_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ChallengeFlagBase(BaseModel):
    flag: str
    points: int = 0 # Add points field

class ChallengeFlagCreate(ChallengeFlagBase):
    pass

class ChallengeFlag(ChallengeFlagBase):
    id: int
    challenge_id: int
    is_deleted: bool
    points: int # Add points field

    class Config:
        from_attributes = True

class ChallengeBase(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    points: int
    file_path: str | None = None
    docker_image: str | None = None 
    flags: list[ChallengeFlagCreate] = [] 
    release_date: datetime | None = None

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int
    created_at: datetime
    ip_address: str | None = None 
    is_deleted: bool
    flags: list[ChallengeFlag] = [] 
    active_users: list[User] = []
    
    class Config:
        from_attributes = True

class ChallengeSubmissionBase(BaseModel):
    flag: str

class ChallengeSubmissionCreate(ChallengeSubmissionBase):
    pass

class ChallengeSubmission(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    challenge_flag_id: int | None = None
    submitted_flag: str
    is_correct: bool
    created_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

class AnnouncementBase(BaseModel):
    title: str
    description: str

class AnnouncementCreate(AnnouncementBase):
    pass

class Announcement(AnnouncementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LessonBase(BaseModel):
    title: str
    content: str
    order: int = 0

class LessonCreate(LessonBase):
    pass

class Lesson(LessonBase):
    id: int
    module_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    title: str
    description: str
    order: int = 0
    cover_image: str | None = None

class ModuleCreate(ModuleBase):
    pass

class Module(ModuleBase):
    id: int
    created_at: datetime
    lessons: list[Lesson] = []

    class Config:
        from_attributes = True

class ChallengeSubmissionResponse(BaseModel):
    is_correct: bool
    message: str
    points_awarded: int
