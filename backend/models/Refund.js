import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  requestDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedDate: {
    type: Date
  },
  processedBy: {
    type: String // Admin user ID who processed the refund
  },
  // MoMo refund transaction details
  momoTransactionId: {
    type: String
  },
  momoRefundId: {
    type: String
  },
  momoRefundResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  // Original payment transaction ID for reference
  originalTransactionId: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
refundSchema.index({ userId: 1, status: 1 });
refundSchema.index({ courseId: 1, status: 1 });
refundSchema.index({ requestDate: -1 });

// Virtual populate to get course details
refundSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: 'course_id',
  justOne: true
});

// Virtual populate to get enrollment details
refundSchema.virtual('enrollment', {
  ref: 'Enrollment',
  localField: 'enrollmentId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
refundSchema.set('toJSON', { virtuals: true });
refundSchema.set('toObject', { virtuals: true });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
