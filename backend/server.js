import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import courseRouter from './routes/courseRoute.js';
import sectionRouter from './routes/sectionRoute.js';
import videoRouter from './routes/videoRoute.js';
import materialRouter from './routes/materialRoute.js';
import quizRouter from './routes/quizRoute.js';
import userRouter from './routes/userRoute.js';
import courseRevisionRouter from './routes/courseRevisionRoute.js';
import headingRouter from './routes/headingRoute.js';
import importRouter from './routes/importRoute.js';
import levelRouter from './routes/levelRoute.js';

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
app.use("/api/video", videoRouter);
app.use("/api/material", materialRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/user", userRouter);
app.use("/api/course-revision", courseRevisionRouter);
app.use("/api/headings", headingRouter);
app.use("/api/import", importRouter);
app.use("/api/levels", levelRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Ngrok setup (in development only)
// when running in production, remove ngrok code, levelrouter.js, levelController.js
import http from 'http';
import ngrok from '@ngrok/ngrok';

// Create webserver
http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('Congrats you have created an ngrok web server');
}).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// Get your endpoint online
ngrok.connect({ 
	addr: 8080, 
	authtoken: process.env.NGROK_AUTH_TOKEN 
})
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));

export default app;

