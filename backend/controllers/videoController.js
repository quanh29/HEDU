import Video from "../models/video.js";

// Tạo video mới
export const addVideo = async (req, res) => {
    const { section, title, contentUrl, description, order } = req.body;

    if (!section || !title || !contentUrl) {
        return res.status(400).json({ message: 'section, title, and contentUrl are required' });
    }

    try {
        const newVideo = new Video({
            section,
            title,
            contentUrl,
            description,
            order: order || 1,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedVideo = await newVideo.save();
        res.status(201).json(savedVideo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating video', error: error.message });
    }
};

// Lấy video theo ID (protected - có đầy đủ thông tin)
export const getVideoById = async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.status(200).json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy tất cả videos theo section ID (public - không có contentUrl)
export const getVideosBySectionId = async (req, res) => {
    const { sectionId } = req.params;

    try {
        const videos = await Video.find({ section: sectionId }).sort({ order: 1 }).lean();
        
        if (!videos || videos.length === 0) {
            return res.status(404).json({ message: 'No videos found for this section' });
        }

        // Loại bỏ contentUrl và description cho route public
        const publicVideos = videos.map(video => ({
            _id: video._id,
            section: video.section,
            title: video.title,
            order: video.order
        }));

        res.status(200).json(publicVideos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Cập nhật video
export const updateVideo = async (req, res) => {
    const { videoId } = req.params;
    const { title, contentUrl, description, order } = req.body;

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (title) video.title = title;
        if (contentUrl) video.contentUrl = contentUrl;
        if (description !== undefined) video.description = description;
        if (order) video.order = order;
        video.updatedAt = new Date();

        const updatedVideo = await video.save();
        res.status(200).json(updatedVideo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating video', error: error.message });
    }
};

// Xóa video
export const deleteVideo = async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await Video.findByIdAndDelete(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting video', error: error.message });
    }
};
