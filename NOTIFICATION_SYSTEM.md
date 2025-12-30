# Hệ Thống Thông Báo Realtime

## 📋 Tổng Quan
Hệ thống thông báo realtime được triển khai đầy đủ với Socket.IO, cho phép người dùng nhận thông báo tức thì về các sự kiện quan trọng.

## 🎯 Tính Năng

### Frontend
- **Notification Icon Component** - Icon thông báo trên navbar (chỉ hiện khi đăng nhập)
- **Dropdown Menu** - Giao diện dropdown giống Cart và Wishlist
- **Infinite Scroll** - Load 10 thông báo ban đầu, kéo xuống để load thêm
- **Mark as Read** - Click vào thông báo để đánh dấu đã đọc
- **Mark All as Read** - Button đánh dấu tất cả đã đọc
- **Realtime Updates** - Nhận thông báo realtime qua Socket.IO
- **Time Display** - Hiển thị thời gian tương đối (vừa xong, 5 phút trước, etc.)
- **Navigation** - Click vào thông báo để chuyển đến trang liên quan (event_url)

### Backend
- **RESTful API** - Đầy đủ CRUD operations cho thông báo
- **Socket.IO Integration** - Push thông báo realtime
- **Notification Service** - Service layer để push notification từ bất kỳ đâu
- **Auto Notification** - Tự động push thông báo cho các sự kiện quan trọng

## 📁 Cấu Trúc File

### Frontend
```
frontend/src/
├── components/
│   └── NotificationIcon/
│       ├── NotificationIcon.jsx
│       └── NotificationIcon.module.css
├── services/
│   └── notificationService.js
└── components/Navbar/Navbar.jsx (đã cập nhật)
```

### Backend
```
backend/
├── routes/
│   └── notificationRoute.js
├── controllers/
│   └── notificationController.js
├── services/
│   └── notificationService.js
├── sockets/
│   └── notificationSocket.js
└── models/
    └── Notification.js
```

## 🔔 Các Sự Kiện Tự Động Tạo Thông Báo

### 1. Duyệt/Từ chối khóa học (Admin → Instructor)
**Khi**: Admin approve/reject khóa học
**Người nhận**: Instructor của khóa học
**File**: `adminController.js` - `updateCourseStatus()`

### 2. Đăng ký khóa học (System → Student & Instructor)
**Khi**: Student đăng ký khóa học (miễn phí hoặc trả phí)
**Người nhận**: 
- Student: "Đăng ký khóa học thành công"
- Instructor: "Có học viên mới"
**Files**: 
- `enrollmentController.js` - `enrollFreeCourse()`
- `paymentController.js` - `handleMoMoCallback()`

### 3. Khóa học có cập nhật mới (System → Students)
**Khi**: Admin approve cập nhật khóa học
**Người nhận**: Tất cả học viên đã đăng ký khóa học
**File**: `draftController.js` - `approveDraft()`

### 4. Duyệt/Từ chối draft (Admin → Instructor)
**Khi**: Admin approve/reject cập nhật khóa học
**Người nhận**: Instructor của khóa học
**File**: `draftController.js` - `approveDraft()`, `rejectDraft()`

### 5. Duyệt/Từ chối refund (Admin → Student & Instructor)
**Khi**: Admin xử lý yêu cầu hoàn tiền
**Người nhận**:
- Student yêu cầu refund: Trạng thái hoàn tiền
- Instructor (nếu approved): Thông báo có refund được duyệt
**File**: `refundController.js` - `processRefund()`

## 🔌 API Endpoints

### GET /api/notifications
Lấy danh sách thông báo của user
**Query Parameters**:
- `page` (number): Số trang (default: 1)
- `limit` (number): Số lượng mỗi trang (default: 10)
- `is_read` (boolean): Filter theo trạng thái đọc
- `event_type` (string): Filter theo loại sự kiện

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    },
    "unreadCount": 5
  }
}
```

### GET /api/notifications/unread-count
Lấy số lượng thông báo chưa đọc

### PUT /api/notifications/:id/read
Đánh dấu 1 thông báo đã đọc

### PUT /api/notifications/read-all
Đánh dấu tất cả thông báo đã đọc

### DELETE /api/notifications/:id
Xóa thông báo (không sử dụng trong UI hiện tại)

## 🔄 Socket.IO Events

### Client → Server
- `connect`: Kết nối socket
- Socket tự động join room: `notification:${userId}`

### Server → Client
- `notificationReady`: Xác nhận socket sẵn sàng
- `newNotification`: Thông báo mới được push
  ```javascript
  {
    _id: "notification_id",
    receiver_id: "user_id",
    event_type: "course_enrollment",
    event_title: "Đăng ký khóa học thành công",
    event_message: "Bạn đã đăng ký khóa học...",
    event_url: "/course/123/content/",
    is_read: false,
    createdAt: "2025-12-30T..."
  }
  ```

## 💻 Cách Sử Dụng Trong Code

### Push notification từ controller:
```javascript
import { pushNotification } from '../services/notificationService.js';
import { io } from '../server.js';
import { pushNotificationToUser } from '../sockets/notificationSocket.js';

// Push notification đơn
const notification = await pushNotification({
  receiver_id: userId,
  event_type: 'course_enrollment',
  event_title: 'Đăng ký khóa học thành công',
  event_message: 'Bạn đã đăng ký khóa học "Node.js" thành công',
  event_url: `/course/${courseId}/content/`
});

// Push qua socket để realtime
pushNotificationToUser(io, userId, notification);
```

### Push notification cho nhiều users:
```javascript
import { pushNotificationToMultipleUsers } from '../sockets/notificationSocket.js';

await pushNotificationToMultipleUsers(io, studentIds, {
  event_type: 'course_update',
  event_title: 'Khóa học có cập nhật mới',
  event_message: `Khóa học "${course.title}" đã có nội dung cập nhật mới`,
  event_url: `/course/${courseId}/content/`
});
```

## 📊 Event Types
- `course_update`: Cập nhật khóa học
- `system_alert`: Cảnh báo hệ thống
- `course_enrollment`: Đăng ký khóa học
- `course_review`: Đánh giá khóa học
- `refund`: Hoàn tiền
- `other`: Khác

## 🎨 UI Components

### NotificationIcon
- Icon bell từ lucide-react
- Badge hiển thị số thông báo chưa đọc
- Dropdown menu với:
  - Header với nút "Mark all as read"
  - Danh sách thông báo (scroll được)
  - Loading state
  - Empty state
  - Infinite scroll

### Styling
- Giống Cart và Wishlist
- Màu unread: Light blue background
- Icon emoji theo loại event
- Time relative display
- Hover effects

## ⚙️ Cấu Hình

### Socket.IO Connection (Frontend)
```javascript
const socket = io(import.meta.env.VITE_BASE_URL, {
  auth: { token }
});
```

### Database Schema
```javascript
{
  receiver_id: String (required),
  is_read: Boolean (default: false),
  event_type: String (enum),
  event_title: String (required),
  event_message: String (required),
  event_url: String (optional),
  timestamps: true
}
```

## 🚀 Testing

### Test notification từ controller bất kỳ:
```javascript
const testNotification = await pushNotification({
  receiver_id: 'user_id_here',
  event_type: 'system_alert',
  event_title: 'Test notification',
  event_message: 'This is a test notification',
  event_url: '/test'
});
pushNotificationToUser(io, 'user_id_here', testNotification);
```

## 📝 Notes
- Tất cả notifications đều lưu vào database để có thể xem lại
- Socket chỉ dùng để push realtime, không lưu trữ
- Notifications tự động có timestamp
- Nội dung notification phải tường minh (tên khóa học, tên người dùng, không dùng ID)
- Mỗi user có room riêng: `notification:${userId}`
- Frontend tự động reconnect khi mất kết nối socket

## ✅ Hoàn Thành
- [x] Backend API
- [x] Socket.IO integration
- [x] Frontend component
- [x] Auto notifications cho tất cả events
- [x] Realtime push
- [x] Mark as read
- [x] Infinite scroll
- [x] Navigation on click
- [x] Thông báo với nội dung tường minh
