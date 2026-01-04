# Email Server

Email service sử dụng Gmail SMTP và RabbitMQ để gửi email thông báo cho người dùng.

## Tính năng

- ✉️ Gửi email qua Gmail SMTP (App Password)
- 🐰 Consume messages từ RabbitMQ
- 📧 Hỗ trợ nhiều loại email templates
- 🔄 Auto-reconnect khi mất kết nối
- ⚡ Message acknowledgment và retry

## Cấu trúc thư mục

```
emailServer/
├── config/
│   ├── smtp.config.js          # Cấu hình SMTP
│   └── rabbitmq.config.js      # Cấu hình RabbitMQ
├── consumers/
│   └── notificationConsumer.js # Consumer để xử lý messages
├── services/
│   └── emailService.js         # Service gửi email
├── templates/
│   └── emailTemplates.js       # Email templates
├── .env.example                # Environment variables mẫu
├── package.json
├── server.js                   # Entry point
└── README.md
```

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd emailServer
npm install
```

### 2. Cấu hình environment variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong `.env`:

```env
PORT=3002

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
NOTIFICATION_QUEUE=notification_queue

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### 3. Lấy Gmail App Password

1. Truy cập [Google Account Security](https://myaccount.google.com/security)
2. Bật "2-Step Verification"
3. Vào "App passwords"
4. Tạo mật khẩu mới cho "Mail" app
5. Copy app password và dán vào `SMTP_PASS` trong `.env`

### 4. Cài đặt RabbitMQ (nếu chưa có)

**Windows (Chocolatey):**
```bash
choco install rabbitmq
```

**macOS (Homebrew):**
```bash
brew install rabbitmq
brew services start rabbitmq
```

**Docker:**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## Sử dụng

### Chạy server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Cấu trúc message trong queue

Message trong RabbitMQ queue phải có định dạng:

```json
{
  "receiver_email": "user@example.com",
  "event_type": "course_enrollment",
  "event_title": "Chào mừng đến với khóa học",
  "event_message": "Bạn đã đăng ký thành công khóa học React cho người mới bắt đầu",
  "event_url": "/courses/react-basics",
  "courseTitle": "React cho người mới bắt đầu",
  "_id": "notification_id_here"
}
```

### Các loại event_type được hỗ trợ

- `course_update` - Cập nhật khóa học
- `system_alert` - Cảnh báo hệ thống
- `course_enrollment` - Đăng ký khóa học
- `course_review` - Đánh giá khóa học
- `refund` - Hoàn tiền
- `other` - Thông báo khác

## Tích hợp với Backend

Backend đã được tích hợp tự động với Message Queue. Khi tạo notification bằng `notificationService`, message sẽ tự động được push lên RabbitMQ.

### Cài đặt trong Backend

1. **Cài đặt dependencies:**
```bash
cd backend
npm install amqplib
```

2. **Thêm vào `.env` của backend:**
```env
RABBITMQ_URL=amqp://localhost:5672
NOTIFICATION_QUEUE=notification_queue
QUEUE_DURABLE=false
```

3. **Sử dụng notificationService:**
```javascript
import { pushNotification } from './services/notificationService.js';

// Tạo notification - email sẽ tự động được gửi
await pushNotification({
  receiver_id: userId,
  event_type: 'course_enrollment',
  event_title: 'Chào mừng đến với khóa học!',
  event_message: 'Bạn đã đăng ký thành công khóa học React cho người mới bắt đầu',
  event_url: '/courses/react-basics',
  courseTitle: 'React cho người mới bắt đầu' // Optional
});
```

Backend sẽ:
1. Tạo notification trong database
2. Tìm user và lấy email
3. Push message lên RabbitMQ queue
4. Email server tự động consume và gửi email

**Lưu ý:** Email được gửi bất đồng bộ (async). Nếu RabbitMQ hoặc Email Server không available, notification vẫn được tạo thành công.

## Testing

Để test email server, bạn có thể push một test message vào queue:

```javascript
// test-email.js
import amqp from 'amqplib';

async function testEmail() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();
  
  const queueName = 'notification_queue';
  await channel.assertQueue(queueName, { durable: true });
  
  const testMessage = {
    receiver_email: 'your-test-email@gmail.com',
    event_type: 'course_enrollment',
    event_title: 'Test Email',
    event_message: 'This is a test email from the email server',
    event_url: '/test',
    courseTitle: 'Test Course'
  };
  
  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(testMessage)),
    { persistent: true }
  );
  
  console.log('Test message sent!');
  
  setTimeout(() => {
    channel.close();
    connection.close();
  }, 500);
}

testEmail().catch(console.error);
```

## Troubleshooting

### SMTP connection failed

- Kiểm tra lại `SMTP_USER` và `SMTP_PASS`
- Đảm bảo bạn sử dụng App Password, không phải password thường
- Kiểm tra 2-Step Verification đã được bật

### RabbitMQ connection failed

- Đảm bảo RabbitMQ đang chạy: `rabbitmqctl status`
- Kiểm tra `RABBITMQ_URL` trong `.env`
- Kiểm tra firewall không block port 5672

### Email không được gửi

- Kiểm tra logs trong console
- Xem RabbitMQ Management UI: http://localhost:15672 (guest/guest)
- Kiểm tra message format trong queue

## License

MIT
