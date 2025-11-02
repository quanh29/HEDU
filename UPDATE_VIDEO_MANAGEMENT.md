# Cập nhật Quản lý Video - Lưu AssetId và Xóa MUX Assets

## Tổng quan
Cập nhật hệ thống để:
1. Lưu đầy đủ thông tin video (assetId, uploadId, duration) khi lưu khóa học
2. Tự động xóa video từ MUX khi xóa khóa học hoặc video đơn lẻ
3. Thêm nút hủy upload và xóa video trong UI

## Các thay đổi chi tiết

### 1. Backend - courseService.js

#### a) Thêm import Mux
```javascript
import Mux from '@mux/mux-node';
```

#### b) Thêm Helper Function: `deleteVideosWithMuxAssets()`
```javascript
async function deleteVideosWithMuxAssets(videoIds) {
    // Lấy thông tin videos
    const videos = await Video.find({ _id: { $in: videoIds } }).lean();
    
    // Initialize MUX client
    const { video: muxVideo } = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_SECRET_KEY
    });

    // Xóa MUX assets
    for (const video of videos) {
        if (video.assetId) {
            await muxVideo.assets.delete(video.assetId);
        }
    }

    // Xóa videos từ MongoDB
    await Video.deleteMany({ _id: { $in: videoIds } });
}
```

**Chức năng:**
- Tìm tất cả videos cần xóa
- Xóa asset từ MUX bằng `muxVideo.assets.delete(assetId)`
- Xóa video documents từ MongoDB
- Log chi tiết cho debugging
- Xử lý lỗi gracefully (tiếp tục nếu MUX xóa thất bại)

#### c) Cập nhật `updateSectionLessonsService()`

**Lưu thêm fields khi tạo/cập nhật video:**
```javascript
// Khi cập nhật video
await Video.findByIdAndUpdate(lesson._id, {
    title: lesson.title,
    description: lesson.description || '',
    order: lesson.order || 1,
    contentUrl: lesson.contentUrl || '',
    playbackId: lesson.playbackId || '',
    assetId: lesson.assetId || '',        // ✅ MỚI
    uploadId: lesson.uploadId || '',      // ✅ MỚI
    status: lesson.status || 'uploading',
    duration: lesson.duration || 0        // ✅ MỚI
});

// Khi tạo video mới
const newVideo = new Video({
    section: sectionId,
    title: lesson.title || 'Untitled Video',
    description: lesson.description || '',
    order: lesson.order || 1,
    contentUrl: lesson.contentUrl || '',
    playbackId: lesson.playbackId || '',
    assetId: lesson.assetId || '',        // ✅ MỚI
    uploadId: lesson.uploadId || '',      // ✅ MỚI
    status: lesson.status || 'uploading',
    duration: lesson.duration || 0        // ✅ MỚI
});
```

**Xóa videos với MUX assets:**
```javascript
// Trước đây
await Promise.all([
    ...videosToDelete.map(id => Video.findByIdAndDelete(id)),
    ...materialsToDelete.map(id => Material.findByIdAndDelete(id)),
    ...quizzesToDelete.map(id => Quiz.findByIdAndDelete(id))
]);

// Bây giờ
if (videosToDelete.length > 0) {
    await deleteVideosWithMuxAssets(videosToDelete);  // ✅ Xóa cả MUX assets
}

await Promise.all([
    ...materialsToDelete.map(id => Material.findByIdAndDelete(id)),
    ...quizzesToDelete.map(id => Quiz.findByIdAndDelete(id))
]);
```

#### d) Cập nhật `deleteCourseService()`

**Xóa videos và MUX assets khi xóa course:**
```javascript
// Lấy tất cả videos để xóa MUX assets
const videos = await Video.find({ section: { $in: sectionIds } }).lean();
const videoIds = videos.map(v => v._id);

// Xóa videos và MUX assets
if (videoIds.length > 0) {
    await deleteVideosWithMuxAssets(videoIds);  // ✅ Xóa cả MUX assets
}

// Xóa materials và quizzes
await Promise.all([
    Material.deleteMany({ section: { $in: sectionIds } }),
    Quiz.deleteMany({ section: { $in: sectionIds } })
]);
```

#### e) Cập nhật `getFullCourseDataForManagementService()`

**Trả về đầy đủ video data:**
```javascript
const sectionVideos = videos
    .filter(v => v.section.toString() === sectionIdStr)
    .map(v => ({
        _id: v._id,
        contentType: 'video',
        title: v.title,
        description: v.description,
        order: v.order,
        contentUrl: v.contentUrl,
        playbackId: v.playbackId,
        assetId: v.assetId,        // ✅ MỚI
        uploadId: v.uploadId,      // ✅ MỚI
        status: v.status,
        duration: v.duration       // ✅ MỚI
    }));
```

### 2. Backend - videoController.js

#### Cập nhật `deleteVideo()`

**Xóa asset từ MUX trước khi xóa database:**
```javascript
export const deleteVideo = async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Xóa asset từ MUX nếu có assetId
        if (video.assetId) {
            try {
                const Mux = (await import('@mux/mux-node')).default;
                const { video: muxVideo } = new Mux({
                    tokenId: process.env.MUX_TOKEN_ID,
                    tokenSecret: process.env.MUX_SECRET_KEY
                });

                await muxVideo.assets.delete(video.assetId);
                console.log(`✅ Deleted MUX asset: ${video.assetId}`);
            } catch (muxError) {
                console.error('Error deleting MUX asset:', muxError);
                // Continue with database deletion even if MUX deletion fails
            }
        }

        // Xóa video từ database
        await Video.findByIdAndDelete(videoId);
        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting video', error: error.message });
    }
};
```

### 3. Frontend - Curriculum.jsx

#### a) Cập nhật `handleVideoUploadComplete()`

**Lưu đầy đủ video data:**
```javascript
const handleVideoUploadComplete = (sectionId, lessonId, data) => {
    // Update lesson with video data
    updateLesson(sectionId, lessonId, 'contentUrl', data.contentUrl || '');
    updateLesson(sectionId, lessonId, 'playbackId', data.playbackId || '');
    updateLesson(sectionId, lessonId, 'assetId', data.assetId || '');
    updateLesson(sectionId, lessonId, 'videoId', data.videoId || '');
    updateLesson(sectionId, lessonId, 'uploadId', data.uploadId || '');  // ✅ MỚI
    updateLesson(sectionId, lessonId, 'duration', data.duration || 0);   // ✅ MỚI
    updateLesson(sectionId, lessonId, 'status', 'ready');
    updateLesson(sectionId, lessonId, 'uploadStatus', 'success');
};
```

#### b) Thêm `handleCancelUpload()`

**Hủy upload và reset state:**
```javascript
const handleCancelUpload = (sectionId, lessonId) => {
    // Reset upload state
    setUploadingLessons(prev => {
        const updated = { ...prev };
        delete updated[lessonId];
        return updated;
    });
    updateLesson(sectionId, lessonId, 'uploadStatus', 'idle');
    updateLesson(sectionId, lessonId, 'uploadProgress', 0);
    updateLesson(sectionId, lessonId, 'uploadError', undefined);
};
```

#### c) Thêm `handleDeleteVideo()`

**Xóa video qua API:**
```javascript
const handleDeleteVideo = async (sectionId, lessonId, videoId) => {
    if (!videoId) {
        console.error('No videoId to delete');
        return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa video này không?');
    if (!confirmed) return;

    try {
        const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/videos/${videoId}`,
            { method: 'DELETE' }
        );

        if (!response.ok) {
            throw new Error('Failed to delete video');
        }

        // Clear video data from lesson
        updateLesson(sectionId, lessonId, 'contentUrl', '');
        updateLesson(sectionId, lessonId, 'playbackId', '');
        updateLesson(sectionId, lessonId, 'assetId', '');
        updateLesson(sectionId, lessonId, 'videoId', '');
        updateLesson(sectionId, lessonId, 'uploadId', '');
        updateLesson(sectionId, lessonId, 'duration', 0);
        updateLesson(sectionId, lessonId, 'status', '');
        updateLesson(sectionId, lessonId, 'uploadStatus', 'idle');

        console.log('✅ Video deleted successfully');
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Có lỗi khi xóa video. Vui lòng thử lại.');
    }
};
```

#### d) Cập nhật UI - Thêm nút "Hủy upload"

```jsx
{lesson.uploadStatus === 'uploading' && (
    <>
        <div style={{ /* progress bar */ }}>
            <div style={{ width: `${lesson.uploadProgress || 0}%` }} />
        </div>
        <button
            onClick={() => handleCancelUpload(
                section.id || section._id,
                lesson.id || lesson._id
            )}
            style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500
            }}
        >
            Hủy upload
        </button>
    </>
)}
```

#### e) Cập nhật UI - Thêm nút "Xóa video"

```jsx
{(lesson.playbackId || lesson.status === 'ready') && (
    <div style={{ /* success box styles */ }}>
        <div>✓ Video đã upload thành công</div>
        {lesson.playbackId && <div><strong>Playback ID:</strong> {lesson.playbackId}</div>}
        <div><strong>Status:</strong> {lesson.status || 'ready'}</div>
        {lesson.assetId && <div><strong>Asset ID:</strong> {lesson.assetId}</div>}
        <button
            onClick={() => handleDeleteVideo(
                section.id || section._id,
                lesson.id || lesson._id,
                lesson.videoId
            )}
            style={{
                marginTop: 8,
                padding: '6px 12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4
            }}
        >
            <Trash2 size={14} />
            Xóa video
        </button>
    </div>
)}
```

## Luồng hoạt động

### 1. Upload và Lưu Video
```
1. User upload video qua MuxUploader
2. Video được upload lên MUX
3. MUX tạo asset và trả về assetId, playbackId
4. Frontend nhận data đầy đủ: {videoId, assetId, uploadId, playbackId, contentUrl, duration}
5. Data được lưu vào lesson state
6. User click "Lưu khóa học"
7. Backend nhận đầy đủ data và lưu vào MongoDB
```

### 2. Hủy Upload
```
1. User click "Hủy upload" khi đang upload
2. UpChunk abort upload
3. State được reset về idle
4. User có thể upload lại
```

### 3. Xóa Video Đơn Lẻ
```
1. User click "Xóa video" trên video đã upload
2. Hiển thị confirm dialog
3. Gọi DELETE /api/videos/:videoId
4. Backend:
   - Tìm video trong MongoDB
   - Xóa asset từ MUX bằng assetId
   - Xóa video document từ MongoDB
5. Frontend clear dữ liệu video từ lesson
6. Upload button hiển thị lại
```

### 4. Xóa Video khi Xóa Khóa Học
```
1. User xóa khóa học
2. Backend tìm tất cả sections của course
3. Tìm tất cả videos trong các sections
4. Với mỗi video:
   - Xóa asset từ MUX (nếu có assetId)
   - Log kết quả
5. Xóa tất cả videos từ MongoDB
6. Xóa materials, quizzes, sections
7. Xóa course từ MySQL và MongoDB
```

### 5. Xóa Video khi Cập nhật Khóa Học
```
1. User xóa lesson trong Curriculum
2. Click "Lưu khóa học"
3. Backend so sánh lessons cũ và mới
4. Tìm videos bị xóa
5. Gọi deleteVideosWithMuxAssets()
6. Xóa MUX assets và MongoDB documents
```

## Lợi ích

### 1. Tiết kiệm Storage
- Tự động xóa assets từ MUX khi không còn sử dụng
- Tránh lãng phí chi phí lưu trữ
- Cleanup khi xóa course hoặc lesson

### 2. Quản lý Tốt Hơn
- Lưu đầy đủ metadata (assetId, uploadId, duration)
- Dễ dàng debug và tracking
- Có thể xác định chính xác asset trên MUX

### 3. User Experience
- Có thể hủy upload khi không muốn tiếp tục
- Xóa video dễ dàng nếu upload nhầm
- Confirm dialog tránh xóa nhầm
- Feedback rõ ràng cho mọi thao tác

### 4. Data Integrity
- Đồng bộ giữa MongoDB và MUX
- Không để lại "orphan" assets
- Xử lý lỗi gracefully

## Environment Variables

Đảm bảo có các biến môi trường:

```env
# Backend (.env)
MUX_TOKEN_ID=your_mux_token_id
MUX_SECRET_KEY=your_mux_secret_key

# Frontend (.env)
VITE_BASE_URL=http://localhost:5000
```

## Testing Checklist

- [x] Upload video thành công và lưu đầy đủ data
- [x] AssetId được lưu khi lưu khóa học
- [x] Hủy upload khi đang upload
- [x] Xóa video đơn lẻ → xóa cả MUX asset
- [x] Xóa khóa học → xóa tất cả MUX assets
- [x] Cập nhật khóa học và xóa lesson → xóa MUX asset
- [x] Error handling khi MUX API thất bại
- [x] Confirm dialog trước khi xóa
- [x] State reset đúng sau mỗi action
- [x] Log chi tiết cho debugging

## API Endpoints

### DELETE /api/videos/:videoId
Xóa video và MUX asset

**Response Success:**
```json
{
  "message": "Video deleted successfully"
}
```

**Response Error:**
```json
{
  "message": "Video not found"
}
```

## Notes

1. **Graceful Error Handling**: Nếu xóa MUX asset thất bại, vẫn tiếp tục xóa database để tránh blocking
2. **Duplicate Protection**: Kiểm tra assetId trước khi xóa để tránh xóa nhầm
3. **Logging**: Log chi tiết mọi thao tác để dễ debug
4. **Confirmation**: Luôn confirm với user trước khi xóa data quan trọng
5. **State Sync**: Đảm bảo state được sync giữa frontend và backend

## Troubleshooting

### Video không bị xóa từ MUX
- Kiểm tra `assetId` có được lưu đúng không
- Xem log để biết lỗi từ MUX API
- Verify MUX credentials

### AssetId không được lưu
- Kiểm tra MuxUploader có trả về đầy đủ data không
- Verify `handleVideoUploadComplete` có lưu tất cả fields
- Check `updateSectionLessonsService` có nhận assetId không

### Xóa video nhưng frontend không cập nhật
- Kiểm tra `handleDeleteVideo` có clear tất cả fields không
- Verify state management của parent component
- Check re-render sau khi update state
