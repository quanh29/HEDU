import express from "express";
import { addCourseRevision, getCourseRevisionsById, getCourseRevisionsByUserId } from "../controllers/courseRevisionController.js";

const courseRevisionRouter = express.Router();

courseRevisionRouter.post("/", addCourseRevision);
courseRevisionRouter.get("/user/:instructorId", getCourseRevisionsByUserId);
// courseRevisionRouter.get("/:courseId", getCourseRevisionsById);

export default courseRevisionRouter;
