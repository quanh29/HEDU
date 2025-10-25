# API Video Playback - MUX Private Playback

## Mô tả
API này cung cấp các endpoint để phát video private từ MUX với chữ ký bảo mật (signed playback tokens).

## Cấu hình

### Biến môi trường cần thiết:
```
MUX_SIGNING_KEY_ID=your-key-id
MUX_SIGNING_PRIVATE_KEY=base64-encoded-private-key
```

**Lưu ý**: `MUX_SIGNING_PRIVATE_KEY` phải được encode dưới dạng base64. API sẽ tự động giải mã trước khi sử dụng.

## Endpoints

### 1. Lấy Playback URL với Signed Token

**GET** `/api/videos/playback/:videoId`

Lấy URL phát video với token đã ký, phù hợp cho video private trên MUX.

#### Parameters:
- `videoId` (path parameter) - ID của video trong database

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "videoId": "507f1f77bcf86cd799439011",
    "title": "Introduction to React",
    "description": "Learn React basics",
    "playbackId": "abcd1234efgh5678",
    "playbackUrl": "https://stream.mux.com/abcd1234efgh5678.m3u8?token=eyJhbGc...",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS1pZCJ9...",
    "expiresIn": 3600
  }
}
```

#### Response Error (404):
```json
{
  "success": false,
  "message": "Video not found"
}
```

#### Response Error (500):
```json
{
  "success": false,
  "message": "Error generating video playback URL",
  "error": "Error details"
}
```

#### Sử dụng trong Video Player:
```javascript
// Fetch playback URL
const response = await fetch(`/api/videos/playback/${videoId}`);
const { data } = await response.json();

// Sử dụng với HLS.js hoặc video player
const video = document.getElementById('video');
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(data.playbackUrl);
  hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = data.playbackUrl;
}
```

---

### 2. Lấy Thumbnail URL với Signed Token

**GET** `/api/videos/thumbnail/:videoId`

Lấy URL thumbnail của video với token đã ký.

#### Parameters:
- `videoId` (path parameter) - ID của video trong database

#### Query Parameters (optional):
- `width` - Chiều rộng thumbnail (px)
- `height` - Chiều cao thumbnail (px)
- `time` - Thời điểm lấy thumbnail (seconds)

#### Examples:
```
GET /api/videos/thumbnail/507f1f77bcf86cd799439011
GET /api/videos/thumbnail/507f1f77bcf86cd799439011?width=640&height=360
GET /api/videos/thumbnail/507f1f77bcf86cd799439011?width=1280&time=10
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "videoId": "507f1f77bcf86cd799439011",
    "thumbnailUrl": "https://image.mux.com/abcd1234efgh5678/thumbnail.jpg?token=eyJhbGc...&width=640&height=360",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS1pZCJ9...",
    "expiresIn": 3600
  }
}
```

#### Sử dụng:
```javascript
// Fetch thumbnail URL
const response = await fetch(`/api/videos/thumbnail/${videoId}?width=640&height=360`);
const { data } = await response.json();

// Sử dụng trong img tag
<img src={data.thumbnailUrl} alt="Video thumbnail" />
```

---

## Cơ chế hoạt động

### 1. Playback Token
- Token được tạo sử dụng JWT với thuật toán RS256
- Private key được giải mã từ base64 trước khi sign
- Token có thời gian hết hạn 1 giờ (3600 giây)
- Audience (`aud`): `v` cho video, `t` cho thumbnail

### 2. Content URL Format Support
API hỗ trợ nhiều format cho `contentUrl` trong database:
- `mux://playbackId` - Format tùy chỉnh
- `playbackId` - Chỉ playback ID
- `https://stream.mux.com/playbackId.m3u8` - URL đầy đủ

### 3. Security
- Token được ký bằng private key RSA
- Mỗi request tạo token mới
- Token tự động hết hạn sau 1 giờ
- Private key được lưu an toàn dưới dạng base64 trong environment variables

---

## Testing

### Test với curl:

```bash
# Test playback endpoint
curl http://localhost:5000/api/videos/playback/507f1f77bcf86cd799439011

# Test thumbnail endpoint
curl http://localhost:5000/api/videos/thumbnail/507f1f77bcf86cd799439011?width=640&height=360
```

### Test với Postman:
1. GET `http://localhost:5000/api/videos/playback/:videoId`
2. Lấy `playbackUrl` từ response
3. Sử dụng URL này trong video player

---

## Error Handling

### Common Errors:

1. **Missing MUX credentials**
```json
{
  "success": false,
  "message": "Error generating video playback URL",
  "error": "MUX signing credentials not configured"
}
```
**Solution**: Đảm bảo `MUX_SIGNING_KEY_ID` và `MUX_SIGNING_PRIVATE_KEY` được set trong `.env`

2. **Video not found**
```json
{
  "success": false,
  "message": "Video not found"
}
```
**Solution**: Kiểm tra videoId có tồn tại trong database

3. **Invalid private key**
```json
{
  "success": false,
  "message": "Error generating video playback URL",
  "error": "error:0909006C:PEM routines:get_name:no start line"
}
```
**Solution**: Kiểm tra private key có được encode base64 đúng format

---

## Integration với Frontend

### React Example:
```jsx
import { useState, useEffect } from 'react';

function VideoPlayer({ videoId }) {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayback() {
      try {
        const res = await fetch(`/api/videos/playback/${videoId}`);
        const result = await res.json();
        
        if (result.success) {
          setPlaybackData(result.data);
        }
      } catch (error) {
        console.error('Error fetching playback:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayback();
  }, [videoId]);

  if (loading) return <div>Loading...</div>;
  if (!playbackData) return <div>Video not available</div>;

  return (
    <video controls>
      <source src={playbackData.playbackUrl} type="application/x-mpegURL" />
    </video>
  );
}
```

---

## Notes

- Token có thời gian sống 1 giờ, sau đó cần request token mới
- Nên cache playback URL trong thời gian hợp lý để giảm số lượng request
- MUX hỗ trợ HLS adaptive bitrate streaming
- Đối với production, có thể thêm authentication middleware cho endpoint playback
