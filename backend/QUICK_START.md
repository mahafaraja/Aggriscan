# Quick Start Guide - Agriscan Fixes

## 🚀 What Was Fixed

1. ✅ **SECRET_KEY** - Now consistent across local and production
2. ✅ **GEMINI_API_KEY** - Added to production configuration
3. ✅ **Fallback APIs** - PlantID and PlantNet configured
4. ✅ **SMS Service** - Documented all options (currently using Mock)
5. ✅ **Database Docs** - Complete schema and user information

## ⚡ Quick Deploy (5 Minutes)

### 1. Commit Changes
```bash
git add .
git commit -m "Fix auth and API configuration for production"
git push origin main
```

### 2. Update Render Environment Variables
Go to https://dashboard.render.com → agriscan-backend → Environment

**Add/Update these variables:**
```
SECRET_KEY=agriscan-2026-vectoria-university-bcs-project-jwt-secret-key-xyz789
GEMINI_API_KEY=AQ.Ab8RN6J3eD4a5OkwpIfMuxPTpHNPbEZv_wgvxTmuPZB-nwQTeQ
SMS_PROVIDER=mock
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Wait for Deployment
- Render will auto-deploy (2-3 minutes)
- Check status at https://aggriscan.onrender.com/health

### 4. Test
```bash
# Health check
curl https://aggriscan.onrender.com/health

# Should return: {"database":"ok","status":"ok"}
```

## 🔑 Login Credentials

### Demo (SMS Auth)
```
Phone: +256762000000
Code: 123456
```

### Default Users (Password Auth)
```
Farmer:  +256700000001 / Password123
Officer: +256700000002 / Password123
Admin:   +256700000003 / Password123
```

## 📱 Test the App

1. **Open app** - Should show auth screen
2. **Enter demo phone** - +256762000000
3. **Enter code** - 123456
4. **Login successful** - Goes to home screen
5. **Take photo** - Camera opens
6. **Scan plant** - Gemini API identifies plant
7. **View results** - Shows disease detection
8. **Logout** - Clears token
9. **Login again** - Works without errors ✅

## 🗄️ Database Info

**What's in the database:**
- 3 default users (farmer, officer, admin)
- Scans are saved when you use the app
- Each scan has: crop type, disease, confidence, GPS location, severity

**View data:**
```bash
# Connect via Render dashboard
# Then run:
SELECT * FROM users;
SELECT * FROM reports;
```

## 📚 Documentation

- `DEPLOYMENT_FIXES.md` - Complete deployment guide
- `DATABASE_SETUP.md` - Database schema and queries
- `API_SETUP_GUIDE.md` - Plant identification APIs
- `FIREBASE_SMS_SETUP.md` - SMS provider options

## 🐛 If Something Breaks

1. **Check Render logs** - Dashboard > agriscan-backend > Logs
2. **Verify env vars** - Dashboard > Environment
3. **Test health endpoint** - https://aggriscan.onrender.com/health
4. **Check SECRET_KEY** - Must match in local and Render

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Render environment variables updated
- [ ] Deployment successful
- [ ] Health check returns OK
- [ ] Demo login works
- [ ] Plant scanning works
- [ ] No errors in logs

## 🎯 What's Next

1. **Use the app** - Scan plants, view results
2. **Monitor logs** - Check for errors
3. **Optional**: Add PlantID API key for better accuracy
4. **Optional**: Switch to Africa's Talking for real SMS
5. **Optional**: Generate new SECRET_KEY for production

## 📞 Need Help?

- Check `DEPLOYMENT_FIXES.md` for detailed troubleshooting
- Review Render logs for specific errors
- Test API at https://aggriscan.onrender.com/docs