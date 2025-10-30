# Webhook Debug Guide

## 🔔 Enhanced Logging

Đã thêm comprehensive logging cho MUX webhooks để dễ dàng debug.

## 📊 Log Levels

### Route Level (muxUploadRoute.js)
```
🔔 Webhook received at: [timestamp]
Headers: { ... }
Body (raw): { ... }
```

### Controller Level (muxUploadController.js)
```
==================================================
  MUX Webhook Received
==================================================

📤 MUX Webhook: video.upload.asset_created
   Data: { upload_id: "...", asset_id: "..." }
🐛 Full event: { ... }
✅ Upload complete - Upload ID: xxx, Asset ID: xxx
✅ Updated video 507f...: asset_id=xxx, status=processing
✅ Webhook processed successfully
```

## 🧪 Test Webhook Locally

### 1. Chạy server
```bash
npm start
```

### 2. Test webhook endpoint
```bash
node test-webhook.js
```

Hoặc dùng curl:
```bash
curl -X POST http://localhost:3000/api/mux/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video.upload.asset_created",
    "data": {
      "upload_id": "test_123",
      "asset_id": "asset_456"
    }
  }'
```

## 📋 Webhook Events & Expected Logs

### 1. video.upload.asset_created
**Khi**: Upload hoàn tất, asset được tạo

**Backend logs:**
```
📤 MUX Webhook: video.upload.asset_created
✅ Upload complete - Upload ID: xxx, Asset ID: xxx
✅ Updated video 507f...: asset_id=xxx, status=processing
```

**Database changes:**
- `video.contentUrl` = asset_id
- `video.status` = 'processing'

---

### 2. video.asset.ready
**Khi**: Video encode xong, sẵn sàng phát

**Backend logs:**
```
🎬 MUX Webhook: video.asset.ready
✅ Asset ready - Asset ID: xxx
🐛 Duration: 120s, Playback IDs: [...]
✅ Video 507f... is ready to play!
ℹ️ Playback ID: abc123
```

**Database changes:**
- `video.status` = 'ready'
- `video.duration` = [seconds]
- `video.playbackId` = [MUX playback ID]

---

### 3. video.asset.errored
**Khi**: Asset encode bị lỗi

**Backend logs:**
```
❌ MUX Webhook: video.asset.errored
❌ Asset error - Asset ID: xxx
🐛 Error data: { ... }
⚠️ Video 507f... marked as error
```

**Database changes:**
- `video.status` = 'error'

---

### 4. video.upload.errored
**Khi**: Upload bị lỗi

**Backend logs:**
```
❌ MUX Webhook: video.upload.errored
❌ Upload error - Upload ID: xxx
🐛 Error data: { ... }
⚠️ Video 507f... marked as error
```

**Database changes:**
- `video.status` = 'error'

---

### 5. video.upload.cancelled
**Khi**: Upload bị hủy

**Backend logs:**
```
🚫 MUX Webhook: video.upload.cancelled
⚠️ Upload cancelled - Upload ID: xxx
ℹ️ Video 507f... marked as cancelled
```

**Database changes:**
- `video.status` = 'cancelled'

---

## 🐛 Debugging Checklist

### ✅ Webhook được gọi
Check logs có:
```
🔔 Webhook received at: [timestamp]
```

### ✅ Body được parse
Check logs có:
```
📤 MUX Webhook: video.upload.asset_created
```

Nếu thấy lỗi parse:
```
❌ Failed to parse webhook body
```
→ Check Content-Type header

### ✅ Video được tìm thấy
Check logs có:
```
✅ Updated video 507f...
```

Nếu thấy:
```
❌ Video not found for upload_id: xxx
```
→ Check database có video với uploadId này không

### ✅ Video status được update
Check MongoDB:
```bash
db.videos.findOne({ uploadId: "xxx" })
```

## 🔍 Common Issues

### Issue: Webhook không nhận được
**Symptoms:**
- Không có log `🔔 Webhook received`
- MUX Dashboard hiển thị webhook failed

**Solutions:**
1. Check ngrok đang chạy:
```bash
# Xem ngrok URL trong server console
Ingress established at: https://xxx.ngrok-free.app
```

2. Check webhook URL trong MUX:
```
https://xxx.ngrok-free.app/api/mux/webhook
```

3. Test trực tiếp:
```bash
curl -X POST https://xxx.ngrok-free.app/api/mux/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"video.asset.ready","data":{"id":"test"}}'
```

### Issue: Body parse error
**Symptoms:**
```
❌ Failed to parse webhook body
```

**Solution:**
Check `express.raw()` middleware trong route:
```javascript
muxUploadRouter.post('/webhook', 
    express.raw({ type: 'application/json' }), 
    handleMuxWebhook
);
```

### Issue: Video not found
**Symptoms:**
```
❌ Video not found for upload_id: xxx
```

**Solutions:**
1. Check video được tạo khi upload:
```
✅ Video document created: 507f...
```

2. Check MongoDB:
```javascript
db.videos.find({ uploadId: "xxx" })
```

3. Verify uploadId match:
- Upload request: uploadId = "abc123"
- Webhook data: upload_id = "abc123" (phải giống nhau)

## 📊 Log Icons Reference

- 🔔 Webhook received
- 📤 Upload asset created
- 🎬 Asset ready
- ❌ Error
- 🚫 Cancelled
- ✅ Success
- ⚠️ Warning
- ℹ️ Info
- 🐛 Debug

## 🧪 Test Commands

```bash
# Test webhook endpoint
node test-webhook.js

# Test với curl
curl -X POST http://localhost:3000/api/mux/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"video.asset.ready","data":{"id":"test"}}'

# Check MongoDB video status
mongo
> use your_database
> db.videos.find({ uploadId: "xxx" })

# Check MUX Dashboard
https://dashboard.mux.com/video/uploads
https://dashboard.mux.com/video/assets
```

## 📞 Support

Nếu webhook vẫn không hoạt động, gửi:
1. Backend console logs (toàn bộ)
2. MUX webhook delivery logs từ Dashboard
3. MongoDB video document
4. Ngrok URL (nếu dùng ngrok)
