# MoMo Payment Integration - Quick Reference

## 🚀 Triển khai hoàn tất

### ✅ Backend Files Created
```
backend/
├── controllers/
│   ├── orderController.js        ✅ Xử lý order creation từ cart
│   ├── paymentController.js      ✅ MoMo API integration + callbacks
│   └── voucherController.js      ✅ Voucher validation
├── routes/
│   ├── orderRoute.js             ✅ Order endpoints
│   ├── paymentRoute.js           ✅ Payment endpoints
│   └── voucherRoute.js           ✅ Voucher endpoints
├── .env.momo.example             ✅ Environment variables template
├── test-vouchers.sql             ✅ Test data SQL script
├── MOMO_PAYMENT_INTEGRATION.md   ✅ Tài liệu chi tiết
└── TESTING_GUIDE.md              ✅ Hướng dẫn test
```

### ✅ Frontend Files Created/Updated
```
frontend/src/
├── pages/
│   ├── Checkout/
│   │   └── Checkout.jsx          ✅ Updated: MoMo payment flow
│   └── PaymentStatus/
│       ├── PaymentStatus.jsx     ✅ New: Return URL handler
│       └── PaymentStatus.module.css ✅ New: Styles
└── App.jsx                       ✅ Updated: Added payment route
```

### ✅ Server Configuration
```
backend/server.js                 ✅ Registered new routes
```

---

## 📋 Các bước tiếp theo (Để hoàn tất)

### 1. Cấu hình MoMo Credentials
```bash
# File: backend/.env
# Thêm các biến sau:

MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:5173/payment/momo/return
MOMO_IPN_URL=https://your-ngrok-url.ngrok.io/api/payment/momo/callback
```

📝 **Lấy credentials:**
- Đăng ký tại: https://business.momo.vn/
- Hoặc dùng test credentials (nếu có)

### 2. Setup Ngrok (Development)
```bash
# Install (nếu chưa có)
npm install -g ngrok

# Hoặc download tại: https://ngrok.com/download

# Chạy ngrok
ngrok http 3000

# Copy URL và update vào MOMO_IPN_URL
```

### 3. Tạo Test Vouchers
```bash
# Run SQL script
mysql -u username -p database_name < backend/test-vouchers.sql

# Hoặc import vào MySQL Workbench/phpMyAdmin
```

### 4. Restart Servers
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

---

## 🔄 Payment Flow Summary

```
1. User → Checkout Page
   └─> Chọn MoMo payment

2. Frontend → POST /api/order/create
   └─> Server tạo Order + OrderDetail từ Cart
   └─> Validate voucher (nếu có)
   └─> Return orderId

3. Frontend → POST /api/payment/momo/initiate
   └─> Server tạo Payment record
   └─> Call MoMo API
   └─> Return paymentUrl

4. Browser → Redirect to MoMo
   └─> User login & confirm payment

5. MoMo → POST /api/payment/momo/callback (IPN)
   └─> Server verify signature
   └─> Update Payment & Order status
   └─> Create Enrollments (MongoDB)
   └─> Clear Cart

6. Browser → Redirect to /payment/momo/return
   └─> Display success/failure message
   └─> Navigate to /my-learning or /cart
```

---

## 🔧 Key Features

### ✅ Server-Side Data Flow
- **Cart data lấy từ MySQL**, không tin client
- Validate courses, vouchers server-side
- Tính toán prices an toàn

### ✅ Transaction Safety
- MySQL transactions cho order creation
- Rollback nếu có lỗi
- Consistent data state

### ✅ Security
- HMAC SHA256 signature verification
- Clerk authentication cho protected routes
- Input validation & sanitization

### ✅ Error Handling
- Cart empty → redirect home
- Invalid voucher → show error
- Payment failed → keep cart, update status
- MoMo API error → proper error messages

---

## 📊 Database Updates

### Tables Used (MySQL)
```
✅ Orders         - Lưu thông tin đơn hàng
✅ OrderDetail    - Chi tiết courses trong order
✅ Payments       - Thông tin thanh toán
✅ Vouchers       - Mã giảm giá
✅ Carts          - Giỏ hàng user
✅ CartDetail     - Courses trong cart
✅ Courses        - Thông tin courses
```

### MongoDB Collections
```
✅ enrollments    - Enrollment records sau thanh toán
```

---

## 🧪 Test Vouchers Available

```
SALE20      → Giảm 20%
SALE10      → Giảm 10%
FREESHIP    → Giảm 50,000đ
NEWUSER     → Giảm 15%
WELCOME100K → Giảm 100,000đ
SAVE5       → Giảm 5%
```

---

## 📞 API Endpoints

### Order APIs (Protected)
```
POST   /api/order/create
GET    /api/order/:orderId
GET    /api/order/history
```

### Payment APIs
```
POST   /api/payment/momo/initiate     (Protected)
POST   /api/payment/momo/callback     (Public - MoMo webhook)
GET    /api/payment/momo/return       (Public - User redirect)
GET    /api/payment/:paymentId        (Protected)
```

### Voucher APIs (Protected)
```
POST   /api/voucher/validate
GET    /api/voucher/list
```

---

## ⚠️ Important Notes

1. **Ngrok Required for Local Testing**
   - MoMo cần IPN URL publicly accessible
   - Ngrok expose localhost:3000 ra internet

2. **Environment Variables**
   - MOMO_IPN_URL phải cập nhật mỗi lần chạy ngrok
   - Ngrok URL thay đổi mỗi session (free plan)

3. **Cart Cleanup**
   - Cart chỉ clear khi payment SUCCESS
   - Payment failed → cart giữ nguyên

4. **Enrollment Creation**
   - Tự động sau payment success
   - Async operation (không block callback response)

5. **Error Recovery**
   - Nếu enrollment fails, payment vẫn success
   - Có thể retry manually hoặc implement queue

---

## 📚 Documentation

- **MOMO_PAYMENT_INTEGRATION.md** - Tài liệu chi tiết về architecture
- **TESTING_GUIDE.md** - Hướng dẫn test từng bước
- **.env.momo.example** - Template cho environment variables
- **test-vouchers.sql** - SQL script tạo test data

---

## 🎯 Next Steps for Production

1. ✅ Thay MOMO_ENDPOINT sang production URL
2. ✅ Thay MOMO_IPN_URL sang public domain (không dùng ngrok)
3. ✅ Thay MOMO_RETURN_URL sang production domain
4. ✅ Sử dụng production MoMo credentials
5. ✅ Setup proper error logging & monitoring
6. ✅ Implement email notifications
7. ✅ Add admin dashboard để quản lý orders/payments

---

## 🐛 Debugging

### Check Backend Logs
```bash
# Terminal chạy backend sẽ log:
- Order creation
- MoMo API requests/responses
- Callback received
- Signature verification
- Enrollment creation
- Cart clearing
```

### Check Database
```sql
-- Latest orders
SELECT * FROM Orders ORDER BY order_id DESC LIMIT 10;

-- Latest payments
SELECT * FROM Payments ORDER BY created_at DESC LIMIT 10;

-- User's cart
SELECT * FROM CartDetail WHERE cart_id = 'xxx';
```

### Check MongoDB
```javascript
// Latest enrollments
db.enrollments.find().sort({createdAt: -1}).limit(10)
```

---

## ✨ Hoàn tất!

Hệ thống MoMo payment đã được tích hợp hoàn chỉnh. 
Tất cả logic xử lý order, payment, enrollment đã sẵn sàng.

**Chỉ cần:**
1. Cấu hình MoMo credentials
2. Setup ngrok (dev)
3. Tạo test vouchers
4. Bắt đầu test!

🚀 **Ready to accept payments!**
