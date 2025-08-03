import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id : { type: String, required: true},
  fullName: { type: String, required: true },
  emailAddress: { type: String, required: true },
  avaUrl: { type: String, required: false },
  headline: { type: String, required: false },
  bio: { type: String, required: false },
});

const User = mongoose.model("User", userSchema);

export default User;