import express from "express";
import { addSection, getSectionsByCourseId } from "../controllers/sectionController.js";

const sectionRouter = express.Router();

sectionRouter.post("/", async (req, res) => {
    addSection(req, res);
});

sectionRouter.get("/:courseId", async (req, res) => {
    getSectionsByCourseId(req, res);
});

export default sectionRouter;