import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId : { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  emailAddress: { type: String, required: true },
  avaUrl: { type: String, required: false },
});

const User = mongoose.model("User", userSchema);

export default User;