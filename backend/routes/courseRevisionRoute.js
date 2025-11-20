import express from "express";
import { 
    addCourseRevision, 
    getCourseRevisionsById, 
    getCourseRevisionsByUserId, 
    editCourse, 
    deleteDraftCourseById,
    createCourseRevision,
    getPendingRevisions,
    approveRevision,
    rejectRevision,
    checkPendingRevision
} from "../controllers/courseRevisionController.js";
import { protectAdmin, protectCourseOwner } from "../middleware/auth.js";

const courseRevisionRouter = express.Router();

courseRevisionRouter.post("/", addCourseRevision);
courseRevisionRouter.get("/course/:courseId", getCourseRevisionsById);
courseRevisionRouter.put("/course/:courseId", editCourse);
courseRevisionRouter.get("/user/:instructorId", getCourseRevisionsByUserId);
courseRevisionRouter.delete("/course/:courseId", deleteDraftCourseById);

// New revision workflow routes
courseRevisionRouter.post("/create/:courseId", protectCourseOwner, createCourseRevision);
courseRevisionRouter.get("/pending", protectAdmin, getPendingRevisions);
courseRevisionRouter.get("/check-pending/:courseId", checkPendingRevision);
courseRevisionRouter.post("/approve/:revisionId", protectAdmin, approveRevision);
courseRevisionRouter.post("/reject/:revisionId", protectAdmin, rejectRevision);

export default courseRevisionRouter;
