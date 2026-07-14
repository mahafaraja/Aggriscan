# API Services Setup Guide

## Plant Identification Services (Green-Sense Pipeline)

The app uses a **3-tier fallback system** for plant identification:

### Tier 1: Gemini API (Primary)
**Status**: ✅ Connected (Free API key configured)
- **Purpose**: Image validation + Plant identification + Care recommendations
- **API Key**: `GEMINI_API_KEY` in `.env`
- **Model**: `gemini-2.0-flash`
- **Cost**: Free tier available
- **Fallback**: Automatically tries Tier 2 if fails

### Tier 2: PlantID API (Fallback 1)
**Status**: ⚠️ Needs API Key
- **Purpose**: Enhanced plant identification
- **API Key**: `PLANTID_API_KEY` in `.env`
- **Sign Up**: https://web.plant.id
- **Cost**: Freemium model
- **Fallback**: Automatically tries Tier 3 if fails

### Tier 3: PlantNet API (Fallback 2)
**Status**: ⚠️ Needs API Key
- **Purpose**: Additional fallback identification
- **API Key**: `PLANTNET_API_KEY` in `.env`
- **Sign Up**: https://my-api.plantnet.org
- **Cost**: Free tier available
- **Fallback**: Returns error if all services fail

## How the Fallback Works

```python
# From plant_identification.py
def identify_plant(self, image_path: str):
    # 1. Try Gemini (Primary)
    result = self.identify_with_gemini(image_path)
    if result.get('success'):
        return result  # Success!
    
    # 2. Try PlantID (Fallback 1)
    result = self.identify_with_plantid(image_path)
    if result.get('success'):
        return result  # Success!
    
    # 3. Try PlantNet (Fallback 2)
    result = self.identify_with_plantnet(image_path)
    if result.get('success'):
        return result  # Success!
    
    # 4. All failed
    return {"success": False, "error": "All services failed"}
```

## Setup Instructions

### 1. Gemini API (Already Configured)
✅ **Already working** - No action needed
```env
GEMINI_API_KEY=gimini_keys_here
```

### 2. PlantID API (Optional but Recommended)
**Steps:**
1. Go to https://web.plant.id
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `backend/.env`:
   ```env
   PLANTID_API_KEY=your_actual_api_key_here
   ```
5. Add to Render environment variables

**Benefits:**
- Better accuracy for specific plant species
- Larger database of plants
- Faster response times

### 3. PlantNet API (Optional)
**Steps:**
1. Go to https://my-api.plantnet.org
2. Sign up for API access
3. Get your API key
4. Add to `backend/.env`:
   ```env
   PLANTNET_API_KEY=your_actual_api_key_here
   ```
5. Add to Render environment variables

**Benefits:**
- Free tier available
- Good for European/African plants
- Scientific classification

## Testing the Fallback

### Test with Invalid Gemini Key
```bash
# Temporarily set invalid key to test fallback
GEMINI_API_KEY=invalid_key
```

### Check Logs
```bash
# Backend logs will show which service is being used:
# "Step 2: Identifying plant..."
# "Service used: gemini" or "Service used: plantid" or "Service used: plantnet"
# "Fallback used: True" if using fallback
```

### Expected Behavior
1. **Gemini succeeds**: `service_used: "gemini"`, `fallback_used: False`
2. **Gemini fails, PlantID succeeds**: `service_used: "plantid"`, `fallback_used: True`, `primary_failed: True`
3. **All fail**: Returns error with `services_attempted: ["gemini", "plantid", "plantnet"]`

## Current Configuration

### Development (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PLANTID_API_KEY=your_plantid_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
```

### Production (Render)
```yaml
envVars:
  - key: GEMINI_API_KEY
    sync: false  # Add your key in Render dashboard
  - key: PLANTID_API_KEY
    sync: false  # Add your key in Render dashboard
  - key: PLANTNET_API_KEY
    sync: false  # Add your key in Render dashboard
```

## Recommendation

For your BCS project:
1. **Keep Gemini** as primary (already working)
2. **Add PlantID** for better accuracy (free tier available)
3. **Skip PlantNet** unless you need additional coverage
4. **Test thoroughly** with various plant images

## Troubleshooting

### Issue: "All identification services failed"
**Solutions:**
1. Check Gemini API key is valid
2. Verify API quota not exceeded
3. Check internet connectivity
4. Review backend logs for specific errors

### Issue: "Gemini API error: 403"
**Solutions:**
1. API key invalid or expired
2. API quota exceeded
3. Check Gemini API dashboard

### Issue: Slow identification
**Solutions:**
1. Add PlantID as fallback (faster)
2. Reduce image size before upload
3. Increase timeout in code (currently 30s)