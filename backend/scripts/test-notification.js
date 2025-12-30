// Test script to create a sample notification
// Run: node scripts/test-notification.js

import mongoose from 'mongoose';
import 'dotenv/config';

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);

console.log('✅ Connected to MongoDB');

// Import models
const Notification = (await import('../models/Notification.js')).default;

// Create a test notification
const testUserId = process.argv[2]; // Pass user ID as argument

if (!testUserId) {
  console.error('❌ Please provide a user ID as argument');
  console.log('Usage: node scripts/test-notification.js USER_ID');
  process.exit(1);
}

try {
  const notification = new Notification({
    receiver_id: testUserId,
    event_type: 'system_alert',
    event_title: 'Test Notification',
    event_message: 'This is a test notification to verify the system is working correctly.',
    event_url: '/',
    is_read: false
  });

  await notification.save();

  console.log('✅ Test notification created successfully!');
  console.log('Notification ID:', notification._id);
  console.log('Receiver ID:', notification.receiver_id);
  console.log('Title:', notification.event_title);
  
  // Fetch all notifications for this user
  const userNotifications = await Notification.find({ receiver_id: testUserId }).sort({ createdAt: -1 });
  console.log(`\n📊 Total notifications for user: ${userNotifications.length}`);
  
} catch (error) {
  console.error('❌ Error creating notification:', error);
}

mongoose.connection.close();
console.log('\n✅ Connection closed');
