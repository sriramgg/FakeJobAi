import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.email_service import send_welcome_email

if __name__ == "__main__":
    test_email = "g.g.sriram.2004@gmail.com"
    print(f"--- START REAL SMTP TEST for {test_email} ---")
    result = send_welcome_email(test_email, "Sriram Diagnostic")
    print("--- RESULT ---")
    print(result)
