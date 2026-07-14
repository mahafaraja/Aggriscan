import os, sys, traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from firebase_admin import credentials, initialize_app
from firebase_admin import auth

p = os.path.join(os.path.dirname(__file__), 'app', 'services', 'config', 'firebase_sms.json')
print('Service account path:', p)
try:
    cred = credentials.Certificate(p)
    initialize_app(cred)
    print('Firebase initialized')
    try:
        u = auth.get_user_by_phone_number('+256762274788')
        print('User exists:', u.uid)
    except Exception as e:
        print('get_user_by_phone_number exception:')
        traceback.print_exc()
        try:
            u2 = auth.create_user(phone_number='+256762274788')
            print('Created user:', u2.uid)
        except Exception as e2:
            print('create_user exception:')
            traceback.print_exc()
except Exception:
    print('Initialization failed:')
    traceback.print_exc()
