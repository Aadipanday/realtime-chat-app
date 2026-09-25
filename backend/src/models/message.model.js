import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
      default: "",
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    mediaUrl: {
      type: String,
      default: null,
      set: (v) => (v ? v.replace(/^http:\/\//i, "https://") : v),
    },
    mediaType: {
      type: String,
      enum: ["text", "image", "audio"],
      default: "text",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export { Message };
export default Message;
