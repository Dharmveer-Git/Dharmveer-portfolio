import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    credentialsManaged: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
    singletonKey: {
      type: String,
      default: "super-admin",
      immutable: true,
      unique: true,
      enum: ["super-admin"],
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);