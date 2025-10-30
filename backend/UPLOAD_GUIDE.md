# Hướng Dẫn Cấu Hình Upload Khóa Học với MUX

## 📋 Tổng Quan

Hệ thống upload khóa học hỗ trợ 3 loại nội dung:
1. **Video** - Upload lên MUX với Direct Upload
2. **Material** - Upload file PDF, DOC, PPT lên server
3. **Quiz** - Tạo câu hỏi trắc nghiệm

## 🔧 Cấu Hình Backend

### 1. Environment Variables (.env)

```env
# MUX Configuration
MUX_TOKEN_ID=your_mux_token_id
MUX_SECRET_KEY=your_mux_secret_key

# MUX Video Playback (đã có)
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_PRIVATE_KEY=base64_encoded_private_key

# Ngrok (cho webhook)
NGROK_AUTH_TOKEN=your_ngrok_token

# Base URL
VITE_BASE_URL=http://localhost:3000
```

### 2. Cài Đặt Packages (đã có)

```bash
npm install @mux/mux-node multer
```

### 3. Cấu Hình Ngrok Webhook

#### Bước 1: Chạy Ngrok
Ngrok đã được tích hợp sẵn trong `server.js`. Khi chạy server, ngrok sẽ tự động tạo public URL.

```bash
cd backend
npm start
```

Terminal sẽ hiển thị:
```
Ingress established at: https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

#### Bước 2: Cấu Hình Webhook trong MUX Dashboard

1. Truy cập: https://dashboard.mux.com/settings/webhooks
2. Click "Create New Webhook"
3. Nhập Webhook URL: `https://your-ngrok-url.ngrok-free.app/api/mux/webhook`
4. Chọn các events:
   - ✅ `video.upload.asset_created`
   - ✅ `video.asset.ready`
   - ✅ `video.asset.errored`
   - ✅ `video.upload.errored`
   - ✅ `video.upload.cancelled`
5. Click "Create Webhook"

#### Bước 3: Test Webhook

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/mux/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"video.asset.ready","data":{"id":"test"}}'
```

## 🎥 Flow Upload Video (MUX Direct Upload)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │         │   Backend   │         │     MUX     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Request Upload URL │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 2. Create Upload      │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │ 3. Return Upload URL  │
       │                       │<──────────────────────┤
       │                       │                       │
       │ 4. Upload URL         │                       │
       │<──────────────────────┤                       │
       │                       │                       │
       │ 5. Upload File (UpChunk)                      │
       ├──────────────────────────────────────────────>│
       │                       │                       │
       │                       │ 6. Webhook: asset_created
       │                       │<──────────────────────┤
       │                       │                       │
       │                       │ 7. Webhook: asset.ready
       │                       │<──────────────────────┤
       │                       │                       │
       │ 8. Poll Status        │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │ 9. Status: ready      │                       │
       │<──────────────────────┤                       │
```

## 📂 Cấu Trúc Files

### Backend

```
backend/
├── controllers/
│   ├── muxUploadController.js     # MUX upload & webhook handlers
│   └── materialUploadController.js # Material file upload
├── routes/
│   ├── muxUploadRoute.js          # /api/mux/*
│   └── materialRoute.js           # /api/material/*
├── models/
│   ├── video.js                   # Updated với uploadId, playbackId, status
│   └── Material.js
└── uploads/
    └── materials/                 # Lưu trữ PDF, DOC, PPT
```

### Frontend

```
frontend/src/
├── components/
│   ├── MuxUploader/               # Upload video lên MUX
│   ├── MaterialUploader/          # Upload PDF/DOC/PPT
│   └── QuizEditor/                # Tạo quiz
└── pages/
    └── UploadDemo/                # Demo page
```

## 🚀 Sử Dụng Components

### 1. MuxUploader (Video)

```jsx
import MuxUploader from '@/components/MuxUploader/MuxUploader';

<MuxUploader
  lessonTitle="Bài 1: Giới thiệu"
  sectionId={sectionId}
  onUploadComplete={(data) => {
    console.log('Video uploaded:', data);
    // data.videoId, data.assetId, data.playbackId
  }}
  onUploadError={(error) => {
    console.error('Upload error:', error);
  }}
/>
```

### 2. MaterialUploader (PDF/DOC/PPT)

```jsx
import MaterialUploader from '@/components/MaterialUploader/MaterialUploader';

<MaterialUploader
  lessonTitle="Tài liệu khóa học"
  sectionId={sectionId}
  onUploadComplete={(data) => {
    console.log('Material uploaded:', data);
    // data.materialId, data.fileUrl, data.fileName
  }}
  onUploadError={(error) => {
    console.error('Upload error:', error);
  }}
/>
```

### 3. QuizEditor

```jsx
import QuizEditor from '@/components/QuizEditor/QuizEditor';

<QuizEditor
  lessonTitle="Kiểm tra kiến thức"
  sectionId={sectionId}
  onSaveComplete={(data) => {
    console.log('Quiz saved:', data);
    // data.quizId, data.title
  }}
  onSaveError={(error) => {
    console.error('Save error:', error);
  }}
/>
```

## 🧪 Test Upload

1. Chạy backend:
```bash
cd backend
npm start
```

2. Chạy frontend:
```bash
cd frontend
npm run dev
```

3. Truy cập demo page:
```
http://localhost:5173/upload-demo
```

4. Test từng loại upload:
   - **Video Tab**: Upload video file (MP4, MOV, AVI)
   - **Material Tab**: Upload document (PDF, DOC, PPT)
   - **Quiz Tab**: Tạo câu hỏi trắc nghiệm

## 📊 Video Model Schema

```javascript
{
  section: String (ref: Section),
  title: String,
  contentUrl: String,        // MUX Asset ID
  uploadId: String,          // MUX Upload ID
  playbackId: String,        // MUX Playback ID (dùng để phát)
  status: String,            // uploading | processing | ready | error | cancelled
  duration: Number,          // Thời lượng (giây)
  description: String,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 API Endpoints

### MUX Upload

```
POST   /api/mux/create-upload
Body:  { lessonTitle, sectionId }
Response: { uploadUrl, uploadId, videoId }

POST   /api/mux/webhook
Body:  MUX webhook payload
Response: { received: true }

GET    /api/mux/status/:videoId
Response: { videoId, status, assetId, playbackId, uploadId }
```

### Material Upload

```
POST   /api/material/upload
Body:  FormData { file, lessonTitle, sectionId }
Response: { materialId, fileUrl, fileName }

DELETE /api/material/delete/:materialId
Response: { message: 'Material deleted successfully' }
```

## ⚠️ Lưu Ý Quan Trọng

### 1. CORS Configuration
Nếu frontend ở domain khác, cần cấu hình CORS trong MUX upload:

```javascript
const upload = await mux.video.uploads.create({
  new_asset_settings: {
    playback_policy: ['signed']
  },
  cors_origin: 'https://your-frontend-domain.com' // Thay '*' bằng domain cụ thể
});
```

### 2. File Size Limits
- **Video**: MUX không giới hạn (nhưng nên có UI warning cho file lớn)
- **Material**: 50MB (có thể tăng trong `materialUploadController.js`)

### 3. Webhook Security
Production nên verify webhook signature từ MUX:

```javascript
import Mux from '@mux/mux-node';

const isValidSignature = Mux.Webhooks.verifyHeader(
  req.body,
  req.headers['mux-signature'],
  process.env.MUX_WEBHOOK_SECRET
);
```

### 4. Error Handling
- Video upload fail → status = 'error'
- Material upload fail → file tự động xóa
- Quiz validation → client-side + server-side

## 🐛 Debug

### Check video status:
```bash
curl http://localhost:3000/api/mux/status/{videoId}
```

### Check webhook logs:
```bash
# Backend console sẽ log:
# 🔔 MUX Webhook received: video.upload.asset_created
# ✅ Upload complete - Upload ID: xxx, Asset ID: xxx
# 🎬 Asset ready - Asset ID: xxx
```

### Common Issues:

1. **Webhook không nhận được**
   - Check ngrok URL có đúng không
   - Check MUX dashboard webhook settings
   - Xem backend logs có request nào không

2. **Video stuck ở "processing"**
   - MUX encoding có thể mất 1-5 phút
   - Check MUX dashboard → Assets → Status

3. **Material upload 413 error**
   - Tăng limit trong nginx/proxy
   - Hoặc giảm fileSize limit trong multer

## 📚 Tài Liệu Tham Khảo

- [MUX Direct Upload](https://docs.mux.com/guides/video/upload-files-directly)
- [MUX Webhooks](https://docs.mux.com/guides/video/listen-for-webhooks)
- [UpChunk Documentation](https://github.com/muxinc/upchunk)
- [Multer Documentation](https://github.com/expressjs/multer)
