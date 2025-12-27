import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation_id : { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'Conversation'
  },
  sender_id : {
    type: String, 
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: false,
    trim: true
  },
  img_url: {
    type: String,
    required: false
  },
  is_read: {
    type: Boolean,
    required: true,
    default: false
  }
},
{ 
  timestamps: true
});

messageSchema.index({ 
  "conversation_id": 1 
});


const Message = mongoose.model("Message", messageSchema);

export default Message;