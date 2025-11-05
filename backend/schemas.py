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

class User(UserBase):
    id: int
    created_at: datetime
    role: str
    email: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    role: str

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
    source_identifier: str | None = None # Docker image name or VirtualBox VM name/UUID
    category: str | None = None
    difficulty: str | None = None
    flags: list[FlagCreate] = []
    # New fields
    provider: str = "docker"
    operating_system: str | None = None
    config_json: str | None = None
    solves: int = 0

class MachineCreate(MachineBase):
    pass

class Machine(MachineBase):
    id: int
    ip_address: str | None = None
    is_deleted: bool
    active_users: list[User] = []

    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    # flag: str  # Removed as it will be derived from flag_id
    pass

class SubmissionCreate(SubmissionBase):
    flag: str # Still need flag for submission input
    machine_id: int

class Submission(SubmissionBase):
    id: int
    user_id: int
    machine_id: int
    flag_id: int # New field
    flag: str # Keep flag for response
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

class ChallengeFlagCreate(ChallengeFlagBase):
    pass

class ChallengeFlag(ChallengeFlagBase):
    id: int
    challenge_id: int
    is_deleted: bool

    class Config:
        from_attributes = True

class ChallengeBase(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    points: int
    file_path: str | None = None
    docker_image: str | None = None # New field
    flags: list[ChallengeFlagCreate] = [] # New field for multiple flags

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int
    created_at: datetime
    ip_address: str | None = None # New field
    is_deleted: bool
    flags: list[ChallengeFlag] = [] # New field for multiple flags

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

