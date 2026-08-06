# YoolaSMS Backend Integration

## Overview
This document describes the complete YoolaSMS integration with the Agriscan backend, enabling OTP-based phone authentication for the mobile application.

## Architecture

### Authentication Flow
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Mobile    │      │   Backend   │      │  YoolaSMS   │
│   App       │      │   API       │      │   API       │
└─────────────┘      └─────────────┘      └─────────────┘
       │                     │                     │
       │  1. POST /auth/sms/send                   │
       │────────────────────>│                     │
       │                     │  2. POST /send_sms  │
       │                     │────────────────────>│
       │                     │  3. SMS Delivered   │
       │                     │<────────────────────│
       │  4. {message: "sent"}│                     │
       │<────────────────────│                     │
       │                     │                     │
       │  5. POST /auth/sms/verify                 │
       │────────────────────>│                     │
       │                     │  6. Verify code     │
       │                     │  7. Create/Get User │
       │                     │  8. Generate JWT    │
       │  9. {access_token}   │                     │
       │<────────────────────│                     │
       │                     │                     │
```

## Changes Made

### 1. Backend Configuration (`backend/app/config.py`)
Added YoolaSMS configuration options:
- `YOLLA_SMS_API_KEY`: API key for YoolaSMS service
- `YOLLA_SMS_API_BASE`: Base URL for YoolaSMS API (default: `https://yoolasms.com/api/v1`)
- Updated `SMS_PROVIDER` options to include `yoola`

### 2. SMS Service (`backend/app/services/sms.py`)
Added YoolaSMS provider implementation:
- `_send_yoola()`: Sends SMS via YoolaSMS API
- Integrated into the main `send_verification_code()` method
- Handles API errors and logging

### 3. Frontend Authentication Flow (`frontend/src/screens/auth/AuthFlow.tsx`)
Updated to use backend endpoints:
- **Send OTP**: Calls `POST /api/v1/auth/sms/send` instead of YoolaSMS directly
- **Verify OTP**: Calls `POST /api/v1/auth/sms/verify` to get JWT token
- Removed direct YoolaSMS API calls from frontend
- Token is now properly issued by backend after verification

### 4. Environment Configuration
Created `backend/.env.example` with YoolaSMS configuration template

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Send SMS Verification Code
```http
POST /api/v1/auth/sms/send
Content-Type: application/json

{
  "phone_number": "256762274788"
}
```

**Response:**
```json
{
  "message": "Verification code sent successfully"
}
```

**Error Response:**
```json
{
  "detail": "Failed to send SMS verification code"
}
```

#### Verify SMS Code
```http
POST /api/v1/auth/sms/verify
Content-Type: application/json

{
  "phone_number": "256762274788",
  "code": "123456"
}
```

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response:**
```json
{
  "detail": "Invalid or expired verification code"
}
```

### Protected Endpoints (Require Authentication)

All protected endpoints require the JWT token in the Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Sync Reports
```http
POST /api/v1/reports/sync
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "crop_type": "Cassava",
    "disease_label": "CMD_Infected",
    "confidence_score": 0.95,
    "latitude": 0.3476,
    "longitude": 32.5825,
    "severity": "High",
    "offline_created_at": "2026-07-20T10:00:00Z"
  }
]
```

#### Get Nearby Reports
```http
GET /api/v1/reports/nearby?latitude=0.3476&longitude=32.5825&radius_meters=5000
Authorization: Bearer {token}
```

#### Get Outbreak Hotspots
```http
GET /api/v1/reports/hotspots?radius_meters=2000&threshold_count=5
Authorization: Bearer {token}
```

## Setup Instructions

### 1. Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your YoolaSMS credentials:

```env
SMS_PROVIDER=yoola
YOLLA_SMS_API_KEY=your_actual_api_key_here
YOLLA_SMS_API_BASE=https://yoolasms.com/api/v1
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The `requests` library is already included in `requirements.txt` for YoolaSMS API calls.

### 3. Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Configuration

The frontend is already configured to use the backend endpoints. Ensure the API base URL is set correctly in `frontend/src/config/api.ts`:

```typescript
// For development
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000

// For production
EXPO_PUBLIC_API_BASE_URL=https://aggriscan.onrender.com
```

### 5. Start Frontend

```bash
cd frontend
npm start
```

## Testing

### Test SMS Sending
```bash
curl -X POST "http://localhost:8000/api/v1/auth/sms/send" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "256762274788"}'
```

### Test SMS Verification
```bash
# First, send an OTP to get the code (check backend logs for mock mode)
curl -X POST "http://localhost:8000/api/v1/auth/sms/verify" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "256762274788", "code": "123456"}'
```

### Test Protected Endpoint
```bash
# Replace {token} with the access_token from verification
curl -X GET "http://localhost:8000/api/v1/reports/nearby?latitude=0.3476&longitude=32.5825&radius_meters=5000" \
  -H "Authorization: Bearer {token}"
```

## Phone Number Format

The system expects phone numbers in **E.164 format** (international format with + prefix):
- **Valid**: `+256762274788`, `+256712345678`
- **Invalid**: `0772345678`, `712345678`

The backend automatically normalizes phone numbers:
- `0772345678` → `+256772345678`
- `712345678` → `+256712345678`
- `256712345678` → `+256712345678`

## User Registration

### Auto-Registration
When a user verifies their phone number for the first time:
1. Backend checks if user exists in database
2. If not, creates new user with:
   - `role`: "farmer"
   - `sub_county`: "Unknown"
   - `password`: "default_password" (should be changed on first login)
3. Issues JWT token

### Demo Phone Number
For testing purposes, use the demo phone number:
- **Phone**: `+256762000000`
- **Code**: `123456`
- This bypasses actual SMS sending and always succeeds

## Security Considerations

1. **JWT Tokens**: 
   - Expire after 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
   - Stored securely on frontend using Expo SecureStore
   - Signed with SECRET_KEY

2. **Rate Limiting**: 
   - Not currently implemented
   - Consider adding rate limiting for production

3. **Phone Number Verification**:
   - Codes are stored in-memory (lost on server restart)
   - Consider using Redis for production

4. **HTTPS**:
   - Always use HTTPS in production
   - Never send JWTs over unencrypted connections

## Troubleshooting

### SMS Not Sending
1. Check `SMS_PROVIDER` is set to `yoola`
2. Verify `YOLLA_SMS_API_KEY` is correct
3. Check backend logs for errors
4. Test YoolaSMS API directly:
   ```bash
   curl -X POST "https://yoolasms.com/api/v1/send_sms" \
     -H "Content-Type: application/json" \
     -d '{"api_key": "YOUR_KEY", "phone": "256762274788", "message": "Test"}'
   ```

### Verification Fails
1. Ensure phone number format is correct (256XXXXXXXXX)
2. Check if code has expired (codes are in-memory only)
3. Verify backend logs for verification attempts

### JWT Token Not Working
1. Check `SECRET_KEY` is set in backend `.env`
2. Verify token hasn't expired (24 hours default)
3. Ensure Authorization header format is correct: `Bearer {token}`

## Production Deployment

### Environment Variables
Set these in your production environment:

```env
SMS_PROVIDER=yoola
YOLLA_SMS_API_KEY=production_api_key
YOLLA_SMS_API_BASE=https://yoolasms.com/api/v1
DATABASE_URL=postgresql://user:pass@host:5432/agriscan
SECRET_KEY=strong-random-secret-key-here
```

### Recommended Additions
1. **Redis**: For persistent verification code storage
2. **Rate Limiting**: Prevent SMS abuse
3. **Code Expiration**: Add time-based code expiry
4. **Monitoring**: Track SMS delivery rates and failures
5. **Logging**: Structured logging for production debugging

## Migration from Firebase

If migrating from Firebase authentication:

1. **Frontend**: Already updated to use backend endpoints
2. **Backend**: YoolaSMS provider added alongside Firebase (both can coexist)
3. **Database**: Existing users remain unchanged
4. **Switch Provider**: Change `SMS_PROVIDER` from `firebase` to `yoola`

## Support

For YoolaSMS API issues, contact YoolaSMS support or check their documentation at:
- API Base URL: `https://yoolasms.com/api/v1`
- Documentation: https://yoolasms.com/

For Agriscan backend issues, check the backend logs and ensure all environment variables are correctly configured.