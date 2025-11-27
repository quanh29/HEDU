import express from "express";
import { addSection, getSectionsByCourseId, updateSection, deleteSection } from "../controllers/sectionController.js";

const sectionRouter = express.Router();

sectionRouter.post("/", async (req, res) => {
    addSection(req, res);
});

sectionRouter.get("/:courseId", async (req, res) => {
    getSectionsByCourseId(req, res);
});

sectionRouter.put("/:sectionId", async (req, res) => {
    updateSection(req, res);
});

sectionRouter.delete("/:sectionId", async (req, res) => {
    deleteSection(req, res);
});

export default sectionRouter;