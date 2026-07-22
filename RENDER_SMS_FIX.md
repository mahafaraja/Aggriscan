# Render SMS Fix

## Problem
SMS works on localhost but not on production (Render).

## Root Cause
In `render.yaml`, the `YOLLA_SMS_API_KEY` is marked as `sync: false`:
```yaml
- key: YOLLA_SMS_API_KEY
  sync: false  # ❌ This prevents the API key from being deployed
```

This means the API key is **not configured** on Render, so YoolaSMS can't send SMS.

## Solution

### Option 1: Manual Configuration (Recommended for secrets)
1. Go to Render dashboard: https://dashboard.render.com
2. Select your `agriscan-backend` service
3. Go to **Environment** tab
4. Add these environment variables:
   - `YOLLA_SMS_API_KEY` = `0lS43Ow7a8s4L33211511JJ504Ej60mfWvE1h14WAaP0vY1VK3O7rVzR51691F9B`
   - `GEMINI_API_KEY` = `AQ.Ab8RN6J3eD4a5OkwpIfMuxPTpHNPbEZv_wgvxTmuPZB-nwQTeQ`
5. Click **Save Changes**
6. Render will automatically redeploy

### Option 2: Auto-sync (Less secure)
Change `render.yaml` to sync the API key:
```yaml
- key: YOLLA_SMS_API_KEY
  sync: true  # ✅ This will sync from local .env
```

Then commit and push to trigger a new deployment.

## Other API Keys to Configure
Also configure these in Render dashboard:
- `GEMINI_API_KEY` (marked as `sync: false`)
- `PLANTID_API_KEY` (marked as `sync: false`)
- `PLANTNET_API_KEY` (marked as `sync: false`)

## Verification
After configuring, test the SMS endpoint:
```bash
curl -X POST https://aggriscan.onrender.com/api/v1/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "256762274788"}'
```

Check Render logs to see if YoolaSMS is being called successfully.