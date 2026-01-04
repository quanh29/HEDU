# Message Queue Server với RabbitMQ

Server Node.js để quản lý message queue sử dụng RabbitMQ theo mô hình MVC với ES6 modules.

## Yêu cầu

- Node.js (v14 trở lên)
- RabbitMQ server đang chạy trên localhost:5672

## Cài đặt

```bash
npm install
```

## Chạy Server

```bash
npm start
```

Server sẽ chạy trên port 3000 (hoặc port được định nghĩa trong biến môi trường PORT).

## API Endpoints

### 1. Kiểm tra trạng thái
```
GET /api/status
```

### 2. Tạo Queue mới
```
POST /api/queue/create
Content-Type: application/json

{
  "queueName": "my_queue",
  "durable": false
}
```

### 3. Gửi tin nhắn vào Queue
```
POST /api/message/send
Content-Type: application/json

{
  "queueName": "my_queue",
  "message": {
    "id": 1,
    "text": "Hello World",
    "timestamp": "2026-01-02T10:00:00Z"
  },
  "persistent": false
}
```

### 4. Nhận một tin nhắn từ Queue
```
POST /api/message/consume
Content-Type: application/json

{
  "queueName": "my_queue",
  "autoAck": false
}
```

### 5. Subscribe để lắng nghe Queue liên tục
```
POST /api/queue/subscribe
Content-Type: application/json

{
  "queueName": "my_queue",
  "prefetch": 1
}
```

### 6. Xóa Queue
```
DELETE /api/queue/delete
Content-Type: application/json

{
  "queueName": "my_queue"
}
```

### 7. Xóa tất cả tin nhắn trong Queue
```
POST /api/queue/purge
Content-Type: application/json

{
  "queueName": "my_queue"
}
```

## Ví dụ sử dụng với curl

### Tạo queue:
```bash
curl -X POST http://localhost:3000/api/queue/create -H "Content-Type: application/json" -d "{\"queueName\":\"test_queue\"}"
```

### Gửi tin nhắn:
```bash
curl -X POST http://localhost:3000/api/message/send -H "Content-Type: application/json" -d "{\"queueName\":\"test_queue\",\"message\":{\"text\":\"Hello from curl\"}}"
```

### Nhận tin nhắn:
```bash
curl -X POST http://localhost:3000/api/message/consume -H "Content-Type: application/json" -d "{\"queueName\":\"test_queue\"}"
```

## Cài đặt RabbitMQ

### Sử dụng Docker:
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

RabbitMQ Management UI sẽ có tại: http://localhost:15672 (username: guest, password: guest)

## Ghi chú

- Server tự động kết nối lại RabbitMQ nếu mất kết nối
- Tin nhắn được lưu dưới dạng JSON
- Hỗ trợ persistent messages và durable queues


# MESSAGE CONSUMER
- syntax to run server:
npm run start:consumer