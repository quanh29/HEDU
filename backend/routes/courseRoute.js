import express from "express";
import { addCourse, getCourseById, findCourseByTitle } from "../controllers/courseController.js";

const courseRouter = express.Router();

courseRouter.get("/get/:courseId", async (req, res) => {
    getCourseById(req, res);
});

courseRouter.post("/", async (req, res) => {
    addCourse(req, res);
});

courseRouter.get("/search", async (req, res) => {
    findCourseByTitle(req, res);
});


export default courseRouter;
