import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import courseRouter from './routes/courseRoute.js';
import sectionRouter from './routes/sectionRoute.js';
import lessonRouter from './routes/lessonRoute.js';

const app = express();
const port = 3000;

await connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())


// API Routes
app.get('/', (req, res) => {
  res.send('Server is Live!');
});
app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/course", courseRouter);
app.use("/api/section", sectionRouter);
app.use("/api/lesson", lessonRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
export default app;

