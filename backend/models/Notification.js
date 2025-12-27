import e from "express";
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  receiver_id : { 
    type: String, 
    required: true,
    ref: 'User'
  },
  is_read: {
    type: Boolean,
    required: true,
    default: false
  },
  event_type: {
    type: String,
    required: true,
    enum: ['course_update', 'system_alert', 'course_enrollment', 'course_review', 'refund', 'other']
  },
  event_title: {
    type: String,
    required: true
  },
  event_message: {
    type: String,
    required: true
  },
  event_url: {
    type: String,
    required: false
  }
},
{ 
  timestamps: true
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;