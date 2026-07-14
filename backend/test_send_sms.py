import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.sms import get_sms_service


def main():
    phone = "+256762274788"
    sms = get_sms_service()
    print(f"Using SMS provider: {sms.provider}")
    success = sms.send_verification_code(phone, "Your Agriscan verification code is:")
    print("Send result:", success)

if __name__ == '__main__':
    main()
