import e from "express";
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  user_id : { 
    type: String, 
    required: true,   
    ref: 'User'
  },
  course_id: {
    type: String,
    required: true,
    ref: 'Course'
  },
  rating: {
    type: Number,
    required: true
  },
  comment: {
    type: String,
    required: false
  }
},
{ 
  timestamps: true
});

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;