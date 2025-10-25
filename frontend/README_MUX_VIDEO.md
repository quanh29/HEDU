# MUX Video Player Integration

## 📋 Tổng quan

Tích hợp hoàn chỉnh MUX video player với signed playback tokens cho private videos. Hệ thống bao gồm backend API để tạo signed tokens và frontend React component để phát video.

---

## 🎯 Các tính năng

### Backend
- ✅ Tạo signed playback tokens sử dụng MUX SDK
- ✅ Tự động giải mã private key từ base64
- ✅ Token tự động hết hạn sau 1 giờ
- ✅ Hỗ trợ cả video playback và thumbnail URLs
- ✅ Error handling và validation

### Frontend
- ✅ MuxVideoPlayer component với MUX Player React
- ✅ Tự động fetch signed URLs từ backend
- ✅ Loading và error states
- ✅ Responsive design
- ✅ Tracking playback progress
- ✅ Demo page đầy đủ tính năng

---

## 🚀 Cài đặt

### Backend Dependencies
```bash
cd backend
npm install @mux/mux-node
```

### Frontend Dependencies
```bash
cd frontend
npm install @mux/mux-player-react
```

---

## ⚙️ Cấu hình

### 1. Backend Environment Variables

Tạo/cập nhật file `.env` trong thư mục `backend`:

```env
MUX_SIGNING_KEY_ID=your-signing-key-id
MUX_SIGNING_PRIVATE_KEY=base64-encoded-private-key
```

**Lấy MUX credentials:**
1. Đăng nhập vào [MUX Dashboard](https://dashboard.mux.com)
2. Vào Settings → Access Tokens → Signing Keys
3. Tạo Signing Key mới
4. Copy Key ID và Private Key
5. Encode Private Key sang base64:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($privateKeyContent))
```

**Linux/Mac:**
```bash
echo -n "YOUR_PRIVATE_KEY" | base64
```

### 2. Frontend Environment Variables

Tạo/cập nhật file `.env` trong thư mục `frontend`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 📦 Cấu trúc Files

```
backend/
├── controllers/
│   └── videoPlaybackController.js    # Controller cho video playback
├── routes/
│   └── videoRoute.js                  # Routes định nghĩa
└── API_VIDEO_PLAYBACK_SIGNED.md      # API documentation

frontend/
├── src/
│   ├── components/
│   │   └── MuxVideoPlayer/
│   │       ├── MuxVideoPlayer.jsx
│   │       └── MuxVideoPlayer.module.css
│   └── pages/
│       └── MuxVideoDemo/
│           ├── MuxVideoDemo.jsx
│           └── MuxVideoDemo.module.css
└── README_MUX_VIDEO.md               # File này
```

---

## 🎬 Sử dụng

### 1. Thêm Video vào Database

Tạo video mới với `contentUrl` là MUX playback ID:

```javascript
// POST /api/videos
{
  "section": "section-id",
  "title": "Video Title",
  "contentUrl": "YOUR_MUX_PLAYBACK_ID",  // hoặc "mux://PLAYBACK_ID"
  "description": "Video description",
  "order": 1
}
```

### 2. Lấy Video ID từ MongoDB

Sau khi tạo video, lấy `_id` từ response hoặc database.

### 3. Truy cập Demo Page

Mở browser và truy cập:
```
http://localhost:5173/mux-demo?videoId=YOUR_VIDEO_ID
```

Ví dụ:
```
http://localhost:5173/mux-demo?videoId=507f1f77bcf86cd799439011
```

---

## 💻 Sử dụng MuxVideoPlayer trong Code

### Basic Usage

```jsx
import MuxVideoPlayer from '@/components/MuxVideoPlayer/MuxVideoPlayer';

function MyVideoPage() {
  return (
    <MuxVideoPlayer
      videoId="507f1f77bcf86cd799439011"
      autoPlay={false}
    />
  );
}
```

### Advanced Usage với Callbacks

```jsx
import MuxVideoPlayer from '@/components/MuxVideoPlayer/MuxVideoPlayer';

function MyVideoPage() {
  const handleTimeUpdate = (data) => {
    console.log('Current time:', data.currentTime);
    console.log('Duration:', data.duration);
    console.log('Progress:', data.progress);
    
    // Lưu progress vào database
    saveProgress(data.currentTime);
  };

  const handleVideoEnded = () => {
    console.log('Video ended!');
    // Đánh dấu hoàn thành
    markAsCompleted();
    // Chuyển sang video tiếp theo
    goToNextVideo();
  };

  return (
    <MuxVideoPlayer
      videoId="507f1f77bcf86cd799439011"
      autoPlay={false}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleVideoEnded}
    />
  );
}
```

### Integration với Course Content

```jsx
import { useState, useEffect } from 'react';
import MuxVideoPlayer from '@/components/MuxVideoPlayer/MuxVideoPlayer';

function CourseVideoLesson({ lessonId }) {
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    // Fetch video ID từ lesson
    fetch(`/api/lessons/${lessonId}`)
      .then(res => res.json())
      .then(data => setVideoId(data.videoId));
  }, [lessonId]);

  if (!videoId) return <div>Loading...</div>;

  return (
    <div>
      <MuxVideoPlayer
        videoId={videoId}
        autoPlay={false}
        onTimeUpdate={(data) => {
          // Track progress
          if (data.progress > 90) {
            // Đánh dấu gần hoàn thành
            updateLessonProgress(lessonId, 'almost-complete');
          }
        }}
        onEnded={() => {
          // Hoàn thành bài học
          updateLessonProgress(lessonId, 'completed');
        }}
      />
    </div>
  );
}
```

---

## 🔌 API Endpoints

### Get Video Playback URL

**Endpoint:** `GET /api/videos/playback/:videoId`

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "507f1f77bcf86cd799439011",
    "title": "Video Title",
    "description": "Video description",
    "playbackId": "mux-playback-id",
    "playbackUrl": "https://stream.mux.com/playback-id.m3u8?token=...",
    "token": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

### Get Video Thumbnail

**Endpoint:** `GET /api/videos/thumbnail/:videoId?width=640&height=360&time=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "507f1f77bcf86cd799439011",
    "thumbnailUrl": "https://image.mux.com/playback-id/thumbnail.jpg?token=...",
    "token": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

---

## 🎨 Customization

### Custom Styles

Override CSS trong component của bạn:

```css
.customPlayer {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
```

```jsx
<div className="customPlayer">
  <MuxVideoPlayer videoId={videoId} />
</div>
```

### Custom Player Config

Truyền props trực tiếp cho MUX Player:

```jsx
<MuxPlayer
  playbackId={playbackId}
  tokens={{ playback: token }}
  autoPlay={true}
  muted={true}
  loop={true}
  // Thêm các props khác theo MUX Player docs
/>
```

---

## 🐛 Troubleshooting

### 1. Video không phát được

**Error:** "Invalid playback URL"

**Giải pháp:**
- Kiểm tra `MUX_SIGNING_KEY_ID` và `MUX_SIGNING_PRIVATE_KEY` trong `.env`
- Đảm bảo private key đã được encode base64 đúng
- Kiểm tra playback ID có đúng không

### 2. Token expired

**Error:** Token đã hết hạn

**Giải pháp:**
- Token tự động hết hạn sau 1 giờ
- Component sẽ tự động request token mới khi remount
- Có thể implement auto-refresh token nếu cần

### 3. CORS Error

**Error:** CORS policy blocked

**Giải pháp:**
```javascript
// backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### 4. Video loading chậm

**Giải pháp:**
- Kiểm tra network connection
- MUX tự động adaptive bitrate, sẽ điều chỉnh quality theo bandwidth
- Đảm bảo video đã được encode xong trên MUX

---

## 📚 Resources

- [MUX Documentation](https://docs.mux.com/)
- [MUX Player React](https://github.com/muxinc/elements/tree/main/packages/mux-player-react)
- [MUX Signed URLs](https://docs.mux.com/guides/video/secure-video-playback)
- [Backend API Documentation](./backend/API_VIDEO_PLAYBACK_SIGNED.md)

---

## 🎓 Best Practices

1. **Security:**
   - Không expose private key trong frontend
   - Token nên được tạo từ backend
   - Set expiration time hợp lý (1h là tốt)

2. **Performance:**
   - Cache playback URLs nếu có thể
   - Sử dụng thumbnail để preview
   - Implement lazy loading cho video list

3. **User Experience:**
   - Hiển thị loading state rõ ràng
   - Handle errors gracefully
   - Save video progress để user có thể tiếp tục xem
   - Implement auto-play next video trong playlist

4. **Analytics:**
   - Track video views
   - Monitor playback completion rate
   - Collect watch time statistics

---

## 🆘 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Xem API documentation: `backend/API_VIDEO_PLAYBACK_SIGNED.md`
3. Kiểm tra MUX Dashboard để verify video status

---

**Tạo bởi:** GitHub Copilot  
**Cập nhật:** October 25, 2025
