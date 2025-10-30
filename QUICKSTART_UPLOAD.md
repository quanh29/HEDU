# Quick Start - Upload Khóa Học

## ⚡ Chạy Nhanh

### 1. Cấu hình .env (backend)
```env
MUX_TOKEN_ID=your_mux_token_id
MUX_SECRET_KEY=your_mux_secret_key
NGROK_AUTH_TOKEN=your_ngrok_token
```

### 2. Chạy Backend
```bash
cd backend
npm start
```

Lưu ý ngrok URL trong console:
```
Ingress established at: https://xxxx.ngrok-free.app
```

### 3. Cấu hình MUX Webhook
- Vào: https://dashboard.mux.com/settings/webhooks
- Tạo webhook: `https://xxxx.ngrok-free.app/api/mux/webhook`
- Chọn events: `video.upload.*` và `video.asset.*`

### 4. Chạy Frontend
```bash
cd frontend
npm run dev
```

### 5. Test Upload
Mở: http://localhost:5173/upload-demo

---

## 📦 Components Đã Tạo

### Backend
✅ `muxUploadController.js` - MUX direct upload + webhook
✅ `materialUploadController.js` - Upload PDF/DOC/PPT
✅ `muxUploadRoute.js` - Routes cho MUX
✅ Updated `materialRoute.js` - Routes cho material
✅ Updated `video.js` model - Thêm uploadId, playbackId, status
✅ Updated `server.js` - Thêm routes và static files

### Frontend
✅ `MuxUploader` - Component upload video lên MUX
✅ `MaterialUploader` - Component upload tài liệu
✅ `QuizEditor` - Component tạo quiz
✅ `UploadDemo` - Trang demo test upload
✅ Updated `App.jsx` - Thêm route /upload-demo

---

## 🎯 API Endpoints

```
POST /api/mux/create-upload       # Tạo upload URL
POST /api/mux/webhook              # Webhook từ MUX
GET  /api/mux/status/:videoId      # Check video status

POST /api/material/upload          # Upload material
DELETE /api/material/delete/:id    # Xóa material
```

---

## 🔄 Flow Upload Video

1. Frontend request upload URL → Backend
2. Backend tạo upload trong MUX → Return URL
3. Frontend upload file trực tiếp lên MUX (UpChunk)
4. MUX gửi webhook khi upload xong → Backend update status
5. MUX gửi webhook khi encode xong → Backend update status = 'ready'
6. Frontend poll status → Hiển thị success

---

## 🐛 Debug

Check backend logs để thấy webhook:
```
🔔 MUX Webhook received: video.upload.asset_created
✅ Upload complete - Upload ID: xxx
🎬 Asset ready - Asset ID: xxx
```

Check video status:
```bash
curl http://localhost:3000/api/mux/status/{videoId}
```

---

## 📖 Tài Liệu Đầy Đủ

Xem: `backend/UPLOAD_GUIDE.md`
