"""
FakeJobAI - Premium Email Service Module
Sends professional, stunning welcome emails as a Background Task.
"""
import os
import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

# Email configuration
EMAIL_CONFIG = {
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "sender_name": "FakeJobAI Security"
}

def log_email_event(message: str):
    """Log email events to a local file for diagnosis"""
    log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "email_logs.txt")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")

def get_welcome_email_template(user_name: str, user_email: str) -> str:
    """Generate a stunning, premium HTML welcome email template"""
    
    current_year = datetime.now().year
    primary_gradient = "linear-gradient(135deg, #7c4dff 0%, #4cc9f0 100%)"
    
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <title>Welcome to FakeJobAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8faff; color: #1e293b;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8faff; padding: 40px 10px;">
        <tr>
            <td align="center">
                <!-- Brand Logo Section -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="margin-bottom: 25px;">
                    <tr>
                        <td align="center">
                            <h2 style="margin: 0; font-size: 26px; color: #0f172a; font-weight: 800; letter-spacing: -0.5px;">
                                FakeJob<span style="color: #7c4dff;">A<span style="color: #ff4081;">ı</span></span>
                            </h2>
                        </td>
                    </tr>
                </table>

                <!-- Main Premium Card -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 32px; box-shadow: 0 30px 60px rgba(124, 77, 255, 0.08); overflow: hidden; border: 1px solid #eef2f6;">
                    <!-- Hero Section -->
                    <tr>
                        <td style="background: {primary_gradient}; padding: 70px 40px; text-align: center; color: #ffffff;">
                            <div style="font-size: 56px; margin-bottom: 25px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));">🛡️</div>
                            <h1 style="margin: 0; font-size: 36px; font-weight: 800; line-height: 1.2; letter-spacing: -1px;">
                                Your Career is Now<br>AI-Protected!
                            </h1>
                        </td>
                    </tr>

                    <!-- Welcom Content Body -->
                    <tr>
                        <td style="padding: 50px 50px 40px 50px;">
                            <h2 style="margin-top: 0; color: #0f172a; font-size: 24px; font-weight: 700;">Welcome to the inner circle, {user_name}!</h2>
                            <p style="color: #64748b; font-size: 17px; line-height: 1.7; margin-bottom: 35px;">
                                We're thrilled to have you! FakeJobAI is your personal security guard in the job market, using cutting-edge neural analysis to verify employment listings instantly.
                            </p>
                            
                            <!-- Value Props Grid -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="50%" style="padding: 8px;">
                                        <div style="background: #f8fbff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; height: 100px;">
                                            <div style="font-size: 20px; margin-bottom: 8px;">🔍</div>
                                            <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 4px;">Instant Scanner</div>
                                            <div style="font-size: 12px; color: #64748b;">Verify any URL instantly.</div>
                                        </div>
                                    </td>
                                    <td width="50%" style="padding: 8px;">
                                        <div style="background: #f8fbff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; height: 100px;">
                                            <div style="font-size: 20px; margin-bottom: 8px;">🎭</div>
                                            <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 4px;">Pattern Spotting</div>
                                            <div style="font-size: 12px; color: #64748b;">AI detects fraud language.</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Checklist Section -->
                            <div style="background: #fff9ed; border-radius: 24px; padding: 30px; margin-bottom: 40px; border: 1px solid #ffecb3;">
                                <h3 style="margin-top: 0; color: #9a6700; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
                                    <span style="font-size: 20px; margin-right: 10px;">🛡️</span> Quick Security Checklist
                                </h3>
                                <ul style="padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
                                    <li>Never pay for training or equipment upfront.</li>
                                    <li>Be wary of jobs offered via WhatsApp or Telegram only.</li>
                                    <li>Verify the recruiter's email domain matches the official site.</li>
                                    <li>Trust your gut: If the salary seems too good to be true, it is.</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-bottom: 40px;">
                                <a href="http://127.0.0.1:8000/dashboard.html" style="background-color: #7c4dff; color: #ffffff; padding: 20px 45px; border-radius: 20px; text-decoration: none; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 15px 30px rgba(124, 77, 255, 0.25); transition: all 0.3s;">
                                    Start Secure Search Now
                                </a>
                            </div>

                            <!-- Trust Bar -->
                            <div style="border-top: 1px solid #f1f5f9; padding-top: 35px; text-align: center;">
                                <p style="font-size: 14px; color: #94a3b8; font-style: italic; max-width: 400px; margin: 0 auto; line-height: 1.5;">
                                    "Our mission is to ensure that no job seeker ever falls victim to employment fraud again."
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Footer and Socials -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="margin-top: 40px; text-align: center;">
                    <tr>
                        <td style="color: #94a3b8; font-size: 14px;">
                            <p style="margin-bottom: 15px; font-weight: 600; color: #64748b;">FakeJobAI - The Gold Standard in Employment Security</p>
                            <p style="margin-bottom: 25px;">
                                <a href="mailto:support@fakejobai.com" style="color: #7c4dff; text-decoration: none; margin: 0 12px;">Support</a> •
                                <a href="#" style="color: #7c4dff; text-decoration: none; margin: 0 12px;">Help Center</a> •
                                <a href="#" style="color: #7c4dff; text-decoration: none; margin: 0 12px;">Privacy Policy</a>
                            </p>
                            <p style="font-size: 12px; opacity: 0.7;">
                                &copy; {current_year} FakeJobAI Technology. You received this because you registered on our platform.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html

def send_welcome_email(user_email: str, user_name: str = "Job Seeker") -> dict:
    """
    Next Level: Asynchronous-ready email delivery with deep diagnostic logging.
    """
    
    # 1. Load Credentials (Robust Method)
    sender_email = os.getenv("FAKEJOBAI_EMAIL")
    sender_password = os.getenv("FAKEJOBAI_EMAIL_PASSWORD")
    
    if not sender_email or not sender_password:
        # Fallback to .env file manual parse
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        if k.strip() == "FAKEJOBAI_EMAIL": sender_email = v.strip().strip('"').strip("'")
                        if k.strip() == "FAKEJOBAI_EMAIL_PASSWORD": sender_password = v.strip().strip('"').strip("'")
    
    # Clean password (remove spaces)
    if sender_password:
        sender_password = sender_password.replace(" ", "")

    if not sender_email or not sender_password:
        print("❌ [Email Service] CRITICAL: Credentials missing.")
        return {"success": False, "error": "SMTP credentials not found"}

    print(f"📧 [Email Service] Preparing welcome email for: {user_email}")
    log_email_event(f"START: Preparing welcome email for {user_email}")

    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🎉 Welcome to FakeJobAI - Your Job Safety Shield is Active!"
        msg["From"] = f"FakeJobAI <{sender_email}>"
        msg["To"] = user_email
        
        # HTML & Text versions
        html_content = get_welcome_email_template(user_name, user_email)
        text_content = f"Welcome to FakeJobAI, {user_name}! Your career is now protected. Visit http://localhost:8000/dashboard.html to start."
        
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        
        # Delivery
        print(f"📡 [Email Service] Connecting to {EMAIL_CONFIG['smtp_server']}...")
        log_email_event(f"CONNECTING: {EMAIL_CONFIG['smtp_server']}")
        with smtplib.SMTP(EMAIL_CONFIG["smtp_server"], EMAIL_CONFIG["smtp_port"], timeout=30) as server:
            server.set_debuglevel(0) # Set to 1 for deep SMTP logs in terminal
            server.starttls()
            print(f"🔑 [Email Service] Authenticating...")
            server.login(sender_email, sender_password)
            print(f"📤 [Email Service] Sending to {user_email}...")
            server.sendmail(sender_email, user_email, msg.as_string())
        
        print(f"✅ [Email Service] SUCCESS: Email delivered to {user_email}")
        log_email_event(f"SUCCESS: Email delivered to {user_email}")
        return {"success": True, "message": f"Delivered to {user_email}"}
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ [Email Service] FAILED: {error_msg}")
        log_email_event(f"FAILED: {user_email} - Error: {error_msg}")
        return {"success": False, "error": error_msg}

if __name__ == "__main__":
    # Test template only
    print("Email Service Diagnostics...")
    print("Testing template generation...")
    html = get_welcome_email_template("Developer", "test@example.com")
    with open("email_preview.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Template preview saved to email_preview.html")
