import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { extractBearerToken } from "../utils/authHeader.js";
import { getJwtSecret } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    console.log("VERIFY SECRET:", process.env.JWT_SECRET);

    const decoded = jwt.verify(token, getJwtSecret());

    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    console.error("JWT Error:", error);

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};
