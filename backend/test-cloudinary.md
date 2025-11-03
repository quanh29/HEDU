🧪 Cách Test Với Postman
Upload 1 File:
Method: POST
URL: http://localhost:3000/api/cloudinary/upload
Body tab:
Chọn form-data
Key: file, Type: File, Value: Chọn file từ máy
Key: folder, Type: Text, Value: materials (optional)
Key: resourceType, Type: Text, Value: auto (optional)

Upload Nhiều File:
Method: POST
URL: http://localhost:3000/api/cloudinary/upload-multiple
Body tab:
Chọn form-data
Key: files, Type: File, Value: Chọn file 1
Key: files, Type: File, Value: Chọn file 2 (thêm dòng mới)
Key: folder, Type: Text, Value: course-materials (optional)