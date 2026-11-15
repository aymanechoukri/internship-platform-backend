import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { extractBearerToken } from "../utils/authHeader.js";
import { getJwtSecret } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

export const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next(new AppError("No token provided", 401));
    }

    const decoded = jwt.verify(token, getJwtSecret());

    if (!decoded || !decoded.id) {
      return next(new AppError("Invalid token payload.", 401));
    }

    const currentUser = await User.findById(decoded.id).select("-password");

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};
