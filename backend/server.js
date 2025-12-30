import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { clerkMiddleware } from '@clerk/express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketAuth } from './middleware/socketAuth.js';
import { setupVideoSocketHandlers } from './sockets/videoSocket.js';
import { setupMessageSocketHandlers } from './sockets/messageSocket.js';
import { setupNotificationSocketHandlers } from './sockets/notificationSocket.js';
import courseRouter from './routes/courseRoute.js';
import sectionRouter from './routes/sectionRoute.js';
import lessonRouter from './routes/lessonRoute.js';
import videoRouter from './routes/videoRoute.js';
import materialRouter from './routes/materialRoute.js';
import quizRouter from './routes/quizRoute.js';
import courseRevisionRouter from './routes/courseRevisionRoute.js';
import draftRouter from './routes/draftRoute.js';
import headingRouter from './routes/headingRoute.js';
import importRouter from './routes/importRoute.js';
import levelRouter from './routes/levelRoute.js';
import languageRouter from './routes/languageRoute.js';
import muxUploadRouter from './routes/muxUploadRoute.js';
import cloudinaryRouter from './routes/cloudinaryRoute.js';
import thumbnailRouter from './routes/thumbnailRoute.js';
import adminRouter from './routes/adminRoute.js';
import enrollmentRouter from './routes/enrollmentRoute.js';
import ratingRouter from './routes/ratingRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import paymentRouter from './routes/paymentRoute.js';
import voucherRouter from './routes/voucherRoute.js';
import refundRouter from './routes/refundRoute.js';
import userRouter from './routes/userRoute.js';
import walletRouter from './routes/walletRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';
import messageRouter from './routes/messageRoute.js';
import wishlistRouter from './routes/wishlistRoute.js';
import notificationRouter from './routes/notificationRoute.js';

const app = express();
const server = createServer(app);
const port = 3000;

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use(socketAuth);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`🔌 New socket connection - User: ${socket.userId}, Socket: ${socket.id}`);
  
  // Setup video upload event handlers
  setupVideoSocketHandlers(socket, io);
  
  // Setup message event handlers
  
  // Setup notification event handlers
  setupNotificationSocketHandlers(socket, io);
  setupMessageSocketHandlers(socket, io);
});

// Export io instance for use in controllers
export { io };

await connectDB();

// Middleware
app.use(cors());
app.use(clerkMiddleware());

// Webhook routes TRƯỚC express.json() để xử lý raw body
app.use('/api/user/webhook', express.raw({ type: 'application/json' }));
app.use('/api/mux/webhook', express.raw({ type: 'application/json' }));
app.use('/api/wallet/momo/callback', express.raw({ type: 'application/json' }));

// Sau đó mới parse JSON cho các routes khác
app.use(express.json());

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));


// API Routes
app.get('/', (req, res) => {
  res.send('Server is Live!');
});
// app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/course", courseRouter);
app.use("/api/section", sectionRouter);
app.use("/api/lesson", lessonRouter);
app.use("/api/video", videoRouter);
app.use("/api/material", materialRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/course-revision", courseRevisionRouter);
app.use("/api/course-draft", draftRouter);
app.use("/api/headings", headingRouter);
app.use("/api/import", importRouter);
app.use("/api/levels", levelRouter);
app.use("/api/languages", languageRouter);
app.use("/api/mux", muxUploadRouter);
app.use("/api/cloudinary", cloudinaryRouter);
app.use("/api/thumbnail", thumbnailRouter);
app.use("/api/admin", adminRouter);
app.use("/api/enrollment", enrollmentRouter);
app.use("/api/rating", ratingRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/voucher", voucherRouter);
app.use("/api/refund", refundRouter);
app.use("/api/user", userRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/message", messageRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/notifications", notificationRouter);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`✅ Socket.IO server initialized`);
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

