from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# many-to-many
active_machines_association = Table(
    'active_machines', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('machine_id', Integer, ForeignKey('machines.id'), primary_key=True)
)

active_challenges_association = Table(
    'active_challenges', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('challenge_id', Integer, ForeignKey('challenges.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("Submission", back_populates="user")
    active_machines = relationship("Machine", secondary=active_machines_association, back_populates="active_users")
    active_challenges = relationship("Challenge", secondary=active_challenges_association, back_populates="active_users")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    source_identifier = Column(String, nullable=True) 
    ip_address = Column(String, nullable=True)
    category = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False) 
    provider = Column(String, default="docker") 
    operating_system = Column(String, nullable=True) 
    config_json = Column(String, nullable=True) 
    solves = Column(Integer, default=0) 
    release_date = Column(DateTime(timezone=True), nullable=True) 
    status = Column(String, default="upcoming")

    flags = relationship("Flag", back_populates="machine", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="machine")
    active_users = relationship("User", secondary=active_machines_association, back_populates="active_machines")


class Flag(Base):
    __tablename__ = "flags"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    flag = Column(String)
    is_deleted = Column(Boolean, default=False) 

    machine = relationship("Machine", back_populates="flags")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    machine_id = Column(Integer, ForeignKey("machines.id"))
    flag_id = Column(Integer, ForeignKey("flags.id")) 
    flag = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="submissions")
    machine = relationship("Machine", back_populates="submissions")

class Changelog(Base):
    __tablename__ = "changelogs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    admin_id = Column(Integer, ForeignKey("users.id")) 
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(String)

    machine = relationship("Machine")
    admin = relationship("User")

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String)
    difficulty = Column(String)
    points = Column(Integer)
    flag = Column(String)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # New fields for Docker integration
    docker_image = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False)
    release_date = Column(DateTime(timezone=True), nullable=True)

    submissions = relationship("ChallengeSubmission", back_populates="challenge")
    flags = relationship("ChallengeFlag", back_populates="challenge", cascade="all, delete-orphan")
    active_users = relationship("User", secondary=active_challenges_association, back_populates="active_challenges")

class ChallengeFlag(Base):
    __tablename__ = "challenge_flags"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    flag = Column(String)
    points = Column(Integer, default=0) # Add points column
    is_deleted = Column(Boolean, default=False)

    challenge = relationship("Challenge", back_populates="flags")

class ChallengeSubmission(Base):
    __tablename__ = "challenge_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    challenge_flag_id = Column(Integer, ForeignKey("challenge_flags.id"), nullable=True) 
    submitted_flag = Column(String)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    challenge = relationship("Challenge", back_populates="submissions")
    challenge_flag = relationship("ChallengeFlag")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    location = Column(String) # e.g., "Online", "Room 101"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    icon = Column(String) # FontAwesome icon name, e.g., "FaTrophy"
    condition_type = Column(String, nullable=True) # e.g., "total_solves", "category_score"
    condition_value = Column(Integer, nullable=True) # e.g., 10, 100
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_badges = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    order = Column(Integer, default=0)
    cover_image = Column(String, nullable=True) # URL to image
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"))
    title = Column(String, index=True)
    content = Column(String) # Markdown content
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    module = relationship("Module", back_populates="lessons")

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp = Column(String)
    type = Column(String)  # 'register' or 'reset'
    payload = Column(String, nullable=True)  # JSON string for registration data
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
