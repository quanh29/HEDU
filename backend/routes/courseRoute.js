import express from "express";
import { 
    addCourse, 
    getCourseById, 
    getCourse, 
    getFullCourseContent,
    getCourseContentForEnrolledUser,
    getInstructorCourses,
    updateCourseStatus,
    getCourseByIdForManagement,
    importCourseData,
    updateCourse,
    deleteCourse,
    getFullCourseDataForManagement
} from "../controllers/courseController.js";

const courseRouter = express.Router();

// Public routes - chỉ hiển thị khóa học đã duyệt
courseRouter.get("/search", async (req, res) => {
    getCourse(req, res);
});

// Route để lấy full course content (public - không có nội dung nhạy cảm)
courseRouter.get("/:courseId/full", async (req, res) => {
    getFullCourseContent(req, res);
});

// Route mới: lấy chi tiết đầy đủ course content cho học viên đã đăng ký
// Bao gồm contentUrl của videos, materials và chi tiết quiz
courseRouter.get("/:courseId/content", async (req, res) => {
    getCourseContentForEnrolledUser(req, res);
});

// Route cũ để tương thích ngược (gọi cùng hàm)
courseRouter.get("/:courseId", async (req, res) => {
    getFullCourseContent(req, res);
});

// Management routes - cho instructor và admin
courseRouter.get("/instructor/:instructorId", async (req, res) => {
    getInstructorCourses(req, res);
});

courseRouter.get("/manage/:courseId", async (req, res) => {
    getCourseByIdForManagement(req, res);
});

// Route mới: lấy full course data cho management (bao gồm sections và lessons)
courseRouter.get("/manage/:courseId/full", async (req, res) => {
    getFullCourseDataForManagement(req, res);
});

courseRouter.patch("/:courseId/status", async (req, res) => {
    updateCourseStatus(req, res);
});

courseRouter.put("/:courseId", async (req, res) => {
    updateCourse(req, res);
});

courseRouter.delete("/:courseId", async (req, res) => {
    deleteCourse(req, res);
});

// Import route - để import dữ liệu course vào MongoDB
courseRouter.post("/import", async (req, res) => {
    importCourseData(req, res);
});

courseRouter.post("/", async (req, res) => {
    addCourse(req, res);
});

export default courseRouter;
