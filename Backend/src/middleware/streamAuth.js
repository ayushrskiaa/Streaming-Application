import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Auth middleware that supports both header and query token
 * Useful for streaming endpoints where query params are easier than headers
 */
export const streamAuthMiddleware = async (req, res, next) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const authHeader = req.headers.authorization;
    let token = null;

    // Try to get token from Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } 
    // Then try query parameter (for direct video links)
    else if (req.query.token) {
      token = req.query.token;
    } 
    // Finally try cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user info to request
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };
    
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
