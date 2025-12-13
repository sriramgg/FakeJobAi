"""
FakeJobAI - Email Service Module
Sends professional welcome emails to users after registration/login
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

# Email configuration - Update these in your .env file
EMAIL_CONFIG = {
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "sender_email": os.getenv("FAKEJOBAI_EMAIL", ""),
    "sender_password": os.getenv("FAKEJOBAI_EMAIL_PASSWORD", ""),  # Use App Password for Gmail
    "sender_name": "FakeJobAI"
}


def get_welcome_email_template(user_name: str, user_email: str) -> str:
    """Generate beautiful HTML welcome email template"""
    
    current_year = datetime.now().year
    
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FakeJobAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
    
    <!-- Main Container -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0f4f8; padding: 40px 20px;">
        <tr>
            <td align="center">
                
                <!-- Email Card -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4361ee 0%, #4cc9f0 100%); padding: 40px 40px 60px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                FakeJob<span style="opacity: 0.9;">AI</span>
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                                🛡️ AI-Powered Job Scam Detection
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Welcome Icon Circle -->
                    <tr>
                        <td align="center" style="padding: 0;">
                            <div style="width: 80px; height: 80px; background: #ffffff; border-radius: 50%; margin-top: -40px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: inline-block; line-height: 80px; font-size: 40px;">
                                🎉
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 30px 40px 40px 40px; text-align: center;">
                            
                            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 26px; font-weight: 700;">
                                Welcome to FakeJobAI!
                            </h2>
                            
                            <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                Hi <strong style="color: #4361ee;">{user_name}</strong>, thank you for joining our community of smart job seekers!
                            </p>
                            
                            <!-- Divider -->
                            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #4361ee, #4cc9f0); margin: 0 auto 25px auto; border-radius: 2px;"></div>
                            
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 15px; line-height: 1.7;">
                                You're now protected by our AI-powered system that analyzes job postings 
                                and warns you about potential scams before you apply.
                            </p>
                            
                            <!-- Features Grid -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="33%" style="padding: 10px; text-align: center;">
                                        <div style="font-size: 30px; margin-bottom: 8px;">🔍</div>
                                        <div style="color: #374151; font-size: 13px; font-weight: 600;">URL Scanner</div>
                                        <div style="color: #9ca3af; font-size: 11px;">Paste any job link</div>
                                    </td>
                                    <td width="33%" style="padding: 10px; text-align: center;">
                                        <div style="font-size: 30px; margin-bottom: 8px;">🤖</div>
                                        <div style="color: #374151; font-size: 13px; font-weight: 600;">AI Analysis</div>
                                        <div style="color: #9ca3af; font-size: 11px;">Instant detection</div>
                                    </td>
                                    <td width="33%" style="padding: 10px; text-align: center;">
                                        <div style="font-size: 30px; margin-bottom: 8px;">📊</div>
                                        <div style="color: #374151; font-size: 13px; font-weight: 600;">Risk Score</div>
                                        <div style="color: #9ca3af; font-size: 11px;">0-100 rating</div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <a href="http://localhost/dashboard.html" style="display: inline-block; background: linear-gradient(135deg, #4361ee 0%, #4cc9f0 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);">
                                🚀 Start Scanning Jobs
                            </a>
                            
                            <p style="margin: 25px 0 0 0; color: #9ca3af; font-size: 13px;">
                                Or install our <a href="#" style="color: #4361ee; text-decoration: none;">Chrome Extension</a> for instant protection while browsing.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- Stats Bar -->
                    <tr>
                        <td style="background: #f8fafc; padding: 25px 40px; border-top: 1px solid #e5e7eb;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td width="33%" style="text-align: center;">
                                        <div style="color: #4361ee; font-size: 24px; font-weight: 700;">50K+</div>
                                        <div style="color: #9ca3af; font-size: 11px;">Jobs Scanned</div>
                                    </td>
                                    <td width="33%" style="text-align: center;">
                                        <div style="color: #ef4444; font-size: 24px; font-weight: 700;">2.5K+</div>
                                        <div style="color: #9ca3af; font-size: 11px;">Scams Detected</div>
                                    </td>
                                    <td width="33%" style="text-align: center;">
                                        <div style="color: #10b981; font-size: 24px; font-weight: 700;">10K+</div>
                                        <div style="color: #9ca3af; font-size: 11px;">Protected Users</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Tips Section -->
                    <tr>
                        <td style="padding: 30px 40px; background: #ffffff;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">💡 Quick Tips to Stay Safe:</h3>
                            <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                                <li>Never pay for job applications or training</li>
                                <li>Verify company details on LinkedIn before applying</li>
                                <li>Be cautious of jobs with unrealistic salary promises</li>
                                <li>Report suspicious jobs to help protect others</li>
                            </ul>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #1f2937; padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                                FakeJob<span style="color: #4cc9f0;">AI</span>
                            </p>
                            
                            <!-- Social Links -->
                            <p style="margin: 0 0 20px 0;">
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Twitter</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">LinkedIn</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">GitHub</a>
                            </p>
                            
                            <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                                You received this email because you signed up for FakeJobAI.<br>
                                © {current_year} FakeJobAI. All rights reserved.
                            </p>
                            
                            <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 11px;">
                                <a href="#" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a> · 
                                <a href="#" style="color: #9ca3af; text-decoration: none;">Privacy Policy</a> · 
                                <a href="#" style="color: #9ca3af; text-decoration: none;">Terms of Service</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Footer Note -->
                <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                    This email was sent to <a href="mailto:{user_email}" style="color: #4361ee; text-decoration: none;">{user_email}</a>
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
"""
    return html


def send_welcome_email(user_email: str, user_name: str = "Job Seeker") -> dict:
    """
    Send a professional welcome email to new users.
    
    Args:
        user_email: User's email address
        user_name: User's display name
        
    Returns:
        dict with success status and message
    """
    
    # Get credentials from environment
    sender_email = os.getenv("FAKEJOBAI_EMAIL", "")
    sender_password = os.getenv("FAKEJOBAI_EMAIL_PASSWORD", "")
    
    # If no credentials, try reading from .env file
    if not sender_email or not sender_password:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith("FAKEJOBAI_EMAIL="):
                        sender_email = line.split("=", 1)[1].strip()
                    elif line.startswith("FAKEJOBAI_EMAIL_PASSWORD="):
                        sender_password = line.split("=", 1)[1].strip()
    
    if not sender_email or not sender_password:
        return {
            "success": False,
            "error": "Email credentials not configured. Add FAKEJOBAI_EMAIL and FAKEJOBAI_EMAIL_PASSWORD to .env"
        }
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🎉 Welcome to FakeJobAI - Your Job Safety Shield is Active!"
        msg["From"] = f"FakeJobAI <{sender_email}>"
        msg["To"] = user_email
        
        # Plain text version (fallback)
        text_content = f"""
Welcome to FakeJobAI!

Hi {user_name},

Thank you for joining FakeJobAI! You're now protected by our AI-powered job scam detection system.

What you can do:
- Scan any job URL for fraud indicators
- Get instant AI analysis with risk scores
- Access our Chrome Extension for browsing protection

Start scanning: http://localhost/dashboard.html

Stay safe,
The FakeJobAI Team
        """
        
        # HTML version
        html_content = get_welcome_email_template(user_name, user_email)
        
        # Attach both versions
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Send via SMTP
        with smtplib.SMTP(EMAIL_CONFIG["smtp_server"], EMAIL_CONFIG["smtp_port"]) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, user_email, msg.as_string())
        
        return {
            "success": True,
            "message": f"Welcome email sent to {user_email}"
        }
        
    except smtplib.SMTPAuthenticationError:
        return {
            "success": False,
            "error": "SMTP authentication failed. For Gmail, use an App Password (not regular password)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def send_scam_alert_email(user_email: str, job_title: str, risk_score: int) -> dict:
    """Send an alert email when a high-risk job is detected"""
    
    # Similar structure, different template
    # Implementation for future use
    pass


# Test function
if __name__ == "__main__":
    # Test the email template
    html = get_welcome_email_template("John Doe", "john@example.com")
    with open("test_email.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Test email template saved to test_email.html")
