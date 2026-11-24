import bcrypt from "bcrypt";
import User from "../../models/User.js";
import { generateToken } from "../../utils/jwt.js";
import AppError from "../../utils/AppError.js";

export const register = async (userData = {}) => {
  const { name, email, password } = userData;
  const requestedRole = userData.role ?? "student";

  if (!["student", "company"].includes(requestedRole)) {
    throw new AppError("Account type must be student or company", 400);
  }
  if (typeof name !== "string" || !name.trim()) {
    throw new AppError("Name is required", 400);
  }
  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("Email is required", 400);
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError("User already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: requestedRole,
  });

  return createdUser;
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("User not found", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.isActive === false) {
    throw new AppError("This account has been disabled. Contact the platform administrator.", 403);
  }

  const token = generateToken(user._id);

  return { user, token };
};
