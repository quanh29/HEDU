# Hướng dẫn Test Tích hợp MoMo Payment

## Chuẩn bị trước khi test

### 1. Setup Database
```sql
-- Chạy file test-vouchers.sql để tạo vouchers
source test-vouchers.sql;

-- Hoặc copy-paste SQL vào MySQL Workbench/phpMyAdmin
```

### 2. Cấu hình Environment Variables
```bash
# File: backend/.env
# Copy từ .env.momo.example và điền thông tin thực

MOMO_PARTNER_CODE=MOMOIQA420180417
MOMO_ACCESS_KEY=SvDmj2cOTYZmQQ3H
MOMO_SECRET_KEY=PPuDXq1KowPT1ftR8DvlQTHhC03aul17
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:5173/payment/momo/return
MOMO_IPN_URL=https://your-ngrok-id.ngrok.io/api/payment/momo/callback
```

### 3. Start Ngrok (Quan trọng!)
```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Kết quả sẽ hiển thị:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000

# Copy URL "https://abc123.ngrok.io" và update vào .env:
# MOMO_IPN_URL=https://abc123.ngrok.io/api/payment/momo/callback
```

### 4. Start Servers
```bash
# Terminal 2: Backend
cd backend
npm start
# Server running on http://localhost:3000

# Terminal 3: Frontend  
cd frontend
npm run dev
# Vite running on http://localhost:5173
```

## Test Flow

### Test Case 1: Thanh toán thành công với voucher

**Steps:**
1. **Đăng nhập vào website**
   - Vào http://localhost:5173
   - Click "Đăng nhập" → Login với Clerk

2. **Thêm courses vào giỏ hàng**
   - Browse courses
   - Click "Thêm vào giỏ hàng" cho 2-3 courses
   - Check giỏ hàng có courses

3. **Vào trang Checkout**
   - Click icon giỏ hàng → "Thanh toán"
   - URL: http://localhost:5173/checkout

4. **Áp dụng voucher**
   - Input: `SALE20`
   - Click "Áp dụng"
   - ✅ Thấy discount 20% được áp dụng
   - Total amount giảm xuống

5. **Chọn phương thức thanh toán**
   - Chọn "Ví MoMo"
   - Click "Thanh Toán Ngay"

6. **Check Backend Logs**
   ```
   Terminal 2 (Backend) sẽ log:
   - Order created: order_id = xxx
   - Payment initiated: payment_id = xxx
   - MoMo API response: resultCode = 0
   ```

7. **MoMo Payment Page**
   - Browser redirect sang MoMo test environment
   - URL: https://test-payment.momo.vn/...
   - **Test credentials:**
     - Phone: 0909000000
     - OTP: 000000
   - Confirm payment

8. **MoMo Callback**
   ```
   Terminal 2 (Backend) sẽ log:
   - Received MoMo callback
   - Signature verified
   - Payment status updated: success
   - Order status updated: success
   - Enrollments created
   - Cart cleared
   ```

9. **Redirect về website**
   - Browser auto redirect về http://localhost:5173/payment/momo/return
   - ✅ Thấy page "Thanh Toán Thành Công!"
   - Hiển thị order ID, amount, status

10. **Verify Results**
    - Click "Bắt Đầu Học Ngay"
    - Redirect sang `/my-learning`
    - ✅ Thấy courses đã mua trong My Learning

11. **Check Database**
    ```sql
    -- Check Orders
    SELECT * FROM Orders ORDER BY order_id DESC LIMIT 1;
    -- order_status should be 'success'

    -- Check OrderDetail
    SELECT * FROM OrderDetail WHERE order_id = 'xxx';
    -- Should have all courses with prices

    -- Check Payments
    SELECT * FROM Payments ORDER BY created_at DESC LIMIT 1;
    -- payment_status should be 'success'
    -- method should be 'momo'

    -- Check CartDetail (should be empty)
    SELECT * FROM CartDetail WHERE cart_id = 'xxx';
    -- Should return 0 rows

    -- Check MongoDB Enrollments
    db.enrollments.find({ userId: "xxx" })
    -- Should have new enrollments for purchased courses
    ```

### Test Case 2: Thanh toán không có voucher

**Steps:**
1. Đăng nhập
2. Thêm courses vào cart
3. Vào `/checkout`
4. **KHÔNG áp dụng voucher**
5. Chọn MoMo
6. Click "Thanh Toán Ngay"
7. Complete payment on MoMo
8. ✅ Verify success

**Expected:**
- Order created without voucher_code (NULL)
- Total = subtotal (no discount)

### Test Case 3: Thanh toán thất bại

**Steps:**
1. Đăng nhập
2. Thêm courses vào cart
3. Vào `/checkout`
4. Chọn MoMo → "Thanh Toán Ngay"
5. Trên MoMo page, click **"Hủy thanh toán"** hoặc **Close browser**
6. MoMo sẽ gửi callback với resultCode != 0

**Expected:**
```
Backend logs:
- Payment status updated: failed
- Order status updated: failed
- No enrollments created
- Cart NOT cleared
```

**Verify:**
- User quay lại website thấy "Thanh Toán Thất Bại"
- Cart vẫn còn courses
- Database: order_status = 'failed', payment_status = 'failed'

### Test Case 4: Voucher không hợp lệ

**Steps:**
1. Vào `/checkout`
2. Input voucher: `INVALID_CODE`
3. Click "Áp dụng"

**Expected:**
- ✅ Show error: "Mã giảm giá không hợp lệ"
- Discount = 0
- Cannot proceed with invalid voucher

### Test Case 5: Voucher hết hạn

**Steps:**
1. Tạo voucher hết hạn trong database:
   ```sql
   INSERT INTO Vouchers (voucher_code, voucher_type, amount, created_at, expire_at)
   VALUES ('EXPIRED', 'percentage', 10.00, NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY));
   ```
2. Vào `/checkout`
3. Input: `EXPIRED`
4. Click "Áp dụng"

**Expected:**
- ❌ Error: "Mã giảm giá đã hết hạn"

### Test Case 6: Cart trống

**Steps:**
1. Clear cart (remove all items)
2. Navigate to `/checkout`

**Expected:**
- ✅ Auto redirect về homepage
- Cannot access checkout with empty cart

### Test Case 7: Course không approved

**Steps:**
1. Manually update course status trong database:
   ```sql
   UPDATE Courses SET course_status = 'pending' WHERE course_id = 'xxx';
   ```
2. Add course to cart (bypass frontend check)
3. Try checkout

**Expected:**
- ❌ Backend returns 400: "Khóa học không khả dụng"
- Order creation fails

## API Testing với Postman/Thunder Client

### 1. Create Order
```http
POST http://localhost:3000/api/order/create
Authorization: Bearer {{clerkToken}}
Content-Type: application/json

{
  "voucherCode": "SALE20"
}
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "uuid",
  "totalAmount": 500000,
  "subtotal": 600000,
  "discount": 100000,
  "items": [...],
  "voucherCode": "SALE20"
}
```

### 2. Initiate MoMo Payment
```http
POST http://localhost:3000/api/payment/momo/initiate
Authorization: Bearer {{clerkToken}}
Content-Type: application/json

{
  "orderId": "uuid-from-step-1"
}
```

**Expected Response:**
```json
{
  "success": true,
  "paymentUrl": "https://test-payment.momo.vn/...",
  "paymentId": "uuid",
  "orderId": "uuid",
  "amount": 500000
}
```

### 3. Validate Voucher
```http
POST http://localhost:3000/api/voucher/validate
Authorization: Bearer {{clerkToken}}
Content-Type: application/json

{
  "voucherCode": "SALE20"
}
```

**Expected Response:**
```json
{
  "valid": true,
  "voucher": {
    "code": "SALE20",
    "type": "percentage",
    "amount": 20.00,
    "expireAt": "2025-12-25T00:00:00.000Z"
  }
}
```

### 4. Get Order Details
```http
GET http://localhost:3000/api/order/:orderId
Authorization: Bearer {{clerkToken}}
```

### 5. Get Payment Details
```http
GET http://localhost:3000/api/payment/:paymentId
Authorization: Bearer {{clerkToken}}
```

## Debug Checklist

### ❌ Ngrok không hoạt động
```bash
# Check ngrok status
curl https://your-ngrok-id.ngrok.io/

# Restart ngrok
ngrok http 3000

# Update MOMO_IPN_URL in .env
# Restart backend server
```

### ❌ MoMo không gửi callback
- Verify ngrok URL accessible: `curl https://your-ngrok-id.ngrok.io/api/payment/momo/callback`
- Check MoMo dashboard logs
- Check backend logs for incoming requests

### ❌ Signature verification failed
- Verify MOMO_SECRET_KEY chính xác
- Check signature algorithm (HMAC SHA256)
- Log raw signature data để debug

### ❌ Cart không được clear
- Check MoMo callback có được gọi không
- Check enrollment creation logic
- Check cart clearing logic trong callback handler

### ❌ Enrollments không được tạo
- Check MongoDB connection
- Check enrollmentController logic
- Check backend logs for errors

## Test Data

### Valid Vouchers
```
SALE20      - Giảm 20% (percentage)
SALE10      - Giảm 10% (percentage)
FREESHIP    - Giảm 50,000đ (absolute)
NEWUSER     - Giảm 15% (percentage)
WELCOME100K - Giảm 100,000đ (absolute)
SAVE5       - Giảm 5% (percentage, không hết hạn)
```

### MoMo Test Credentials
```
Phone: 0909000000
OTP:   000000
```

## Success Criteria

✅ **Order Creation:**
- Order record created với status 'pending'
- OrderDetail có đầy đủ courses với prices từ cart
- Voucher được validate và lưu vào order

✅ **Payment Initiation:**
- Payment record created với status 'pending'
- MoMo API trả về paymentUrl
- User được redirect đến MoMo

✅ **Payment Success:**
- MoMo callback được nhận và verified
- Payment status → 'success'
- Order status → 'success'
- Enrollments được tạo cho tất cả courses
- Cart được clear

✅ **Payment Failed:**
- Payment status → 'failed'
- Order status → 'failed'
- Cart NOT cleared
- No enrollments created

✅ **Security:**
- Tất cả signatures được verify
- Server-side validation cho cart/courses
- Client không thể manipulate prices

✅ **User Experience:**
- Smooth redirect flow
- Clear success/failure messages
- Proper error handling
