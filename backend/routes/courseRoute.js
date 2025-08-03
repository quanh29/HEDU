import express from "express";
import { addCourse, getCourseById, getCourse, getFullCourseContent } from "../controllers/courseController.js";

const courseRouter = express.Router();

courseRouter.get("/search", async (req, res) => {
    getCourse(req, res);
});

courseRouter.get("/:courseId", async (req, res) => {
    getFullCourseContent(req, res);
});

// courseRouter.get("/:courseId", async (req, res) => {
//     getCourseById(req, res);
// });

courseRouter.post("/", async (req, res) => {
    addCourse(req, res);
});



export default courseRouter;
