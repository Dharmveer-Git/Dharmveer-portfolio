import Admin from "../models/Admin.js";

import {
  verifyAdminToken,
} from "../services/adminAuthService.js";

// Protect admin-only routes
export default async function requireAdmin(
  request,
  response,
  next
) {
  try {
    // Get Authorization header
    const authorization =
      request.get("authorization") || "";

    // Expected format:
    // Authorization: Bearer <token>
    const [scheme, token] =
      authorization.split(" ");

    // Check Bearer token
    if (scheme !== "Bearer" || !token) {
      return response.status(401).json({
        message: "Authentication required.",
      });
    }

    // Verify JWT token
    const payload = verifyAdminToken(token);

    // Only Super Admin is allowed
    if (payload.role !== "super-admin") {
      return response.status(403).json({
        message: "Super Admin access required.",
      });
    }

    // Check whether admin still exists
    const admin = await Admin.findById(payload.sub);

    if (!admin || (payload.version || 0) !== (admin.sessionVersion || 0)) {
      return response.status(401).json({
        message: "Session is no longer valid.",
      });
    }

    // Attach admin to request
    request.admin = admin;

    // Continue to controller
    return next();
  } catch {
    return response.status(401).json({
      message: "Session is invalid or expired.",
    });
  }
}