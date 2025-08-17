import express from "express";
import { addCourseRevision, getCourseRevisionsById } from "../controllers/courseRevisionController.js";

const courseRevisionRouter = express.Router();

courseRevisionRouter.post("/", addCourseRevision);
courseRevisionRouter.get("/:courseId", getCourseRevisionsById);

export default courseRevisionRouter;
