from pydantic import BaseModel, field_validator
from datetime import datetime
from fastapi import HTTPException

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
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

    class Config:
        from_attributes = True

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
    source_identifier: str # Docker image name or VirtualBox VM name/UUID
    category: str | None = None
    difficulty: str | None = None
    flags: list[FlagCreate] = []

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

