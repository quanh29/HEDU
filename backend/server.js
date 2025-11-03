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
import languageRouter from './routes/languageRoute.js';
import muxUploadRouter from './routes/muxUploadRoute.js';
import cloudinaryRouter from './routes/cloudinaryRoute.js';
import thumbnailRouter from './routes/thumbnailRoute.js';

const app = express();
const port = 3000;

await connectDB();

// Middleware
app.use(cors());
app.use(clerkMiddleware());

// Webhook route TRƯỚC express.json() để xử lý raw body
app.use('/api/mux/webhook', express.raw({ type: 'application/json' }));

// Sau đó mới parse JSON cho các routes khác
app.use(express.json());

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));


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
app.use("/api/languages", languageRouter);
app.use("/api/mux", muxUploadRouter);
app.use("/api/cloudinary", cloudinaryRouter);
app.use("/api/thumbnail", thumbnailRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Ngrok setup (in development only)
// when running in production, remove ngrok code
import ngrok from '@ngrok/ngrok';

// Setup ngrok tunnel for MUX webhooks
if (process.env.NODE_ENV !== 'production' && process.env.NGROK_AUTH_TOKEN) {
	ngrok.connect({ 
		addr: 3000, 
		authtoken: process.env.NGROK_AUTH_TOKEN 
	})
	.then(listener => {
		console.log('\n🌐 Ngrok tunnel established!');
		console.log(`📡 Public URL: ${listener.url()}`);
		console.log(`🔗 Webhook URL for MUX: ${listener.url()}/api/mux/webhook`);
	})
	.catch(err => {
		console.error('❌ Failed to establish ngrok tunnel:', err);
	});
}

export default app;

