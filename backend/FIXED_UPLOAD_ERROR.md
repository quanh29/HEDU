# 🔧 Đã Sửa Lỗi Upload Video

## ❌ Lỗi Gốc
```
Failed to create upload URL
```

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. Sửa Mux Client Initialization
**File**: `controllers/muxUploadController.js`

**Trước:**
```javascript
const mux = new Mux({ ... });
const upload = await mux.video.uploads.create({ ... });
```

**Sau:**
```javascript
const { video } = new Mux({ ... });
const upload = await video.uploads.create({ ... });
```

### 2. Thêm Error Logging Chi Tiết
- ✅ Log credentials status
- ✅ Log request data
- ✅ Log MUX response
- ✅ Log error details với response data

### 3. Thêm Input Validation
```javascript
if (!lessonTitle || !sectionId) {
    return res.status(400).json({ 
        message: 'Missing required fields: lessonTitle and sectionId' 
    });
}
```

### 4. Tạo Debug Tools

#### a) `check-env.js`
Kiểm tra environment variables
```bash
node check-env.js
```

#### b) `test-mux.js`
Test kết nối MUX và tạo upload
```bash
node test-mux.js
```

#### c) `debug-upload.ps1`
Run tất cả checks (PowerShell)
```powershell
.\debug-upload.ps1
```

#### d) `utils/logger.js`
Helper functions cho logging đẹp hơn

### 5. Tạo Documentation
- ✅ `DEBUG_UPLOAD.md` - Hướng dẫn debug đầy đủ
- ✅ `QUICK_FIX.md` - Quick reference
- ✅ `FIXED_UPLOAD_ERROR.md` - File này

---

## 🚀 Cách Test Ngay

### Bước 1: Check Environment
```bash
cd backend
node check-env.js
```

**Kết quả mong đợi:**
```
✅ MUX_TOKEN_ID: Set
✅ MUX_SECRET_KEY: Set
✅ All required environment variables are set!
```

### Bước 2: Test MUX Connection
```bash
node test-mux.js
```

**Kết quả mong đợi:**
```
✅ Mux client initialized successfully
✅ Connection successful!
✅ Upload created successfully!
🎉 All tests passed! MUX is configured correctly.
```

### Bước 3: Restart Server
```bash
npm start
```

### Bước 4: Test Upload
Frontend: http://localhost:5173/upload-demo

**Backend logs sẽ hiển thị:**
```
ℹ️ Creating MUX upload for: Test Video
✅ MUX upload created: abc123...
✅ Video document created: 507f...
```

---

## 🐛 Nếu Vẫn Lỗi

### Lỗi: 401 Unauthorized
**Nguyên nhân**: Credentials sai

**Fix**:
1. Vào https://dashboard.mux.com/settings/access-tokens
2. Tạo token mới với quyền "Mux Video (Full Access)"
3. Copy TOKEN ID và SECRET KEY
4. Update `.env`:
```env
MUX_TOKEN_ID=new_token_id
MUX_SECRET_KEY=new_secret_key
```
5. Restart server

### Lỗi: Module not found
**Nguyên nhân**: Package chưa cài

**Fix**:
```bash
npm install @mux/mux-node
```

### Lỗi: Cannot read property 'uploads' of undefined
**Nguyên nhân**: Mux client initialization failed

**Fix**:
- Check `.env` file tồn tại trong thư mục `backend/`
- Check không có typo trong variable names
- Run `node check-env.js`

---

## 📋 Checklist Đầy Đủ

- [ ] File `.env` exists in `backend/` folder
- [ ] `MUX_TOKEN_ID` has valid value
- [ ] `MUX_SECRET_KEY` has valid value
- [ ] `node check-env.js` shows all green
- [ ] `node test-mux.js` passes without errors
- [ ] Server restarted after changing `.env`
- [ ] MongoDB is running
- [ ] Can access http://localhost:3000

---

## 🎯 Backend Logs để Verify

**Upload request:**
```
ℹ️ Creating MUX upload for: My Video
✅ MUX_TOKEN_ID: Set
✅ MUX_SECRET_KEY: Set
✅ MUX upload created: abc123
✅ Video document created: 507f...
```

**Webhook received:**
```
📤 MUX Webhook: video.upload.asset_created
   Data: { upload_id: "...", asset_id: "..." }
✅ Upload complete - Upload ID: xxx, Asset ID: xxx
```

**Video ready:**
```
🎬 MUX Webhook: video.asset.ready
   Data: { id: "...", playback_ids: [...] }
Video 507f... is ready to play! Playback ID: abc123
```

---

## 📞 Support

Nếu vẫn gặp vấn đề, gửi cho tôi:

1. Output của:
```bash
node check-env.js > debug.txt 2>&1
node test-mux.js >> debug.txt 2>&1
```

2. Backend console logs khi upload

3. Frontend console error (F12 → Console)

4. Screenshot của MUX Dashboard → Access Tokens

---

## ✨ Files Updated/Created

### Updated:
- ✅ `controllers/muxUploadController.js` - Fixed Mux initialization + logging

### Created:
- ✅ `check-env.js` - Environment checker
- ✅ `test-mux.js` - MUX connection tester
- ✅ `debug-upload.ps1` - PowerShell debug script
- ✅ `utils/logger.js` - Logging helpers
- ✅ `DEBUG_UPLOAD.md` - Full debug guide
- ✅ `QUICK_FIX.md` - Quick reference
- ✅ `FIXED_UPLOAD_ERROR.md` - This file
