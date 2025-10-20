import express from "express";
import { getAllHeadingsWithCategories, getAllCategories } from "../controllers/headingController.js";

const headingRouter = express.Router();

// Get all headings with their categories
headingRouter.get("/", async (req, res) => {
    getAllHeadingsWithCategories(req, res);
});

// Get all categories
headingRouter.get("/categories", async (req, res) => {
    getAllCategories(req, res);
});

export default headingRouter;
