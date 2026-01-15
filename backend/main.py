from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import models, database, auth
import os
from routes import auth as auth_routes, machines, vpn, submissions, analytics, users, challenges, communication, academy


models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")

STATIC_DIRECTORY = "static"
if not os.path.exists(STATIC_DIRECTORY):
    os.makedirs(STATIC_DIRECTORY)
app.mount("/static", StaticFiles(directory=STATIC_DIRECTORY), name="static")


app.include_router(auth.auth_router) # Token endpoints
app.include_router(auth_routes.router) # Registration endpoints
app.include_router(machines.router)
app.include_router(challenges.router)
app.include_router(vpn.router)
app.include_router(submissions.router)
app.include_router(analytics.router)
app.include_router(users.router)
app.include_router(communication.router)
app.include_router(academy.router)
origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://localhost:8080", 
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
