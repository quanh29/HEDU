# Fix Video Linking Flow - Không Tạo Video Trùng

## Vấn đề

Trước đây khi lưu khóa học, hệ thống tạo video document mới mỗi lần save, dẫn đến:
- Video bị duplicate trong database
- Upload video một lần nhưng có nhiều records
- Không tận dụng được video đã upload trước đó
- Khó quản lý và cleanup

## Giải pháp

Thay đổi logic để **link video hiện có với section** thay vì tạo mới:

### Luồng cũ (Có vấn đề)
```
1. User upload video → Video document được tạo (ID: abc123)
2. User lưu khóa học → Tạo video document MỚI (ID: def456) ❌
3. Kết quả: 2 video documents cho cùng 1 video
```

### Luồng mới (Đã fix)
```
1. User upload video → Video document được tạo (ID: abc123, playbackId: xyz)
2. Frontend lưu videoId và playbackId vào lesson state
3. User lưu khóa học → Tìm video theo videoId hoặc playbackId
4. Update video document hiện có với section ID
5. Kết quả: 1 video document duy nhất ✅
```

## Chi tiết Implementation

### 1. Logic Xử Lý trong `updateSectionLessonsService()`

Có 4 cases được xử lý theo thứ tự ưu tiên:

#### Case 1: Video đã có `_id` (không phải temp)
```javascript
if (lesson._id && !lesson._id.startsWith('temp-')) {
    // Cập nhật video hiện có
    await Video.findByIdAndUpdate(lesson._id, {
        section: sectionId,
        title: lesson.title,
        // ... các fields khác
    });
    videoId = lesson._id;
}
```

**Khi nào xảy ra:** User edit khóa học đã tồn tại và lesson đã có `_id` từ database.

#### Case 2: Lesson mới có `videoId`
```javascript
else if (lesson.videoId) {
    const existingVideo = await Video.findById(lesson.videoId);
    
    if (existingVideo) {
        // Link video hiện có với section
        await Video.findByIdAndUpdate(lesson.videoId, {
            section: sectionId,
            title: lesson.title || existingVideo.title,
            // Merge data mới với data cũ
        });
        videoId = lesson.videoId;
    }
}
```

**Khi nào xảy ra:** User tạo khóa học mới và đã upload video trước đó. Frontend gửi `videoId` trong lesson data.

**Lợi ích:**
- Tận dụng video đã upload
- Không tạo duplicate
- Merge thông tin mới với thông tin cũ

#### Case 3: Lesson mới có `playbackId`
```javascript
else if (lesson.playbackId) {
    const existingVideo = await Video.findOne({ 
        playbackId: lesson.playbackId 
    });
    
    if (existingVideo) {
        // Link video tìm được với section
        await Video.findByIdAndUpdate(existingVideo._id, {
            section: sectionId,
            // ... update fields
        });
        videoId = existingVideo._id.toString();
    }
}
```

**Khi nào xảy ra:** Frontend không có `videoId` nhưng có `playbackId` từ MUX.

**Lợi ích:**
- Fallback mechanism nếu `videoId` bị mất
- Tìm video thông qua MUX playbackId (unique)
- Đảm bảo không tạo duplicate

#### Case 4: Không tìm thấy video hiện có
```javascript
if (!videoId) {
    // Tạo video mới
    const newVideo = new Video({
        section: sectionId,
        // ... fields
    });
    const savedVideo = await newVideo.save();
    videoId = savedVideo._id.toString();
}
```

**Khi nào xảy ra:** 
- Lesson chưa có video nào
- Video không được tìm thấy trong database
- Fallback cuối cùng

### 2. Cập nhật Response Data

Thêm `videoId` vào response để frontend có thể track:

```javascript
const sectionVideos = videos
    .filter(v => v.section.toString() === sectionIdStr)
    .map(v => ({
        _id: v._id,
        videoId: v._id,  // ✅ Thêm field này
        contentType: 'video',
        title: v.title,
        // ... other fields
    }));
```

**Tại sao cần `videoId`:**
- Frontend cần biết ID của video để lưu lại
- Khi lưu lần tiếp theo, gửi `videoId` để link đúng video
- Dùng để xóa video qua API

## Quy trình hoàn chỉnh

### Upload và Tạo Khóa Học Mới

```
┌─────────────────────────────────────────────┐
│ 1. User upload video qua MuxUploader        │
│    → MUX tạo asset                          │
│    → Backend tạo Video document (ID: v1)    │
│    → Frontend nhận: videoId=v1, playbackId  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Frontend lưu vào lesson state:           │
│    {                                         │
│      videoId: "v1",                         │
│      playbackId: "xyz",                     │
│      assetId: "asset123",                   │
│      status: "ready"                        │
│    }                                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. User click "Lưu khóa học"                │
│    → Frontend gửi section với videoId       │
│    → Backend tìm video v1 theo videoId      │
│    → Update video v1: section = s1          │
│    → Không tạo video mới ✅                 │
└─────────────────────────────────────────────┘
```

### Edit Khóa Học Đã Có

```
┌─────────────────────────────────────────────┐
│ 1. Load khóa học từ database                │
│    → Backend trả về lessons với _id         │
│    → Frontend hiển thị lessons              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. User edit lesson (thay đổi title, etc)   │
│    → lesson._id vẫn giữ nguyên             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. User click "Lưu khóa học"                │
│    → Frontend gửi lesson với _id            │
│    → Backend update video theo _id          │
│    → Không tạo video mới ✅                 │
└─────────────────────────────────────────────┘
```

## Các Trường Hợp Đặc Biệt

### Trường hợp 1: User upload video nhưng chưa lưu khóa học
```
- Video document tồn tại với section = null hoặc temp-section
- Khi lưu khóa học, video được link với section thực
- Video không bị orphan
```

### Trường hợp 2: User xóa lesson rồi add lại
```
- Video bị xóa khỏi section (xóa lesson)
- User add lesson mới và upload lại video
- Video mới được tạo (không conflict)
```

### Trường hợp 3: User thay video cho lesson
```
- Lesson có video cũ (ID: v1)
- User upload video mới (ID: v2)
- Frontend update lesson.videoId = v2
- Khi lưu: v1 bị xóa, v2 được link với section
```

### Trường hợp 4: Mất videoId nhưng còn playbackId
```
- Frontend bị mất videoId (cache clear, page refresh)
- Nhưng còn playbackId từ MUX
- Backend tìm video theo playbackId
- Link video đã tồn tại với section
```

## Merge Data Logic

Khi link video hiện có, data được merge thông minh:

```javascript
await Video.findByIdAndUpdate(existingVideo._id, {
    section: sectionId,  // Luôn update
    title: lesson.title || existingVideo.title,  // Prefer new, fallback old
    description: lesson.description || existingVideo.description || '',
    order: lesson.order || 1,  // New order
    contentUrl: lesson.contentUrl || existingVideo.contentUrl || '',
    playbackId: lesson.playbackId || existingVideo.playbackId || '',
    assetId: lesson.assetId || existingVideo.assetId || '',
    uploadId: lesson.uploadId || existingVideo.uploadId || '',
    status: lesson.status || existingVideo.status || 'uploading',
    duration: lesson.duration || existingVideo.duration || 0
});
```

**Nguyên tắc:**
- Dữ liệu mới được ưu tiên (lesson data từ frontend)
- Nếu không có, giữ dữ liệu cũ (existingVideo)
- Fallback về giá trị mặc định nếu cả hai đều null

## Benefits

### 1. Không Duplicate Videos ✅
- Mỗi video upload chỉ tạo 1 document
- Không tạo video mới mỗi lần save course
- Database sạch và dễ quản lý

### 2. Tối Ưu Storage 💾
- Không lãng phí storage với videos trùng
- MUX assets được tái sử dụng
- Cleanup dễ dàng hơn

### 3. Data Consistency 🔗
- Mối quan hệ giữa video và section rõ ràng
- Dễ tracking video được dùng ở đâu
- Không có orphan videos

### 4. Performance ⚡
- Không tạo document không cần thiết
- Queries nhanh hơn (ít records)
- Cleanup nhanh hơn

### 5. User Experience 👍
- Upload video một lần, dùng nhiều lần
- Edit khóa học không ảnh hưởng video
- Không lo bị mất video sau khi save

## Testing Scenarios

### ✅ Scenario 1: Tạo khóa học mới với video
```
1. Upload video → videoId = "abc"
2. Add lesson với videoId = "abc"
3. Save course
4. Verify: Chỉ 1 video document với section được set
```

### ✅ Scenario 2: Edit khóa học có video
```
1. Load course → lesson._id = "xyz"
2. Edit lesson title
3. Save course
4. Verify: Video "xyz" được update, không tạo video mới
```

### ✅ Scenario 3: Add video vào khóa học đã có
```
1. Load course
2. Upload video mới → videoId = "def"
3. Add lesson với videoId = "def"
4. Save course
5. Verify: Video "def" được link với section
```

### ✅ Scenario 4: Xóa và add lại video
```
1. Load course với video "abc"
2. Xóa lesson
3. Upload video mới → videoId = "ghi"
4. Add lesson với videoId = "ghi"
5. Save course
6. Verify: Video "abc" bị xóa, "ghi" được tạo mới
```

### ✅ Scenario 5: Link bằng playbackId
```
1. Upload video → playbackId = "xyz123"
2. Frontend mất videoId
3. Save course với lesson.playbackId = "xyz123"
4. Verify: Video được tìm thấy và linked đúng
```

## Logs và Debugging

Hệ thống log chi tiết giúp debug:

```javascript
console.log('  🔗 [updateSectionLessonsService] Linking existing video to section:', lesson.videoId);
console.log('  🔍 [updateSectionLessonsService] Searching video by playbackId:', lesson.playbackId);
console.log('  ✅ [updateSectionLessonsService] Video linked successfully');
console.log('  ⚠️ [updateSectionLessonsService] Video not found, creating new');
```

**Các log types:**
- 🔗 Link video hiện có
- 🔍 Tìm kiếm video
- ✅ Thành công
- ⚠️ Cảnh báo
- ➕ Tạo mới
- ✏️ Cập nhật

## Frontend Requirements

Frontend cần đảm bảo:

1. **Lưu `videoId` sau khi upload:**
```javascript
handleVideoUploadComplete(sectionId, lessonId, data) {
    updateLesson(sectionId, lessonId, 'videoId', data.videoId);  // ✅ Quan trọng
    updateLesson(sectionId, lessonId, 'playbackId', data.playbackId);
    // ... other fields
}
```

2. **Giữ `videoId` khi edit:**
```javascript
// Khi load course
lesson._id = video._id;
lesson.videoId = video.videoId;  // ✅ Đảm bảo có field này
```

3. **Gửi `videoId` khi save:**
```javascript
const lessonData = {
    _id: lesson._id,
    videoId: lesson.videoId,  // ✅ Gửi lên backend
    playbackId: lesson.playbackId,
    title: lesson.title,
    // ... other fields
};
```

## Database Schema

Video schema đã có đủ fields:

```javascript
{
    section: String,      // Link với section
    title: String,
    uploadId: String,     // MUX upload ID
    assetId: String,      // MUX asset ID
    playbackId: String,   // MUX playback ID (unique)
    status: String,
    duration: Number,
    // ... other fields
}
```

## Migration Note

**Không cần migration** vì:
- Schema không thay đổi
- Logic mới tương thích ngược
- Videos cũ vẫn hoạt động bình thường
- Chỉ ảnh hưởng videos mới được tạo

## Monitoring

Theo dõi các metrics:
- Số video documents được tạo vs số uploads
- Tỷ lệ video được link vs tạo mới
- Số orphan videos (section = null)
- Cleanup rate

## Troubleshooting

### Video không được link
**Nguyên nhân:** Frontend không gửi `videoId` hoặc `playbackId`
**Giải pháp:** Check frontend log, đảm bảo data được lưu đúng

### Video bị duplicate
**Nguyên nhân:** Logic fallback tạo video mới
**Giải pháp:** Check log để xem case nào bị trigger

### Video bị orphan (section = null)
**Nguyên nhân:** Upload video nhưng không lưu course
**Giải pháp:** Tạo cleanup job định kỳ xóa orphan videos

## Conclusion

Với thay đổi này:
- ✅ Không còn duplicate videos
- ✅ Tái sử dụng videos đã upload
- ✅ Data consistency được đảm bảo
- ✅ Performance được cải thiện
- ✅ User experience tốt hơn

Hệ thống bây giờ hoạt động chính xác theo mong muốn: **Upload video một lần, link nhiều lần, không tạo trùng.**
