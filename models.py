from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# Association table for the many-to-many relationship between users and active machines
active_machines_association = Table(
    'active_machines', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('machine_id', Integer, ForeignKey('machines.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user") # New role column
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("Submission", back_populates="user")
    active_machines = relationship("Machine", secondary=active_machines_association, back_populates="active_users")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    source_identifier = Column(String, nullable=True) # Docker image name or VirtualBox VM name/UUID
    ip_address = Column(String, nullable=True)
    category = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False) # New field

    flags = relationship("Flag", back_populates="machine", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="machine")
    active_users = relationship("User", secondary=active_machines_association, back_populates="active_machines")


class Flag(Base):
    __tablename__ = "flags"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    flag = Column(String)
    is_deleted = Column(Boolean, default=False) # New field

    machine = relationship("Machine", back_populates="flags")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    machine_id = Column(Integer, ForeignKey("machines.id"))
    flag_id = Column(Integer, ForeignKey("flags.id")) # New flag_id column
    flag = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="submissions")
    machine = relationship("Machine", back_populates="submissions")

class Changelog(Base):
    __tablename__ = "changelogs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    admin_id = Column(Integer, ForeignKey("users.id")) # Admin who made the change
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(String)

    machine = relationship("Machine")
    admin = relationship("User")


