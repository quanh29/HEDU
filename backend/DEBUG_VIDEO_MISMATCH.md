# Hướng dẫn Debug: Video Status Không Cập Nhật

## Tình huống hiện tại

**Client đang poll:**
- Video ID: `69050642a982b7dc42e47e50`
- Status: `uploading`
- Upload ID: `qjLSPGc02saq2AZjASTapIeFlmZp1GLPh9aDPnr0102KWc`
- Asset ID: (empty)

**Server webhook đã xử lý:**
- Video ID: `68f8540d83f2c5239a264c60`
- Status: `ready`
- Asset ID: `CJb3KN6T001ovJm7KnXVQbmdB1sK9ahZ41DqTImym0000E`
- Playback ID: `AiL4C8HyeXpSpkH1Ad02EkuYprdUUWuGPWVSLJyusLtg`

## Vấn đề: 2 Video ID khác nhau!

Có 2 khả năng:

### Khả năng 1: Đây là 2 lần upload khác nhau
- Video `69050642...` được upload **SAU** video `68f8540d...`
- Client đang poll video mới, nhưng webhook chưa nhận được event cho video mới
- Video mới có thể vẫn đang upload hoặc webhook chưa đến

**Giải pháp:**
1. Chờ thêm webhook cho video mới
2. Check MUX dashboard xem upload status
3. Kiểm tra ngrok tunnel còn hoạt động không

### Khả năng 2: Client bị lưu videoId cũ
- Client cache videoId cũ trong state
- Upload mới tạo video mới nhưng client vẫn poll video cũ

**Giải pháp:**
1. Refresh trang
2. Clear local state
3. Upload lại

## Các bước kiểm tra ngay

### 1. Kiểm tra trong MongoDB

```javascript
// Tìm cả 2 videos
db.videos.find({
  _id: { $in: [
    ObjectId("69050642a982b7dc42e47e50"),
    ObjectId("68f8540d83f2c5239a264c60")
  ]}
}).pretty()
```

Kết quả mong đợi:
- Video `68f8540d...`: status = `ready`, có playbackId
- Video `69050642...`: status = `uploading` hoặc `processing`

### 2. Kiểm tra MUX Dashboard

1. Vào https://dashboard.mux.com/video/uploads
2. Tìm upload ID: `qjLSPGc02saq2AZjASTapIeFlmZp1GLPh9aDPnr0102KWc`
3. Check status của upload này

### 3. Check server logs

Tìm dòng log này cho video mới:
```
🔗 Video ID: 69050642a982b7dc42e47e50 <-> Upload ID: qjLSPGc...
```

Nếu KHÔNG tìm thấy → Video này được tạo từ session cũ (trước khi restart server)

### 4. Check webhook events

Trong server logs, tìm:
```
[MUX WEBHOOK] video.upload.asset_created
Upload ID: qjLSPGc...
```

Nếu KHÔNG thấy → Webhook chưa nhận event cho video này

## Giải pháp nhanh

### Nếu video `68f8540d...` đã ready:

**Option 1: Update UI manually**
```javascript
// Trong browser console
const readyVideoData = {
  videoId: "68f8540d83f2c5239a264c60",
  playbackId: "AiL4C8HyeXpSpkH1Ad02EkuYprdUUWuGPWVSLJyusLtg",
  assetId: "CJb3KN6T001ovJm7KnXVQbmdB1sK9ahZ41DqTImym0000E",
  status: "ready"
};

// Call updateLesson với video đúng
```

**Option 2: Xóa video cũ và upload lại**
```javascript
// Delete stuck video
db.videos.deleteOne({ _id: ObjectId("69050642a982b7dc42e47e50") })

// Upload video mới
```

### Nếu cần debug video `69050642...`:

1. **Check MUX status của upload ID này:**
   ```bash
   curl https://api.mux.com/video/v1/uploads/qjLSPGc02saq2AZjASTapIeFlmZp1GLPh9aDPnr0102KWc \
     -u MUX_TOKEN_ID:MUX_TOKEN_SECRET
   ```

2. **Check trong MongoDB:**
   ```javascript
   db.videos.findOne({ uploadId: "qjLSPGc02saq2AZjASTapIeFlmZp1GLPh9aDPnr0102KWc" })
   ```

3. **Manual trigger webhook nếu cần:**
   - MUX Dashboard → Webhooks → Resend failed events

## Prevention: Tránh vấn đề này

### 1. Log videoId khi bắt đầu upload (Frontend)

```javascript
// Trong MuxUploader.jsx, sau khi receive videoId
console.log('🎬 Started upload for Video ID:', createdVideoId);
console.log('📤 Upload ID:', uploadId);
```

### 2. Clear state khi unmount

```javascript
useEffect(() => {
  return () => {
    // Clear any ongoing polls
    // Reset states
  };
}, []);
```

### 3. Add videoId validation

```javascript
// Trước khi poll
if (!createdVideoId || createdVideoId === 'undefined') {
  console.error('Invalid videoId, cannot poll');
  return;
}
```

## Test Case

Upload video mới và theo dõi logs:

**Frontend console:**
```
✅ Upload complete!
📹 Video ID: [NEW_VIDEO_ID]
🔄 Starting to poll video status for: [NEW_VIDEO_ID]
```

**Backend logs:**
```
🔗 Video ID: [NEW_VIDEO_ID] <-> Upload ID: [NEW_UPLOAD_ID]
[MUX WEBHOOK] video.upload.asset_created
Upload ID: [NEW_UPLOAD_ID]
✅ Found video: [NEW_VIDEO_ID]
```

Nếu Video IDs khớp nhau → ✅ Correct!
Nếu không khớp → ❌ Có bug!

## Kết luận

**Video `69050642...` đang stuck vì:**
1. Webhook chưa nhận được event (check ngrok)
2. Upload chưa hoàn tất trên MUX (check MUX dashboard)
3. Upload ID mismatch (check database)

**Next steps:**
1. Kiểm tra ngrok tunnel có active không
2. Check MUX dashboard status của upload
3. Nếu video `68f8540d...` đã ready → Sử dụng video đó thay vì video stuck
4. Upload video test mới với logs mới để track toàn bộ flow
