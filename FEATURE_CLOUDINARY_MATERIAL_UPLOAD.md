# Material Upload với Cloudinary - Private & Public Files

## 📋 Tổng quan thay đổi

Đã chuyển đổi hệ thống upload material từ lưu trữ local sang Cloudinary với phân biệt:
- **Material/Documents**: Upload **private** (cần signed URL để download)
- **Thumbnails**: Upload **public** (truy cập trực tiếp không cần signed URL)

## 🔄 Quy trình upload Material

### Bước 1: Upload Material (Temporary)
Khi user chọn file tài liệu trong Curriculum:
1. File được gửi lên backend qua `POST /api/material/upload`
2. Backend upload file lên **Cloudinary private** folder `course-materials`
3. Tạo document **Material tạm thời** trong MongoDB với:
   - `_id`: MongoDB ObjectId
   - `contentUrl`: Public ID của Cloudinary
   - `resource_type`: 'raw' 
   - `isTemporary`: true
4. Trả về `materialId`, `publicId`, `fileName` cho frontend

### Bước 2: Link Material với Course
Khi user save course:
1. Material được link với Section thông qua `materialId`
2. Update Material document: `isTemporary: false`, set `section` và `title`
3. Material chính thức thuộc về khóa học

### Bước 3: Download Material (Runtime)
Khi học viên cần download:
1. Frontend gọi `POST /api/material/:materialId/signed-url`
2. Backend generate signed URL với expiration time (default 1 giờ)
3. User download file qua signed URL

## 📁 Cấu trúc Files

### Backend

#### Models
**Material.js** - Updated schema:
```javascript
{
  section: String (optional khi tạo temporary),
  title: String (optional khi tạo temporary),
  contentUrl: String (publicId của Cloudinary),
  resource_type: String (default: 'raw'),
  originalFilename: String,
  fileSize: Number,
  format: String,
  isTemporary: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### Controllers

**materialUploadController.js** - Hoàn toàn mới:
- `uploadMaterial()`: Upload material private lên Cloudinary, tạo document tạm thời
- `deleteMaterial()`: Xóa material từ Cloudinary và MongoDB
- `generateMaterialSignedUrl()`: Generate signed URL để download

**thumbnailUploadController.js** - Mới:
- `uploadThumbnail()`: Upload thumbnail public lên Cloudinary
- `deleteThumbnail()`: Xóa thumbnail từ Cloudinary

**cloudinaryController.js** - Đã có từ trước:
- Generic upload/delete functions cho Cloudinary
- Hỗ trợ cả private và public uploads

#### Routes

**materialRoute.js** - Updated:
```javascript
POST   /api/material/upload              // Upload material (creates temporary document)
DELETE /api/material/delete/:materialId  // Delete material file + document
POST   /api/material/:materialId/signed-url  // Generate download URL
```

**thumbnailRoute.js** - Mới:
```javascript
POST   /api/thumbnail/upload    // Upload thumbnail (public)
DELETE /api/thumbnail/:publicId // Delete thumbnail
```

**cloudinaryRoute.js** - Đã có:
```javascript
POST   /api/cloudinary/upload              // Generic public upload
POST   /api/cloudinary/upload-private      // Generic private upload
POST   /api/cloudinary/upload-multiple     // Upload multiple files
POST   /api/cloudinary/generate-signed-url // Generate signed URL
POST   /api/cloudinary/generate-download-url // Generate download URL
DELETE /api/cloudinary/delete/:publicId    // Delete file
GET    /api/cloudinary/info/:publicId      // Get file info
```

### Frontend

#### Components

**MaterialUploader.jsx** - Updated:
- Không còn prop `sectionId` (vì tạo temporary)
- Upload file lên `/api/material/upload`
- Nhận response: `{ materialId, publicId, originalFilename }`
- Callback `onUploadComplete(data)` với material info

**Curriculum.jsx** - Updated:
- Import MaterialUploader
- Thêm `handleMaterialUploadComplete()`: Lưu materialId, publicId, fileName vào lesson
- Thêm `handleDeleteMaterial()`: Xóa material file và clear lesson data
- Thay thế URL input bằng MaterialUploader component
- Show uploaded material info với nút delete

## 🔒 Bảo mật Material Files

### Private Files (Materials)
```javascript
// Upload options
{
  folder: 'course-materials',
  resource_type: 'raw',
  type: 'private',  // ← Quan trọng!
  use_filename: true,
  unique_filename: true
}
```

**Đặc điểm:**
- Không thể truy cập trực tiếp qua URL
- Cần signed URL để download
- Signed URL có thời gian hết hạn (configurable)

### Public Files (Thumbnails)
```javascript
// Upload options
{
  folder: 'course-thumbnails',
  resource_type: 'image',
  type: 'upload',  // ← Public
  transformation: [
    { width: 1280, height: 720, crop: 'limit' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' }
  ]
}
```

**Đặc điểm:**
- Truy cập trực tiếp qua URL
- Không cần signed URL
- Có transformation (resize, optimize)

## 📊 Data Flow

### Upload Material Flow
```
User chọn file
    ↓
MaterialUploader Component
    ↓
POST /api/material/upload (multipart/form-data)
    ↓
Backend: Upload to Cloudinary Private
    ↓
Backend: Create Material document (temporary)
    ↓
Response: { materialId, publicId, fileName }
    ↓
Frontend: Update lesson state
    ↓
User clicks Save Course
    ↓
Backend: Link material with section (isTemporary = false)
```

### Download Material Flow
```
User clicks download
    ↓
Frontend: POST /api/material/:materialId/signed-url
    ↓
Backend: Find Material by ID
    ↓
Backend: Generate Cloudinary signed URL (expires in 1 hour)
    ↓
Response: { signedUrl, expiresAt, filename }
    ↓
Frontend: Open/Download via signed URL
```

## 🧪 Testing

### Test Material Upload
```bash
# Upload material
curl -X POST http://localhost:3000/api/material/upload \
  -F "file=@document.pdf" \
  -F "lessonTitle=Bài 1: Giới thiệu"

# Response
{
  "success": true,
  "materialId": "673abc123...",
  "publicId": "course-materials/document_xyz789",
  "originalFilename": "document.pdf",
  "fileSize": 123456,
  "format": "pdf"
}
```

### Test Generate Signed URL
```bash
curl -X POST http://localhost:3000/api/material/673abc123.../signed-url \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 3600}'

# Response
{
  "success": true,
  "signedUrl": "https://res.cloudinary.com/.../s--signature--/...",
  "expiresAt": 1699012345,
  "filename": "document.pdf"
}
```

### Test Thumbnail Upload
```bash
curl -X POST http://localhost:3000/api/thumbnail/upload \
  -F "file=@thumbnail.jpg"

# Response
{
  "success": true,
  "publicId": "course-thumbnails/thumbnail_abc123",
  "url": "https://res.cloudinary.com/.../thumbnail_abc123.jpg",
  "width": 1280,
  "height": 720
}
```

## 🔑 Environment Variables

Thêm vào `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## ✅ Checklist Implementation

- [x] Update Material model (isTemporary, optional fields)
- [x] Rewrite materialUploadController.js (Cloudinary private upload)
- [x] Create thumbnailUploadController.js (Cloudinary public upload)
- [x] Update materialRoute.js (add signed-url endpoint)
- [x] Create thumbnailRoute.js
- [x] Register routes in server.js
- [x] Update MaterialUploader component (remove sectionId, use new API)
- [x] Update Curriculum component (integrate MaterialUploader, add handlers)
- [x] Remove URL input for article type
- [x] Add material upload/delete UI in Curriculum

## 🚀 Next Steps

1. Test material upload trong Curriculum
2. Test material delete
3. Implement material download với signed URL trong student view
4. Migrate existing local materials to Cloudinary (if any)
5. Update course save logic để link temporary materials với sections
6. Add thumbnail uploader vào BasicInfo component (if needed)

## 📝 Notes

- Material files được lưu private để bảo vệ nội dung khóa học
- Thumbnails được lưu public để load nhanh và SEO friendly
- Signed URL có thời gian hết hạn để kiểm soát access
- Temporary materials sẽ cần cleanup job để xóa những files không được sử dụng
- Consider adding: material preview, download analytics, access logging
