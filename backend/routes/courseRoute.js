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
    getFullCourseDataForManagement,
    getRelatedCourses,
    getInstructorOtherCourses,
    toggleCourseVisibility
} from "../controllers/courseController.js";
import { protectEnrolledUser, protectCourseOwner } from "../middleware/auth.js";

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
// Protected route - yêu cầu user đã đăng ký khóa học
courseRouter.get("/:courseId/content", protectEnrolledUser, async (req, res) => {
    getCourseContentForEnrolledUser(req, res);
});

// Route cũ để tương thích ngược (gọi cùng hàm)
courseRouter.get("/:courseId", async (req, res) => {
    getFullCourseContent(req, res);
});

// Related courses route
courseRouter.get("/:courseId/related", async (req, res) => {
    getRelatedCourses(req, res);
});

// Instructor other courses route
courseRouter.get("/:courseId/instructor-courses", async (req, res) => {
    getInstructorOtherCourses(req, res);
});

// Management routes - cho instructor và admin
courseRouter.get("/instructor/:instructorId", async (req, res) => {
    getInstructorCourses(req, res);
});

courseRouter.get("/manage/:courseId", async (req, res) => {
    getCourseByIdForManagement(req, res);
});

// Route mới: lấy full course data cho management (bao gồm sections và lessons)
courseRouter.get("/manage/:courseId/full", protectCourseOwner, async (req, res) => {
    getFullCourseDataForManagement(req, res);
});

courseRouter.patch("/:courseId/status", async (req, res) => {
    updateCourseStatus(req, res);
});

courseRouter.patch("/:courseId/visibility", protectCourseOwner, async (req, res) => {
    toggleCourseVisibility(req, res);
});

courseRouter.put("/:courseId", protectCourseOwner, async (req, res) => {
    updateCourse(req, res);
});

courseRouter.delete("/:courseId", protectCourseOwner, async (req, res) => {
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
