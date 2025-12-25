import e from "express";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id : { 
    type: String, 
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true
  },
  is_male: {
    type: Boolean,
    required: false
  },
  dob: {
    type: Date,
    required: false
  },
  headline: {
    type: String,
    required: false
  },
  bio: {
    type: String,
    required: false
  },
  profile_image_url: {
    type: String,
    required: false
  },
  is_admin: {
    type: Boolean,
    default: false
  }
}, 
{ 
  timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;