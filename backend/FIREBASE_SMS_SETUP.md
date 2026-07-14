# Firebase SMS Setup Guide

## Current Status
The app currently uses **Mock SMS** for development. To enable Firebase SMS:

## Option 1: Firebase Authentication (Recommended)
Firebase Auth provides built-in phone number authentication:

### Setup Steps:
1. **Enable Firebase Auth in Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project
   - Navigate to Authentication > Sign-in method
   - Enable "Phone" provider

2. **Install Firebase Admin SDK**
   ```bash
   pip install firebase-admin
   ```

3. **Add Firebase Service Account**
   - In Firebase Console, go to Project Settings > Service Accounts
   - Generate new private key
   - Save as `firebase-service-account.json` in backend folder
   - Add to `.gitignore`

4. **Update SMS Service**
   The `firebase_sms.py` service is already created but needs integration with Firebase Auth.

## Option 2: Keep Mock SMS (Current)
For development and testing, the app uses mock SMS:
- Verification codes are logged to console
- Demo phone: `+256762000000`
- Demo code: `123456`
- Works without any external service

## Option 3: Africa's Talking (Production Ready)
For production SMS in Uganda:

### Setup:
1. Sign up at https://africastalking.com
2. Get API key and username
3. Update `backend/.env`:
   ```env
   SMS_PROVIDER=africastalking
   AFRICASTALKING_USERNAME=your_username
   AFRICASTALKING_API_KEY=your_api_key
   ```

## Option 4: Twilio (Global)
For global SMS delivery:

### Setup:
1. Sign up at https://twilio.com
2. Get Account SID, Auth Token, and phone number
3. Update `backend/.env`:
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## Current Configuration
- **Provider**: Mock (development)
- **Demo Credentials**: Phone `+256762000000`, Code `123456`
- **Default Users**: Seeded in database (see DATABASE_SETUP.md)

## Recommendation
For your BCS project:
1. **Development**: Keep Mock SMS
2. **Testing**: Use demo credentials
3. **Production**: Switch to Africa's Talking for Uganda market