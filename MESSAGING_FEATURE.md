# Messaging Feature - Hệ thống Chat Real-time

## Tổng quan

Hệ thống chat real-time cho phép người dùng giao tiếp với nhau, gửi tin nhắn văn bản và hình ảnh. Sử dụng Socket.IO cho real-time communication và Cloudinary để lưu trữ hình ảnh private.

## Tính năng

### ✅ Đã hoàn thành

1. **Real-time Messaging**
   - Gửi/nhận tin nhắn real-time qua Socket.IO
   - Typing indicator (hiển thị khi người khác đang gõ)
   - Message read status

2. **Conversation Management**
   - Danh sách cuộc trò chuyện
   - Tìm kiếm cuộc trò chuyện
   - Hiển thị tin nhắn cuối cùng và thời gian
   - Badge số tin nhắn chưa đọc

3. **Image Sharing**
   - Gửi hình ảnh trong tin nhắn
   - Hình ảnh được lưu private trên Cloudinary
   - Preview hình ảnh trước khi gửi
   - Signed URL để truy cập hình ảnh private

4. **UI/UX**
   - Giao diện hiện đại, thân thiện
   - Responsive design
   - Badge số tin nhắn chưa đọc trên avatar
   - Badge trong menu dropdown
   - Bảng màu đồng nhất (#1E3A5F, #ef4444, #f8f9fa)

## Cấu trúc thư mục

```
backend/
├── controllers/
│   └── messageController.js       # API endpoints
├── models/
│   ├── Message.js                 # Message schema
│   └── Conversation.js            # Conversation schema
├── routes/
│   └── messageRoute.js            # Routes
└── sockets/
    └── messageSocket.js           # Socket handlers

frontend/
├── pages/
│   └── Messaging/
│       ├── Messaging.jsx          # Main page
│       └── Messaging.module.css
├── components/
│   └── Messaging/
│       ├── ConversationList/
│       │   ├── ConversationList.jsx
│       │   └── ConversationList.module.css
│       └── ChatWindow/
│           ├── ChatWindow.jsx
│           └── ChatWindow.module.css
└── hooks/
    └── useUnreadMessages.js       # Hook for unread count
```

## API Endpoints

### POST `/api/message/conversation`
Tạo hoặc lấy conversation giữa 2 người dùng
```json
{
  "otherUserId": "user_xxx"
}
```

### GET `/api/message/conversations`
Lấy danh sách tất cả conversations của user hiện tại

### GET `/api/message/conversation/:conversationId`
Lấy tin nhắn của một conversation
- Query params: `limit`, `before`

### POST `/api/message/send`
Gửi tin nhắn (có thể kèm hình ảnh)
- FormData: `conversationId`, `content`, `image` (optional)

### PUT `/api/message/read/:conversationId`
Đánh dấu tất cả tin nhắn trong conversation là đã đọc

### GET `/api/message/unread-count`
Lấy tổng số tin nhắn chưa đọc

### POST `/api/message/image-url`
Lấy signed URL cho hình ảnh private
```json
{
  "publicId": "messages/xxx"
}
```

## Socket Events

### Client → Server

#### `joinConversation`
Join vào conversation room
```javascript
socket.emit('joinConversation', { conversationId });
```

#### `leaveConversation`
Rời khỏi conversation room
```javascript
socket.emit('leaveConversation', { conversationId });
```

#### `sendMessage`
Gửi tin nhắn real-time
```javascript
socket.emit('sendMessage', { 
  conversationId, 
  message 
});
```

#### `typing`
Thông báo đang gõ
```javascript
socket.emit('typing', { 
  conversationId, 
  isTyping: true 
});
```

#### `markAsRead`
Đánh dấu đã đọc
```javascript
socket.emit('markAsRead', { 
  conversationId, 
  messageIds: [] 
});
```

### Server → Client

#### `conversationJoined`
Xác nhận đã join conversation
```javascript
socket.on('conversationJoined', (data) => {
  // data: { conversationId }
});
```

#### `newMessage`
Nhận tin nhắn mới
```javascript
socket.on('newMessage', (data) => {
  // data: { conversationId, message }
});
```

#### `userTyping`
Người khác đang gõ
```javascript
socket.on('userTyping', (data) => {
  // data: { conversationId, userId, isTyping }
});
```

#### `messagesRead`
Tin nhắn đã được đọc
```javascript
socket.on('messagesRead', (data) => {
  // data: { conversationId, messageIds, readBy }
});
```

## Database Schema

### Message (MongoDB)
```javascript
{
  conversation_id: ObjectId,
  sender_id: String,
  content: String,
  img_url: String,        // Cloudinary public_id
  is_read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation (MongoDB)
```javascript
{
  participants: [{
    user_id: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Sử dụng

### Truy cập trang tin nhắn
```
/messages
```

### Hiển thị badge số tin nhắn chưa đọc
Badge tự động hiển thị:
- Trên avatar user trong navbar
- Trong menu dropdown khi click vào avatar

### Hook để lấy unread count
```javascript
import { useUnreadMessages } from '../hooks/useUnreadMessages';

const { unreadCount, refetchUnreadCount } = useUnreadMessages();
```

## Environment Variables

Cần có các biến môi trường sau cho Cloudinary:

```env
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## Testing

### 1. Kiểm tra kết nối Socket
- Mở DevTools Console
- Kiểm tra logs: "✅ Socket connected successfully"

### 2. Test gửi tin nhắn
- Tạo 2 tài khoản
- Tạo conversation giữa 2 người
- Gửi tin nhắn và kiểm tra real-time update

### 3. Test gửi hình ảnh
- Click nút Image trong input area
- Chọn hình ảnh (max 10MB)
- Gửi và kiểm tra preview

### 4. Test unread count
- Gửi tin nhắn từ user A
- Đăng nhập user B
- Kiểm tra badge hiển thị số tin nhắn chưa đọc
- Mở conversation và kiểm tra badge biến mất

## Lưu ý

1. **Private Images**: Hình ảnh được lưu private trên Cloudinary, cần signed URL để truy cập
2. **Socket Connection**: Cần đăng nhập để sử dụng messaging
3. **Real-time**: Tin nhắn được đồng bộ real-time qua Socket.IO
4. **Typing Indicator**: Timeout sau 2 giây không gõ
5. **Image Size**: Giới hạn 10MB cho mỗi hình ảnh

## Troubleshooting

### Socket không kết nối
- Kiểm tra `VITE_BASE_URL` trong `.env`
- Kiểm tra backend server đang chạy
- Kiểm tra authentication token

### Hình ảnh không hiển thị
- Kiểm tra Cloudinary credentials
- Kiểm tra signed URL có hợp lệ
- Kiểm tra file size < 10MB

### Tin nhắn không real-time
- Kiểm tra socket connection status
- Kiểm tra đã join conversation room
- Kiểm tra console logs cho errors

## Future Improvements

- [ ] Voice messages
- [ ] File attachments (PDF, docs)
- [ ] Video calls
- [ ] Message reactions
- [ ] Message search
- [ ] Group conversations
- [ ] Message encryption
- [ ] Push notifications
- [ ] Online status indicator
