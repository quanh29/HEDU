# Quick Fix - Upload Video Error

## 🚨 Lỗi: "Failed to create upload URL"

### ⚡ Giải pháp nhanh (3 bước):

#### 1️⃣ Chạy debug script
```powershell
.\debug-upload.ps1
```

Hoặc từng bước:
```bash
node check-env.js
node test-mux.js
```

#### 2️⃣ Kiểm tra .env file
File: `backend/.env`

**Cần có:**
```env
MUX_TOKEN_ID=abcd1234...
MUX_SECRET_KEY=xyz789...
```

**Lấy credentials:**
→ https://dashboard.mux.com/settings/access-tokens

#### 3️⃣ Restart server
```bash
npm start
```

---

## 🔍 Debug Checklist

- [ ] `.env` file exists in `backend/` folder
- [ ] `MUX_TOKEN_ID` has value
- [ ] `MUX_SECRET_KEY` has value
- [ ] Restarted server after changing `.env`
- [ ] `node check-env.js` shows all green ✅
- [ ] `node test-mux.js` passes without errors

---

## 📋 Terminal Commands

```bash
# Check environment
node check-env.js

# Test MUX connection
node test-mux.js

# Run debug script (PowerShell)
.\debug-upload.ps1

# Start server
npm start
```

---

## 🆘 Still Having Issues?

Run this and send me the output:
```bash
node check-env.js > debug-output.txt 2>&1
node test-mux.js >> debug-output.txt 2>&1
```

---

## 📄 Files Created for Debug:
- ✅ `check-env.js` - Check environment variables
- ✅ `test-mux.js` - Test MUX connection
- ✅ `debug-upload.ps1` - Run all checks
- ✅ `DEBUG_UPLOAD.md` - Full debug guide
