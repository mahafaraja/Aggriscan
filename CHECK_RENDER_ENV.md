# Check Render Environment Variables

## Problem
SMS works locally but not on production. The API key might not be configured on Render.

## How to Check

### 1. Access Render Dashboard
1. Go to https://dashboard.render.com
2. Sign in with your account
3. Find your service: `agriscan-backend`
4. Click on the service name

### 2. Check Environment Variables
1. Click on the **Environment** tab (left sidebar)
2. Look for these variables:
   - `YOLLA_SMS_API_KEY` - Should be set
   - `GEMINI_API_KEY` - Should be set
   - `SMS_PROVIDER` - Should be `yoola`

### 3. If Missing, Add Them
Click **Add Environment Variable** and add:
```
Key: YOLLA_SMS_API_KEY
Value: 0lS43Ow7a8s4L33211511JJ504Ej60mfWvE1h14WAaP0vY1VK3O7rVzR51691F9B
```

```
Key: GEMINI_API_KEY
Value: AQ.Ab8RN6J3eD4a5OkwpIfMuxPTpHNPbEZv_wgvxTmuPZB-nwQTeQ
```

### 4. Redeploy
After adding environment variables:
- Click **Save Changes**
- Render will automatically trigger a new deployment
- Wait 2-3 minutes for deployment to complete

## Alternative: Check via API
You can also check if the API key is set by looking at Render logs:
1. Go to your service dashboard
2. Click on **Logs** tab
3. Look for any errors related to SMS or YoolaSMS
4. Check if there are messages like "YoolaSMS API key not configured"

## Quick Test After Configuring
Once you've added the API key to Render, test again:
```bash
curl -X POST https://aggriscan.onrender.com/api/v1/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "256762274788"}'
```

Then check your phone for the SMS.