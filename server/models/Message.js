import mongoose from "mongoose";

// Schema for storing contact messages
const messageSchema = new mongoose.Schema(
  {
    // Name of the person sending the message
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    // Email address of the sender
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    // Company name (optional)
    company: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    // Subject of the message
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    // Main message content
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3_000,
    },

    // Admin can mark the message as read
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

// Create and export the Message model
export default mongoose.models.Message ||
  mongoose.model("Message", messageSchema);