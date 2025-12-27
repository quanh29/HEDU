import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  user_id : { 
    type: String, 
    required: true,
    ref: 'User'
  }
},
{ 
  _id: false, timestamps: false
});

const conversationSchema = new mongoose.Schema({
  participants: {
    type: [participantSchema],
    required: true,
  }
},
{ 
  timestamps: true
});

conversationSchema.index({ 
  "participants.user_id": 1 
});


const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;