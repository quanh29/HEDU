import express from "express";
import { addCourseRevision, getCourseRevisionsById, getCourseRevisionsByUserId, editCourse, deleteDraftCourseById } from "../controllers/courseRevisionController.js";

const courseRevisionRouter = express.Router();

courseRevisionRouter.post("/", addCourseRevision);
courseRevisionRouter.get("/course/:courseId", getCourseRevisionsById);
courseRevisionRouter.put("/course/:courseId", editCourse);
courseRevisionRouter.get("/user/:instructorId", getCourseRevisionsByUserId);
courseRevisionRouter.delete("/course/:courseId", deleteDraftCourseById);

export default courseRevisionRouter;
