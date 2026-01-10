import asyncio
import aiosmtplib
from email.message import EmailMessage
from email.headerregistry import Address
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


MAIL_USERNAME = "<email>"
MAIL_PASSWORD = "<email_app_secret>"
MAIL_FROM = "<email>"
MAIL_PORT = 587
MAIL_SERVER = "smtp.gmail.com"
MAIL_FROM_NAME = "HackHarbor"

async def send_welcome_email(email: str, username: str):
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "Welcome to HackHarbor!"
    message["From"] = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
    message["To"] = email

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #06b6d4; text-align: center;">Welcome to HackHarbor!</h1>
            <p>Hi <strong>{username}</strong>,</p>
            <p>We're thrilled to have you on board! You've successfully registered for an account at HackHarbor.</p>
            <p>Get ready to dive into our cybersecurity challenges, master new skills, and climb the leaderboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/login" style="background-color: #06b6d4; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy Hacking!</p>
            <p>The HackHarbor Team</p>
        </div>
    </body>
    </html>
    """

    part = MIMEText(html_content, "html")
    message.attach(part)

    try:
        await aiosmtplib.send(
            message,
            hostname=MAIL_SERVER,
            port=MAIL_PORT,
            start_tls=True,
            username=MAIL_USERNAME,
            password=MAIL_PASSWORD
        )
        print(f"Welcome email sent to {email}")
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")

async def send_otp_email(email: str, otp: str, type: str):
   
    subject = "Verification Code - HackHarbor"
    if type == "register":
        title = "Complete Your Registration"
        body_text = "Use the following code to complete your registration:"
    else:
        title = "Reset Your Password"
        body_text = "Use the following code to reset your password:"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #06b6d4; text-align: center;">{title}</h1>
            <p>Hi,</p>
            <p>{body_text}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: #f3f4f6; color: #333; padding: 15px 30px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border: 2px dashed #06b6d4;">{otp}</span>
            </div>
            
            <p>This code is valid for 4 hours.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>The HackHarbor Team</p>
        </div>
    </body>
    </html>
    """

   
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
    message["To"] = email

    part = MIMEText(html_content, "html")
    message.attach(part)

    try:
        await aiosmtplib.send(
            message,
            hostname=MAIL_SERVER,
            port=MAIL_PORT,
            start_tls=True,
            username=MAIL_USERNAME,
            password=MAIL_PASSWORD
        )
        print(f"OTP email sent to {email}")
    except Exception as e:
        print(f"Failed to send OTP email to {email}: {e}")

