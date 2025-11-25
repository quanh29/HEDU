# Tích hợp Thanh toán MoMo

## Tổng quan
Hệ thống thanh toán MoMo đã được tích hợp hoàn toàn, cho phép người dùng thanh toán khóa học trực tiếp qua Ví MoMo. Dữ liệu order và payment được lưu vào MySQL dựa trên cart của người dùng, không phụ thuộc vào dữ liệu từ client.

## Luồng thanh toán

### 1. User chọn thanh toán MoMo tại trang Checkout
- Frontend: `/checkout`
- User chọn các khóa học trong giỏ hàng
- Có thể áp dụng mã giảm giá (voucher)
- Chọn phương thức thanh toán: **MoMo**
- Nhấn nút "Thanh Toán Ngay"

### 2. Tạo Order từ Cart
**Endpoint:** `POST /api/order/create`

**Request:**
```json
{
  "voucherCode": "SALE20" // Optional
}
```

**Process:**
1. Lấy `userId` từ Clerk authentication
2. Query `Carts` và `CartDetail` từ MySQL
3. Validate tất cả courses có status = 'approved'
4. Validate voucher (nếu có) từ bảng `Vouchers`
5. Tính toán tổng tiền (subtotal - discount)
6. Tạo record trong bảng `Orders` với `order_status = 'pending'`
7. Tạo records trong bảng `OrderDetail` với thông tin từng course

**Response:**
```json
{
  "success": true,
  "orderId": "uuid",
  "totalAmount": 500000,
  "subtotal": 600000,
  "discount": 100000,
  "items": [
    {
      "courseId": "uuid",
      "title": "Khóa học Python",
      "price": 300000
    }
  ],
  "voucherCode": "SALE20"
}
```

### 3. Khởi tạo thanh toán MoMo
**Endpoint:** `POST /api/payment/momo/initiate`

**Request:**
```json
{
  "orderId": "uuid"
}
```

**Process:**
1. Validate order tồn tại và thuộc về user hiện tại
2. Tính tổng tiền từ `OrderDetail` (không tin dữ liệu từ client)
3. Tạo record trong bảng `Payments` với `payment_status = 'pending'`
4. Generate MoMo signature (HMAC SHA256)
5. Gọi MoMo API `/v2/gateway/api/create`
6. Nhận `payUrl` từ MoMo

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://test-payment.momo.vn/gw_payment/...",
  "paymentId": "uuid",
  "orderId": "uuid",
  "amount": 500000
}
```

### 4. User được redirect đến MoMo
- Frontend redirect user đến `paymentUrl`
- User đăng nhập MoMo và xác nhận thanh toán
- MoMo xử lý giao dịch

### 5. MoMo gửi IPN callback (Webhook)
**Endpoint:** `POST /api/payment/momo/callback`

**Request từ MoMo:**
```json
{
  "partnerCode": "PARTNER_CODE",
  "orderId": "uuid",
  "requestId": "uuid",
  "amount": 500000,
  "resultCode": 0, // 0 = success, khác 0 = failed
  "transId": "123456789",
  "signature": "hmac_signature",
  "extraData": "base64_encoded_data",
  ...
}
```

**Process:**
1. Verify MoMo signature để đảm bảo request hợp lệ
2. Decode `extraData` để lấy `paymentId`, `orderId`, `userId`
3. **Nếu `resultCode = 0` (thành công):**
   - Update `Payments.payment_status = 'success'`
   - Update `Orders.order_status = 'success'`
   - Lấy danh sách courses từ `OrderDetail`
   - **Tạo Enrollment** cho từng course (MongoDB)
   - **Xóa cart** của user (CartDetail)
4. **Nếu `resultCode != 0` (thất bại):**
   - Update `Payments.payment_status = 'failed'`
   - Update `Orders.order_status = 'failed'`
5. Response 204 No Content để MoMo biết đã nhận được

### 6. User quay lại website
**Endpoint:** `GET /api/payment/momo/return`

**Query Parameters từ MoMo:**
```
?partnerCode=XXX&orderId=XXX&resultCode=0&...&signature=XXX
```

**Process:**
1. Verify MoMo signature
2. Query payment status từ database
3. Return thông tin cho frontend

**Response:**
```json
{
  "success": true,
  "resultCode": "0",
  "message": "Giao dịch thành công",
  "paymentId": "uuid",
  "orderId": "uuid",
  "amount": 500000,
  "paymentStatus": "success",
  "orderStatus": "success"
}
```

### 7. Frontend hiển thị kết quả
**Page:** `/payment/momo/return`

- **Thành công:** Hiển thị thông báo thành công, nút "Bắt Đầu Học Ngay" → `/my-learning`
- **Thất bại:** Hiển thị thông báo lỗi, nút "Quay Lại Giỏ Hàng" → `/cart`

## Cấu trúc Database

### Bảng Orders
```sql
CREATE TABLE Orders (
    order_id        VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36),
    order_status    ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    voucher_code    VARCHAR(255) NULL,
    FOREIGN KEY(voucher_code) REFERENCES Vouchers(voucher_code),
    FOREIGN KEY(user_id) REFERENCES Users(user_id)
);
```

### Bảng OrderDetail
```sql
CREATE TABLE OrderDetail (
    order_id    VARCHAR(36),
    course_id   VARCHAR(36),
    price       DECIMAL(10, 2),
    PRIMARY KEY(order_id, course_id),
    FOREIGN KEY(order_id) REFERENCES Orders(order_id),
    FOREIGN KEY(course_id) REFERENCES Courses(course_id)
);
```

### Bảng Payments
```sql
CREATE TABLE Payments (
    payment_id      VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36),
    order_id        VARCHAR(36),
    payment_status  ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    method          VARCHAR(255), -- 'momo'
    amount          DECIMAL(10, 2),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(order_id) REFERENCES Orders(order_id)
);
```

### Bảng Vouchers
```sql
CREATE TABLE Vouchers (
    voucher_code    VARCHAR(255) PRIMARY KEY,
    voucher_type    ENUM('percentage', 'absolute') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_at       DATETIME
);
```

## API Endpoints

### Order APIs
```
POST   /api/order/create           - Tạo order từ cart (Protected)
GET    /api/order/:orderId         - Lấy chi tiết order (Protected)
GET    /api/order/history          - Lịch sử đơn hàng (Protected)
```

### Payment APIs
```
POST   /api/payment/momo/initiate  - Khởi tạo thanh toán MoMo (Protected)
POST   /api/payment/momo/callback  - MoMo IPN webhook (Public)
GET    /api/payment/momo/return    - User return URL (Public)
GET    /api/payment/:paymentId     - Lấy chi tiết payment (Protected)
```

### Voucher APIs
```
POST   /api/voucher/validate       - Validate mã giảm giá (Protected)
GET    /api/voucher/list           - Danh sách vouchers (Protected)
```

## Files được tạo/sửa

### Backend
**Controllers:**
- ✅ `backend/controllers/orderController.js` - Xử lý order logic
- ✅ `backend/controllers/paymentController.js` - Xử lý MoMo payment
- ✅ `backend/controllers/voucherController.js` - Xử lý voucher validation

**Routes:**
- ✅ `backend/routes/orderRoute.js` - Order endpoints
- ✅ `backend/routes/paymentRoute.js` - Payment endpoints
- ✅ `backend/routes/voucherRoute.js` - Voucher endpoints

**Config:**
- ✅ `backend/server.js` - Đăng ký routes mới

### Frontend
**Pages:**
- ✅ `frontend/src/pages/Checkout/Checkout.jsx` - Cập nhật MoMo payment flow
- ✅ `frontend/src/pages/PaymentStatus/PaymentStatus.jsx` - Trang hiển thị kết quả thanh toán
- ✅ `frontend/src/pages/PaymentStatus/PaymentStatus.module.css` - Styles

**Routing:**
- ✅ `frontend/src/App.jsx` - Thêm route `/payment/momo/return`

## Environment Variables

Thêm vào `backend/.env`:

```env
# MoMo Payment Configuration
MOMO_PARTNER_CODE=your_partner_code_here
MOMO_ACCESS_KEY=your_access_key_here
MOMO_SECRET_KEY=your_secret_key_here
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:5173/payment/momo/return
MOMO_IPN_URL=https://your-ngrok-url.ngrok.io/api/payment/momo/callback
```

## Setup và Testing

### 1. Cài đặt dependencies
```bash
# Backend đã có sẵn: uuid, axios, crypto
# Không cần cài thêm gì
```

### 2. Cấu hình MoMo
1. Đăng ký tài khoản MoMo Business: https://business.momo.vn/
2. Lấy credentials: Partner Code, Access Key, Secret Key
3. Thêm vào file `.env`

### 3. Setup Ngrok (Development)
```bash
# Cài đặt ngrok
npm install -g ngrok

# Chạy ngrok
ngrok http 3000

# Copy URL và update vào .env
# Ví dụ: https://abc123.ngrok.io/api/payment/momo/callback
```

### 4. Chạy server
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

### 5. Test thanh toán
1. Thêm courses vào cart
2. Vào `/checkout`
3. Chọn voucher (optional)
4. Chọn phương thức thanh toán: **MoMo**
5. Click "Thanh Toán Ngay"
6. Được redirect đến MoMo
7. Đăng nhập MoMo và xác nhận thanh toán
8. Quay lại website, thấy kết quả

## Security

### 1. Signature Verification
- Mọi request từ MoMo đều được verify HMAC SHA256 signature
- Prevent spoofing và tampering

### 2. Server-side Validation
- Tất cả dữ liệu order/payment lấy từ database
- Client không thể manipulate giá hoặc courses

### 3. Authentication
- Tất cả protected endpoints require Clerk JWT token
- MoMo callback endpoints không require auth (verified by signature)

### 4. Transaction Safety
- Sử dụng MySQL transactions cho order creation
- Rollback nếu có lỗi

## Error Handling

### Các trường hợp lỗi được xử lý:
1. ❌ Cart trống → "Giỏ hàng trống"
2. ❌ Course không approved → "Khóa học không khả dụng"
3. ❌ Voucher không hợp lệ/hết hạn → "Mã giảm giá không hợp lệ"
4. ❌ Order không tồn tại → "Không tìm thấy đơn hàng"
5. ❌ MoMo API error → "Lỗi khi khởi tạo thanh toán"
6. ❌ Invalid signature → "Invalid signature" (400)
7. ❌ Payment failed → Update status = 'failed'

## Notes

### Enrollment Creation
- Sau khi payment thành công, system tự động tạo enrollment trong MongoDB
- Mỗi course trong order sẽ có 1 enrollment record
- User có thể truy cập course ngay lập tức tại `/my-learning`

### Cart Cleanup
- Cart được xóa tự động sau khi payment thành công
- Chỉ xóa CartDetail, giữ lại Cart record

### Voucher Usage
- Hiện tại voucher chưa track số lần sử dụng
- Có thể mở rộng sau với VoucherUsage table

### Payment Status
- `pending` - Đang chờ thanh toán
- `success` - Thanh toán thành công
- `failed` - Thanh toán thất bại

### Order Status
- `pending` - Đang chờ xử lý
- `success` - Hoàn thành
- `failed` - Thất bại

## Future Enhancements

1. **Refund System** - Hoàn tiền tự động
2. **Voucher Usage Tracking** - Giới hạn số lần dùng
3. **Order History UI** - Trang xem lịch sử đơn hàng
4. **Email Notifications** - Gửi email xác nhận
5. **Payment Retry** - Thử lại thanh toán thất bại
6. **Admin Dashboard** - Quản lý orders/payments
7. **Multiple Payment Methods** - Card, Banking, etc.

## Support

Nếu gặp vấn đề:
1. Check backend logs: `console.error()` trong controllers
2. Check MoMo dashboard: https://business.momo.vn/
3. Verify ngrok đang chạy (development)
4. Check database records: Orders, Payments, Enrollments

## Tài liệu MoMo
- API Documentation: https://developers.momo.vn/
- Test Environment: https://test-payment.momo.vn/
- Sandbox Credentials: Đăng ký tại MoMo Business
