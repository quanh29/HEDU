# Debug Upload Error: "Failed to create upload URL"

## Các Bước Debug

### 1. Kiểm tra Environment Variables

Chạy lệnh sau trong terminal backend:

```bash
node check-env.js
```

Hoặc kiểm tra thủ công file `.env`:

```env
# Cần có các biến này:
MUX_TOKEN_ID=your_mux_token_id
MUX_SECRET_KEY=your_mux_secret_key
```

### 2. Test MUX Connection

Chạy test script:

```bash
node test-mux.js
```

Script này sẽ:
- ✅ Kiểm tra credentials
- ✅ Test list assets
- ✅ Test create upload
- ✅ Hiển thị lỗi chi tiết nếu có

### 3. Lấy MUX Credentials

Nếu chưa có hoặc credentials sai:

1. Truy cập: https://dashboard.mux.com/settings/access-tokens
2. Click "Generate new token"
3. Chọn permissions:
   - ✅ Mux Video (Full Access)
   - ✅ Mux Data (Read)
4. Copy TOKEN ID và SECRET KEY
5. Paste vào file `.env`

### 4. Các Lỗi Thường Gặp

#### ❌ 401 Unauthorized
**Nguyên nhân**: Credentials sai hoặc không có quyền

**Giải pháp**: 
- Kiểm tra lại MUX_TOKEN_ID và MUX_SECRET_KEY
- Tạo token mới từ MUX dashboard
- Đảm bảo token có quyền "Mux Video (Full Access)"

#### ❌ ENOTFOUND / Network Error
**Nguyên nhân**: Không kết nối được internet hoặc MUX API

**Giải pháp**:
- Kiểm tra kết nối internet
- Check firewall/proxy settings
- Thử ping api.mux.com

#### ❌ Missing Environment Variables
**Nguyên nhân**: File .env chưa có hoặc sai format

**Giải pháp**:
- Tạo file `.env` trong thư mục backend
- Copy từ `.env.example` nếu có
- Đảm bảo không có khoảng trắng: `MUX_TOKEN_ID=value` (không có space)

#### ❌ Module not found: @mux/mux-node
**Nguyên nhân**: Package chưa được cài

**Giải pháp**:
```bash
npm install @mux/mux-node
```

### 5. Check Backend Logs

Khi chạy server, backend sẽ log chi tiết:

```
Creating MUX upload for: { lessonTitle: '...', sectionId: '...' }
MUX credentials: { tokenId: 'Set', tokenSecret: 'Set' }
MUX upload created: { uploadId: '...', uploadUrl: '...' }
Video document created: ...
```

Nếu có lỗi, sẽ hiển thị:
```
Error creating direct upload: [error details]
Error details: { message: '...', stack: '...', response: {...} }
```

### 6. Test với Curl

Test trực tiếp API endpoint:

```bash
curl -X POST http://localhost:3000/api/mux/create-upload \
  -H "Content-Type: application/json" \
  -d '{"lessonTitle":"Test Video","sectionId":"507f1f77bcf86cd799439011"}'
```

**Kết quả mong đợi**:
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "uploadId": "...",
  "videoId": "..."
}
```

### 7. Verify MUX Dashboard

Sau khi tạo upload thành công:
1. Vào: https://dashboard.mux.com/video/uploads
2. Kiểm tra xem có upload mới không
3. Status phải là "waiting" hoặc "uploading"

### 8. Common Issues Checklist

- [ ] File `.env` tồn tại trong thư mục `backend/`
- [ ] `MUX_TOKEN_ID` có giá trị (không empty)
- [ ] `MUX_SECRET_KEY` có giá trị (không empty)
- [ ] Package `@mux/mux-node` đã được cài (check `node_modules/`)
- [ ] Server đã restart sau khi thay đổi `.env`
- [ ] MongoDB đang chạy và kết nối được
- [ ] Không có lỗi trong console khi server start

### 9. Quick Fix Commands

```bash
# Kiểm tra env
node check-env.js

# Test MUX
node test-mux.js

# Cài lại packages
npm install

# Restart server
npm start
```

### 10. Nếu Vẫn Lỗi

Gửi cho tôi:
1. Output của `node check-env.js`
2. Output của `node test-mux.js`
3. Backend console logs khi upload
4. Frontend console error (nếu có)

## File .env Mẫu

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_database

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# MUX Video Upload
MUX_TOKEN_ID=your_mux_token_id_here
MUX_SECRET_KEY=your_mux_secret_key_here

# MUX Video Playback (Signed URLs)
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_PRIVATE_KEY=base64_encoded_private_key

# Ngrok
NGROK_AUTH_TOKEN=your_ngrok_token

# Other
VITE_BASE_URL=http://localhost:3000
PORT=3000
```

## Hỗ Trợ

- MUX Documentation: https://docs.mux.com
- MUX Dashboard: https://dashboard.mux.com
- MUX Support: support@mux.com
