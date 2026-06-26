from app.services.sms import SMSService


def test_demo_otp_accepts_common_uganda_phone_formats():
    service = SMSService()

    assert service.verify_code('+256762000000', '123456') is True
    assert service.verify_code('0762000000', '123456') is True
    assert service.verify_code('256762000000', '123456') is True
