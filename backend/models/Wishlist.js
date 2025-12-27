import e from "express";
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  course_id: {
    type: String,
    required: true,
    ref: 'Course'
  }
});

const wishlistSchema = new mongoose.Schema({
  user_id : {
    type: String, 
    required: true,   
    ref: 'User'
  },
  items: [itemSchema]
},
{ 
  timestamps: true
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;