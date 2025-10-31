# Debug Guide: Video Status Not Updating

## Tình huống
- Server đã nhận webhook từ MUX
- Database đã được cập nhật status = 'ready'
- Nhưng frontend không hiển thị trạng thái thành công

## Các bước debug

### 1. Kiểm tra Server Logs

Khi webhook chạy, phải thấy logs này:

```
🔔 Webhook received at: [timestamp]
[MUX WEBHOOK] video.asset.ready
[SUCCESS] Asset ready - Asset ID: xxx
[INFO] Found video: 673xxx, current status: processing
[INFO] Playback ID: xxx
[SUCCESS] ✅ Video 673xxx is ready to play!
[SUCCESS] Status updated to: ready
```

**Nếu không thấy** → Webhook không được gọi → Xem WEBHOOK_TROUBLESHOOTING.md

### 2. Kiểm tra Database

```javascript
db.videos.find({}, {title: 1, status: 1, assetId: 1, playbackId: 1}).sort({createdAt: -1}).limit(5)
```

Video phải có:
- `status: "ready"`
- `assetId: "abc123..."`
- `playbackId: "xyz789..."`

**Nếu không có playbackId** → Webhook không nhận được playback_ids → Kiểm tra MUX asset settings

### 3. Test API Status Endpoint

```powershell
node backend/test-status-api.js <videoId>
```

Response phải trả về:
```json
{
  "videoId": "673...",
  "status": "ready",
  "assetId": "abc123...",
  "playbackId": "xyz789...",
  "uploadId": "upload123..."
}
```

**Nếu status != "ready"** → Database chưa cập nhật → Webhook chưa chạy hoặc có lỗi

### 4. Kiểm tra Frontend Console

Mở DevTools → Console, phải thấy:

```
🔄 Starting to poll video status for: 673...
📊 Poll attempt 1/120 for video 673...
📹 Video status: processing
⏳ Still processing...
📊 Poll attempt 2/120 for video 673...
📹 Video status: ready
✅ Video is ready!
✅ Video upload complete in Curriculum: {videoId: "...", playbackId: "...", ...}
```

**Nếu không thấy** → Polling không chạy → Kiểm tra MuxUploader.jsx

**Nếu thấy "Video status: ready" nhưng không có callback** → Kiểm tra `onUploadComplete`

### 5. Kiểm tra React State

Trong `Curriculum.jsx`, thêm log:

```javascript
console.log('Current lesson state:', lesson);
console.log('Uploading lessons:', uploadingLessons);
```

Phải thấy:
- `lesson.playbackId`: có giá trị
- `lesson.status`: "ready"
- `uploadingLessons[lessonId]`: undefined (đã xóa)

**Nếu không có playbackId** → `updateLesson` không được gọi hoặc không cập nhật state

### 6. Kiểm tra Điều kiện Render

Trong Curriculum.jsx, các điều kiện render:

```javascript
// MuxUploader chỉ hiển thị khi:
!uploadingLessons[lessonId] && !lesson.playbackId && lesson.status !== 'ready'

// Success box hiển thị khi:
lesson.playbackId || lesson.status === 'ready'

// Processing box hiển thị khi:
!uploadingLessons[lessonId] && lesson.status === 'processing' && !lesson.playbackId
```

## Common Issues & Solutions

### Issue 1: Polling timeout trước khi video ready

**Triệu chứng:** Console log "⏰ Polling timeout"

**Nguyên nhân:** Video mất quá lâu để encode (>10 phút)

**Giải pháp:**
- Tăng `maxAttempts` trong MuxUploader.jsx
- Hoặc chờ và refresh trang để load lại từ database

### Issue 2: Status API trả về status cũ

**Triệu chứng:** API vẫn trả `status: "processing"` dù webhook đã chạy

**Nguyên nhân:** Webhook chưa chạy hoặc có lỗi trong handleAssetReady

**Giải pháp:**
1. Kiểm tra server logs xem có webhook "video.asset.ready"
2. Kiểm tra database xem status đã cập nhật chưa
3. Nếu có lỗi trong handleAssetReady → Fix lỗi và manual update database

### Issue 3: onUploadComplete không được gọi

**Triệu chứng:** Console có "✅ Video is ready!" nhưng không có "✅ Video upload complete in Curriculum"

**Nguyên nhân:** Callback không được truyền đúng hoặc không được gọi

**Giải pháp:**
1. Kiểm tra trong MuxUploader có gọi `onUploadComplete(data)`
2. Kiểm tra data có đầy đủ không (videoId, playbackId, assetId)
3. Thêm log trong callback để debug

### Issue 4: React state không update

**Triệu chứng:** Callback được gọi nhưng UI không thay đổi

**Nguyên nhân:** `updateLesson` không cập nhật state đúng cách

**Giải pháp:**
1. Kiểm tra function `updateLesson` có chạy không
2. Log state trước và sau khi update
3. Kiểm tra có dùng immutable update không (spread operator)
4. Verify sectionId và lessonId có đúng không

### Issue 5: UI hiển thị cả upload button và success box

**Triệu chứng:** Cả 2 cùng hiển thị

**Nguyên nhân:** Điều kiện render bị conflict

**Giải pháp:**
- Upload button: `!uploadingLessons[lessonId] && !lesson.playbackId && lesson.status !== 'ready'`
- Success box: `lesson.playbackId || lesson.status === 'ready'`
- Đảm bảo khi set playbackId hoặc status='ready', uploadingLessons[lessonId] phải được xóa

## Quick Fix: Manual Update

Nếu video đã ready trong database nhưng frontend không cập nhật:

```javascript
// Trong browser console:
// 1. Tìm section và lesson
const section = sections[0]; // Adjust index
const lesson = section.lessons[0]; // Adjust index

// 2. Get video info từ database (copy từ MongoDB)
const videoData = {
  videoId: "673...",
  playbackId: "xyz789...",
  assetId: "abc123...",
  status: "ready"
};

// 3. Call updateLesson
updateLesson(section._id, lesson._id, 'playbackId', videoData.playbackId);
updateLesson(section._id, lesson._id, 'assetId', videoData.assetId);
updateLesson(section._id, lesson._id, 'status', 'ready');
```

## Monitoring Checklist

Khi upload video, check theo thứ tự:

- [ ] Frontend: Upload starts, progress bar moves
- [ ] Backend: "Creating MUX upload" log
- [ ] Backend: "Video document created" log
- [ ] Frontend: "Upload complete!" log
- [ ] Frontend: "Starting to poll video status" log
- [ ] Backend: Webhook "video.upload.asset_created" received
- [ ] Backend: "Updated video XXX: status=processing" log
- [ ] Frontend: "Video status: processing" (multiple times)
- [ ] Backend: Webhook "video.asset.ready" received
- [ ] Backend: "Video XXX is ready to play!" log
- [ ] Frontend: "Video status: ready" log
- [ ] Frontend: "Video upload complete in Curriculum" log
- [ ] Frontend: Success box appears with playbackId

Nếu chain bị break ở đâu → Focus debug ở step đó!
