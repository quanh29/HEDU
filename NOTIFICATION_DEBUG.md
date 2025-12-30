# Debug và Test Notification System

## 🔍 Các Bước Kiểm Tra

### 1. Kiểm tra Backend đang chạy
```bash
cd backend
npm run dev
```

Kiểm tra console có message:
- `✅ Socket.IO server initialized`
- `Server is running on http://localhost:3000`

### 2. Kiểm tra Database Connection
Đảm bảo MongoDB đã kết nối thành công trong console backend.

### 3. Test tạo notification thủ công
```bash
cd backend
node scripts/test-notification.js YOUR_USER_ID
```

Thay `YOUR_USER_ID` bằng Clerk User ID của bạn (lấy từ Clerk Dashboard hoặc console.log trong app).

### 4. Kiểm tra API Endpoints

#### Get notifications:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/notifications
```

#### Get unread count:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/notifications/unread-count
```

### 5. Kiểm tra Frontend Console

Mở Developer Tools trong browser và kiểm tra Console tab:

**Khi load trang, bạn sẽ thấy:**
```
🔌 [Notification Socket] Connecting to: http://localhost:3000
✅ [Notification Socket] Connected with socket id: ABC123
✅ [Notification Socket] System ready: { message: 'Notification system ready', userId: '...' }
📊 [Notification] Fetching unread count
📊 [Notification] Unread count response: { success: true, data: { unreadCount: 0 } }
```

**Khi click vào notification icon:**
```
📡 [Notification] Fetching notifications, page: 1
📡 [Notification] Response: { success: true, data: {...} }
✅ [Notification] Loaded X notifications
```

**Khi nhận notification mới:**
```
📬 [Notification Socket] New notification: { _id: '...', event_title: '...' }
```

## 🐛 Common Issues

### Issue 1: "Cannot read property 'userId' of undefined"
**Nguyên nhân:** Middleware auth không đúng hoặc token không hợp lệ

**Giải pháp:**
- Kiểm tra file `backend/middleware/auth.js`
- Đảm bảo `req.userId` được set trong `protectUserAction`
- Kiểm tra Clerk token có hợp lệ không

### Issue 2: Socket không kết nối
**Nguyên nhân:** Token không được gửi hoặc socketAuth middleware lỗi

**Giải pháp:**
1. Kiểm tra `VITE_BASE_URL` trong `.env` file (frontend)
2. Kiểm tra `socketAuth` middleware trong `backend/middleware/socketAuth.js`
3. Xem console có lỗi CORS không

### Issue 3: Notifications không load
**Nguyên nhân:** API route không hoạt động hoặc query sai

**Giải pháp:**
1. Kiểm tra route order trong `backend/routes/notificationRoute.js`
   - `/unread-count` và `/read-all` PHẢI ở TRƯỚC `/:id/read`
2. Kiểm tra controller có dùng đúng `req.userId` không
3. Xem Network tab trong DevTools để check API response

### Issue 4: "401 Unauthorized"
**Nguyên nhân:** Chưa đăng nhập hoặc token hết hạn

**Giải pháp:**
- Đăng xuất và đăng nhập lại
- Refresh page
- Kiểm tra Clerk setup

## 📊 Monitoring

### Check Socket Connections (Backend Console)
Khi user kết nối:
```
🔌 New socket connection - User: user_abc123, Socket: xyz789
🔔 [Notification Socket] Setting up handlers for user: user_abc123
✅ [Notification Socket] User user_abc123 joined notification room
```

### Check Notification Push (Backend Console)
Khi push notification:
```
📤 [Notification Socket] Pushing notification to user user_abc123
✅ [Notification Socket] Notification sent to user user_abc123
```

## 🧪 Manual Testing Steps

1. **Login to the app** với 2 accounts khác nhau
2. **User A:** Đăng ký một khóa học miễn phí
3. **Kiểm tra:**
   - User A nhận notification: "Đăng ký khóa học thành công"
   - Instructor nhận notification: "Có học viên mới"
4. **Admin:** Approve/reject một khóa học
5. **Kiểm tra:** Instructor nhận notification về trạng thái
6. **Admin:** Process một refund request
7. **Kiểm tra:** User nhận notification về refund status

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://...
CLERK_WEBHOOK_SECRET=...
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_BASE_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=...
```

## 📝 Quick Fixes

### Reset notification count
```javascript
// In MongoDB shell or Compass
db.notifications.updateMany(
  { receiver_id: "YOUR_USER_ID" },
  { $set: { is_read: true } }
)
```

### Delete all notifications
```javascript
db.notifications.deleteMany({ receiver_id: "YOUR_USER_ID" })
```

### Create test notification via API
```javascript
// In browser console (when logged in)
const token = await user.getToken();
fetch('http://localhost:3000/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    event_type: 'system_alert',
    event_title: 'Test',
    event_message: 'Test message',
    event_url: '/'
  })
})
```

## ✅ Success Indicators

Hệ thống hoạt động tốt khi:
- ✅ Socket connection established (green checkmark in console)
- ✅ Unread count được load khi refresh page
- ✅ Notifications được load khi click icon
- ✅ Badge hiển thị số unread đúng
- ✅ Realtime notification xuất hiện ngay khi có event mới
- ✅ Click vào notification → mark as read → badge giảm
- ✅ Click "Mark all as read" → tất cả notifications được đánh dấu đã đọc
