import mongoose from "mongoose";

// Allowed portfolio content/resource types
export const CONTENT_RESOURCES = [
  "profile",
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certificates",
  "services",
  "socials",
];

// Schema for storing portfolio content
const contentItemSchema = new mongoose.Schema(
  {
    // Section/type of the portfolio content
    resource: {
      type: String,
      required: true,
      enum: CONTENT_RESOURCES,
      index: true,
    },

    // Main title of the content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    // Short subtitle
    subtitle: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },

    // Detailed description
    description: {
      type: String,
      trim: true,
      maxlength: 5_000,
      default: "",
    },

    // Main headline
    headline: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },

    // Image URL
    image: {
      type: String,
      trim: true,
      maxlength: 2_048,
      default: "",
    },

    // General URL
    url: {
      type: String,
      trim: true,
      maxlength: 2_048,
      default: "",
    },

    // GitHub repository URL
    githubUrl: {
      type: String,
      trim: true,
      maxlength: 2_048,
      default: "",
    },

    // Live project URL
    liveUrl: {
      type: String,
      trim: true,
      maxlength: 2_048,
      default: "",
    },

    // Start date (education/experience/project)
    startDate: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    // End date (education/experience/project)
    endDate: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    // Location of education/work/etc.
    location: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    // Tags related to the content
    tags: {
      type: [String],
      default: [],
    },

    // List of features
    features: {
      type: [String],
      default: [],
    },

    // Additional flexible data
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Display order
    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Whether the content is currently active
    active: {
      type: Boolean,
      default: true,
    },

    // Whether the content should be highlighted
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

// Index for faster resource-based sorting/querying
contentItemSchema.index({
  resource: 1,
  order: 1,
  createdAt: 1,
});

// Create and export the ContentItem model
export default mongoose.models.ContentItem ||
  mongoose.model("ContentItem", contentItemSchema);