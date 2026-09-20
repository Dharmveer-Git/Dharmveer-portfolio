import mongoose from "mongoose";

import Message from "../models/Message.js";

import {
  InputValidationError,
  sanitizeMessageInput,
} from "../utils/validation.js";

// Create a new contact message
export async function createMessage(request, response, next) {
  try {
    // Validate and sanitize incoming message data
    await Message.create(
      sanitizeMessageInput(request.body)
    );

    return response.status(201).json({
      message: "Thanks. Your message has been sent.",
    });
  } catch (error) {
    // Handle validation errors
    if (
      error instanceof InputValidationError ||
      error instanceof mongoose.Error.ValidationError
    ) {
      return response.status(400).json({
        message: error.message,
      });
    }

    return next(error);
  }
}

// Get all messages
export async function listMessages(_request, response, next) {
  try {
    const messages = await Message.find()
      .sort({
        createdAt: -1,
      })
      .lean();

    return response.json(messages);
  } catch (error) {
    next(error);
  }
}

// Mark message as read/unread
export async function setMessageRead(request, response, next) {
  try {
    // Validate read value
    if (typeof request.body?.read !== "boolean") {
      return response.status(400).json({
        message: "Read must be true or false.",
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.isObjectIdOrHexString(request.params.id)) {
      return response.status(400).json({
        message: "Invalid message ID.",
      });
    }

    // Update message
    const message = await Message.findByIdAndUpdate(
      request.params.id,
      {
        read: request.body.read,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!message) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    return response.json(message);
  } catch (error) {
    return next(error);
  }
}

// Get a single message
export async function getMessage(request, response, next) {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isObjectIdOrHexString(request.params.id)) {
      return response.status(400).json({
        message: "Invalid message ID.",
      });
    }

    const message = await Message.findById(
      request.params.id
    ).lean();

    if (!message) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    return response.json(message);
  } catch (error) {
    return next(error);
  }
}

// Delete a message
export async function deleteMessage(request, response, next) {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isObjectIdOrHexString(request.params.id)) {
      return response.status(400).json({
        message: "Invalid message ID.",
      });
    }

    const message = await Message.findByIdAndDelete(
      request.params.id
    );

    if (!message) {
      return response.status(404).json({
        message: "Message not found.",
      });
    }

    return response.json({
      message: "Message deleted.",
    });
  } catch (error) {
    return next(error);
  }
}