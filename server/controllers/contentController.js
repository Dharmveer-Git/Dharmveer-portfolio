import mongoose from "mongoose";

import ContentItem, {
  CONTENT_RESOURCES,
} from "../models/ContentItem.js";

import {
  InputValidationError,
  sanitizeContentInput,
} from "../utils/validation.js";

// Valid portfolio resources
const validResources = new Set(CONTENT_RESOURCES);

// Resources that can have only one item
const singletonResources = new Set(["profile", "about"]);

// Resources whose order can be changed
const reorderableResources = new Set([
  "skills",
  "projects",
  "certificates",
]);

// Get and validate resource from request params
function resourceFrom(request, response) {
  const resource = String(request.params.resource || "").toLowerCase();

  if (!validResources.has(resource)) {
    response.status(404).json({
      message: "Content resource not found.",
    });

    return null;
  }

  return resource;
}

// Check whether ID is invalid
const invalidId = (id) => !mongoose.isObjectIdOrHexString(id);

// Public reads must never expose unpublished content.
export async function getPublicContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);
    if (!resource) return;
    if (invalidId(request.params.id)) {
      return response.status(400).json({ message: "Invalid content item ID." });
    }
    const item = await ContentItem.findOne({
      _id: request.params.id, resource, active: true,
    }).lean();
    if (!item) return response.status(404).json({ message: "Content item not found." });
    return response.json(item);
  } catch (error) { return next(error); }
}

export async function patchContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);
    if (!resource) return;
    if (invalidId(request.params.id)) {
      return response.status(400).json({ message: "Invalid content item ID." });
    }
    const current = await ContentItem.findOne({ _id: request.params.id, resource }).lean();
    if (!current) return response.status(404).json({ message: "Content item not found." });
    const body = request.body || {};
    const allowed = Object.keys(sanitizeContentInput({ title: "validation" }, resource));
    const keys = Object.keys(body);
    if (!keys.length || keys.some((key) => !allowed.includes(key))) {
      throw new InputValidationError("Provide at least one supported content field.");
    }
    if (keys.some((key) => body[key] === null)) {
      throw new InputValidationError("Content fields cannot be null. Use an empty string or array to clear a field.");
    }
    if (body.meta !== undefined && (typeof body.meta !== "object" || Array.isArray(body.meta))) {
      throw new InputValidationError("Meta must be an object.");
    }
    if (body.meta && Object.keys(body.meta).some((key) => !["headline", "problem", "solution", "learning", "enabled"].includes(key))) {
      throw new InputValidationError("Unsupported meta field.");
    }
    const sanitized = sanitizeContentInput({ ...current, ...body, meta: { ...current.meta, ...body.meta } }, resource);
    const updates = Object.fromEntries(keys.filter((key) => key !== "meta").map((key) => [key, sanitized[key]]));
    for (const key of Object.keys(body.meta || {})) updates[`meta.${key}`] = sanitized.meta[key];
    if (!Object.keys(updates).length) throw new InputValidationError("Provide at least one content field to update.");
    const item = await ContentItem.findOneAndUpdate(
      { _id: request.params.id, resource },
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );
    if (!item) return response.status(404).json({ message: "Content item not found." });
    return response.json(item);
  } catch (error) {
    if (error instanceof InputValidationError || error instanceof mongoose.Error.ValidationError) {
      return response.status(400).json({ message: error.message });
    }
    return next(error);
  }
}

// Get active content for public website
export async function listPublicContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);

    if (!resource) return;

    const items = await ContentItem.find({
      resource,
      active: true,
    })
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    response.json(items);
  } catch (error) {
    next(error);
  }
}

// Get all content for admin dashboard
export async function listAdminContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);

    if (!resource) return;

    const items = await ContentItem.find({
      resource,
    })
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    response.json(items);
  } catch (error) {
    next(error);
  }
}

// Create new content item
export async function createContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);

    if (!resource) return;

    // Profile and About can have only one item
    if (
      singletonResources.has(resource) &&
      (await ContentItem.exists({ resource }))
    ) {
      return response.status(409).json({
        message: `${resource} already exists. Edit the saved item instead.`,
      });
    }

    // Validate and clean incoming data
    const data = sanitizeContentInput(request.body, resource);

    // Find the current highest order number
    const last = await ContentItem.findOne({ resource })
      .sort({ order: -1 })
      .select("order")
      .lean();

    // Assign next order number
    data.order = last ? last.order + 1 : 0;

    // Create content item
    const item = await ContentItem.create({
      resource,
      ...data,
    });

    response.status(201).json(item);
  } catch (error) {
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

// Update existing content item
export async function updateContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);

    if (!resource) return;

    // Validate MongoDB ObjectId
    if (invalidId(request.params.id)) {
      return response.status(400).json({
        message: "Invalid content item ID.",
      });
    }

    const item = await ContentItem.findOneAndUpdate(
      {
        _id: request.params.id,
        resource,
      },
      sanitizeContentInput(request.body, resource),
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!item) {
      return response.status(404).json({
        message: "Content item not found.",
      });
    }

    return response.json(item);
  } catch (error) {
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

// Delete content item
export async function deleteContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);

    if (!resource) return;

    // Profile and About cannot be deleted
    if (singletonResources.has(resource)) {
      return response.status(400).json({
        message: `${resource} cannot be deleted. Edit or hide it instead.`,
      });
    }

    // Validate MongoDB ObjectId
    if (invalidId(request.params.id)) {
      return response.status(400).json({
        message: "Invalid content item ID.",
      });
    }

    const item = await ContentItem.findOneAndDelete({
      _id: request.params.id,
      resource,
    });

    if (!item) {
      return response.status(404).json({
        message: "Content item not found.",
      });
    }

    return response.json({
      message: "Content item deleted.",
    });
  } catch (error) {
    return next(error);
  }
}

// Reorder content items
export async function reorderContent(request, response, next) {
  try {
    const resource = resourceFrom(request, response);

    if (!resource) return;

    // Check whether this resource supports reordering
    if (!reorderableResources.has(resource)) {
      return response.status(400).json({
        message: `${resource} does not support reordering.`,
      });
    }

    const ids = Array.isArray(request.body?.ids)
      ? request.body.ids
      : [];

    // Validate IDs and prevent duplicates
    if (
      !ids.length ||
      ids.some(invalidId) ||
      new Set(ids).size !== ids.length
    ) {
      return response.status(400).json({
        message: "A valid ordered ID list is required.",
      });
    }

    // Check whether all resource items are included
    const [matchingCount, totalCount] = await Promise.all([
      ContentItem.countDocuments({
        resource,
        _id: { $in: ids },
      }),

      ContentItem.countDocuments({
        resource,
      }),
    ]);

    if (
      matchingCount !== ids.length ||
      totalCount !== ids.length
    ) {
      return response.status(400).json({
        message:
          "Order list must include every item exactly once.",
      });
    }

    // Update order of every item
    await ContentItem.bulkWrite(
      ids.map((id, order) => ({
        updateOne: {
          filter: {
            _id: id,
            resource,
          },
          update: {
            $set: {
              order,
            },
          },
        },
      }))
    );

    // Return updated ordered list
    return response.json(
      await ContentItem.find({ resource })
        .sort({
          order: 1,
          createdAt: 1,
        })
        .lean()
    );
  } catch (error) {
    return next(error);
  }
}
