# Debug Guide: MongoDB Update Not Working

## Vấn đề
Hàm `handleAssetReady` chạy khi webhook `video.asset.ready` đến, nhưng video trong MongoDB không được cập nhật.

## Các nguyên nhân có thể

### 1. Video không tìm thấy trong DB
**Triệu chứng:** Log hiện "Video not found for asset_id"

**Nguyên nhân:**
- `assetId` trong DB không khớp với `asset_id` từ webhook
- Video chưa được cập nhật `assetId` ở bước `handleUploadComplete`

**Kiểm tra:**
```bash
# Run với improved logs
# Restart server và upload video mới
# Check logs xem có "✅ Found video" không
```

### 2. MongoDB connection issue
**Triệu chứng:** No error, nhưng data không update

**Nguyên nhân:**
- Connection pool đầy
- Write concern issue
- Transaction conflict

**Kiểm tra:**
```bash
node test-mongodb-update.js <videoId>
```

### 3. Mongoose validation error
**Triệu chứng:** Silent fail hoặc validation error

**Nguyên nhân:**
- Required fields bị thiếu
- Enum values không hợp lệ
- Type mismatch

**Kiểm tra:**
Đã thêm try-catch và error logging trong `handleAssetReady`

### 4. Race condition
**Triệu chứng:** Sometimes works, sometimes doesn't

**Nguyên nhân:**
- Multiple webhooks cùng lúc
- Multiple instances của app
- Concurrent saves

### 5. Webhook đến trước `handleUploadComplete`
**Triệu chứng:** `assetId` empty khi tìm kiếm

**Nguyên nhân:**
- MUX gửi `video.asset.ready` trước `video.upload.asset_created`
- Hoặc `handleUploadComplete` chưa save xong

**Kiểm tra:**
```
Check logs xem thứ tự events:
1. video.upload.asset_created → set assetId
2. video.asset.ready → find by assetId
```

## Test Steps

### Step 1: Check current state
```bash
# List all videos
curl http://localhost:3000/api/mux/debug/list-videos | jq

# Check specific video
curl http://localhost:3000/api/mux/status/<videoId> | jq
```

### Step 2: Test MongoDB update manually
```bash
cd backend

# Test update operation
node test-mongodb-update.js <videoId>

# Manual update if needed
node manual-update-video.js <videoId> <assetId> <playbackId>
```

### Step 3: Upload new video with enhanced logs
```bash
# Restart server để load code mới
npm run dev

# Upload video và check logs theo thứ tự:
# 1. Video document created
# 2. 🔗 Video ID <-> Upload ID
# 3. Webhook: video.upload.asset_created
# 4. ✅ Found video (trong handleUploadComplete)
# 5. Updated video: assetId=xxx, status=processing
# 6. Webhook: video.asset.ready
# 7. ✅ Found video (trong handleAssetReady)
# 8. 📝 Attempting to save video
# 9. 💾 Video saved successfully
# 10. ✅ Verification after save
```

### Step 4: Verify in MongoDB directly
```javascript
// MongoDB shell hoặc Compass
db.videos.findOne({ _id: ObjectId("your-video-id") })

// Check updatedAt timestamp
// Should be recent if update worked
```

## Expected Logs (New Enhanced Version)

When webhook `video.asset.ready` arrives:

```
🎯 Asset ready - Asset ID: CJb3KN6T...
🐛 Duration: 51.985s, Playback IDs: [{"policy":"signed","id":"AiL4C..."}]
ℹ️ 🔍 Searching for video with assetId: CJb3KN6T...
✅ ✅ Found video: 68f8540d... (Video Title)
ℹ️    Current status: processing
ℹ️    Current playbackId: (empty)
ℹ️    Current duration: (empty)
ℹ️ 📹 Setting Playback ID: AiL4C...
ℹ️ 📝 Attempting to save video with:
ℹ️    status: processing → ready
ℹ️    duration: undefined → 51.985
ℹ️    playbackId: (empty) → AiL4C...
✅ 💾 Video saved successfully!
ℹ️ ✅ Verification after save:
ℹ️    _id: 68f8540d...
ℹ️    status: ready
ℹ️    duration: 51.985
ℹ️    playbackId: AiL4C...
ℹ️    updatedAt: 2025-10-31T...
ℹ️ 🔍 Double-check query result:
ℹ️    status: ready
ℹ️    playbackId: AiL4C...
✅ ✅ Video 68f8540d... is ready to play!
ℹ️ 🎉 Video processing completed successfully!
```

## Common Issues & Solutions

### Issue: "Video not found for asset_id"

**Check 1:** Did `handleUploadComplete` run?
```bash
grep "Updated video.*status=processing" logs.txt
```

**Check 2:** AssetId in database
```javascript
db.videos.findOne({ uploadId: "YOUR_UPLOAD_ID" })
// Should have assetId field populated
```

**Solution:** 
- Make sure `video.upload.asset_created` webhook arrived first
- Check uploadId mapping in logs

### Issue: No error but data not saved

**Check:** MongoDB connection
```bash
node test-mongodb-update.js <videoId>
```

**If test works:** Problem in webhook handler logic
**If test fails:** MongoDB connection issue

### Issue: "Cannot read property 'id' of undefined"

**Cause:** `playback_ids` is empty in webhook data

**Check webhook payload:**
```bash
# In logs, look for:
🐛 Full event: {...}
# Check if data.playback_ids exists
```

**Solution:** MUX might not have generated playback IDs yet (rare)

### Issue: Updates work in test but not in webhook

**Cause:** Async timing or error swallowed

**Solution:** 
- Check if error is thrown and caught in outer try-catch
- Look for validation errors
- Check if save() is actually awaited

## Quick Fix Commands

```bash
# 1. Check if server is running
curl http://localhost:3000/

# 2. Check video status
curl http://localhost:3000/api/mux/status/<videoId>

# 3. List all videos
curl http://localhost:3000/api/mux/debug/list-videos

# 4. Manual update video (if needed)
cd backend
node manual-update-video.js <videoId> <assetId> <playbackId>

# 5. Test MongoDB connection
node test-mongodb-update.js <videoId>
```

## Next Steps

1. **Restart server** với enhanced logs mới
2. **Upload test video** nhỏ (~5-10MB)
3. **Watch logs** cho toàn bộ flow
4. **Copy logs** và share nếu vẫn fail
5. **Check MongoDB** directly với queries

Nếu vẫn không work, share:
- Full logs từ webhook arrival đến end
- MongoDB query result: `db.videos.findOne({_id: ObjectId("...")})`
- Result của `curl http://localhost:3000/api/mux/status/<videoId>`
