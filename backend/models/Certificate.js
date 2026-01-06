import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  courseId: {
    type: String,
    required: true,
    ref: 'Course'
  }
  // use createdAt as the issuance date
}, { 
  timestamps: true
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;