# Tóm tắt vấn đề và giải pháp

## ❌ Vấn đề hiện tại

**Frontend đang poll video SAI:**
- Video ID: `69050642a982b7dc42e47e50`
- Status: `uploading` (stuck)
- Không có assetId, playbackId

**Server webhook đã xử lý video KHÁC:**
- Video ID: `68f8540d83f2c5239a264c60` 
- Status: `ready` ✅
- Có đầy đủ assetId và playbackId

→ **Đây là 2 video khác nhau!**

## 🔍 Nguyên nhân

### Khả năng 1: Multiple uploads
- User upload nhiều lần
- Frontend cache videoId cũ
- Webhook xử lý video mới nhưng frontend vẫn poll video cũ

### Khả năng 2: Session mismatch
- Server restart giữa chừng
- Video cũ được tạo trước khi restart
- Webhook event cho video cũ bị mất

### Khả năng 3: Webhook không đến
- Video `69050642...` upload xong nhưng webhook không trigger
- Ngrok tunnel bị disconnect
- Webhook URL không đúng

## ✅ Các thay đổi đã thực hiện

### 1. Backend - Thêm logs chi tiết

**File: `muxUploadController.js`**

- ✅ Log mapping giữa Video ID ↔ Upload ID khi tạo upload
- ✅ Log khi tìm kiếm video trong webhook handlers
- ✅ List recent videos nếu không tìm thấy video
- ✅ Log chi tiết trong getUploadStatus

### 2. Backend - Thêm debug endpoint

**Endpoint mới:** `GET /api/mux/debug/list-videos`

Trả về:
- Danh sách 20 videos gần nhất
- Count theo status
- Full info: videoId, uploadId, assetId, playbackId

### 3. Frontend - Đã cải thiện logs (trước đó)

**File: `MuxUploader.jsx`**

- ✅ Log videoId khi upload complete
- ✅ Log mỗi lần poll với status
- ✅ Kiểm tra videoId trước khi poll

**File: `Curriculum.jsx`**

- ✅ Log khi handleVideoUploadComplete được gọi
- ✅ Hiển thị processing message khi không trong uploadingLessons
- ✅ Fix điều kiện render UI

## 🔧 Cách fix ngay

### Option 1: Sử dụng video đã ready

Nếu video `68f8540d83f2c5239a264c60` là video bạn cần:

```javascript
// Trong browser console, update lesson với video ready
const videoData = {
  videoId: "68f8540d83f2c5239a264c60",
  playbackId: "AiL4C8HyeXpSpkH1Ad02EkuYprdUUWuGPWVSLJyusLtg",
  assetId: "CJb3KN6T001ovJm7KnXVQbmdB1sK9ahZ41DqTImym0000E",
  status: "ready"
};

// Find your updateLesson function and call it
// updateLesson(sectionId, lessonId, 'playbackId', videoData.playbackId);
// updateLesson(sectionId, lessonId, 'assetId', videoData.assetId);
// updateLesson(sectionId, lessonId, 'status', 'ready');
```

### Option 2: Upload lại video mới

1. **Xóa video stuck:**
   ```javascript
   db.videos.deleteOne({ _id: ObjectId("69050642a982b7dc42e47e50") })
   ```

2. **Refresh trang**

3. **Upload video mới** và theo dõi logs:
   
   **Frontend:**
   ```
   ✅ Upload complete!
   📹 Video ID: [ID]
   🔄 Starting to poll...
   ```
   
   **Backend:**
   ```
   🔗 Video ID: [ID] <-> Upload ID: [UPLOAD_ID]
   ```
   
   → **IDs phải KHỚP NHAU!**

### Option 3: Check và fix video stuck

1. **Test API để xem all videos:**
   ```bash
   curl http://localhost:3000/api/mux/debug/list-videos
   ```

2. **Check video stuck:**
   ```bash
   curl http://localhost:3000/api/mux/status/69050642a982b7dc42e47e50
   ```

3. **Nếu MUX đã có asset nhưng DB chưa update:**
   - Check MUX dashboard: https://dashboard.mux.com
   - Tìm upload ID: `qjLSPGc02saq2AZjASTapIeFlmZp1GLPh9aDPnr0102KWc`
   - Xem status và asset ID
   - Manual update DB nếu cần

## 📋 Checklist debug tiếp theo

Khi upload video mới, check theo thứ tự:

### Phase 1: Upload starts
- [ ] Frontend log: "Upload complete!" với videoId
- [ ] Backend log: "Video document created: [ID]"
- [ ] Backend log: "🔗 Video ID: [ID] <-> Upload ID: [UPLOAD_ID]"
- [ ] **Verify: IDs được log đúng**

### Phase 2: Frontend polling
- [ ] Frontend log: "Starting to poll video status for: [SAME_ID]"
- [ ] **Verify: Poll đúng videoId vừa tạo**
- [ ] Poll mỗi 5s với log status

### Phase 3: Webhook processing
- [ ] Backend log: "🔔 Webhook received"
- [ ] Backend log: "[MUX WEBHOOK] video.upload.asset_created"
- [ ] Backend log: "Upload ID: [UPLOAD_ID]"
- [ ] Backend log: "✅ Found video: [ID]"
- [ ] **Verify: Upload ID và Video ID khớp với Phase 1**

### Phase 4: Asset ready
- [ ] Backend log: "[MUX WEBHOOK] video.asset.ready"
- [ ] Backend log: "Asset ID: [ASSET_ID]"
- [ ] Backend log: "✅ Found video: [ID]"
- [ ] Backend log: "Status updated to: ready"
- [ ] **Verify: Video ID khớp với Phase 1**

### Phase 5: Frontend receives ready status
- [ ] Frontend log: "📹 Video status: ready"
- [ ] Frontend log: "✅ Video is ready!"
- [ ] Frontend log: "✅ Video upload complete in Curriculum"
- [ ] UI shows green success box
- [ ] **Verify: Success box có playbackId**

## 🚀 Next Steps

1. **Check current state:**
   ```bash
   # Run this
   curl http://localhost:3000/api/mux/debug/list-videos | jq
   ```

2. **Verify ngrok tunnel:**
   - Server logs phải có: "🌐 Ngrok tunnel established!"
   - Copy webhook URL
   - Update trong MUX dashboard nếu cần

3. **Test upload mới:**
   - Upload video nhỏ (~5-10MB)
   - Theo dõi ALL logs (frontend + backend)
   - Verify IDs khớp nhau ở mọi bước

4. **If still fails:**
   - Share toàn bộ logs từ upload start đến khi stuck
   - Include cả frontend console và backend terminal logs
   - Check MUX dashboard screenshot

## 📞 Debug API Endpoints

Test các endpoints này:

```bash
# List all videos
GET http://localhost:3000/api/mux/debug/list-videos

# Check specific video
GET http://localhost:3000/api/mux/status/{videoId}

# Manual webhook test
POST http://localhost:3000/api/mux/webhook
Content-Type: application/json
{
  "type": "video.upload.asset_created",
  "data": {
    "upload_id": "YOUR_UPLOAD_ID",
    "asset_id": "YOUR_ASSET_ID"
  }
}
```

## 💡 Ghi chú

- File debug guide: `DEBUG_VIDEO_MISMATCH.md`
- Test script: `test-api.bat`
- MongoDB queries: `mongodb-queries.js`
- All logs đã được cải thiện để track flow dễ hơn

**Khi có kết quả từ API test, hãy share để tôi giúp debug tiếp!** 🔧
