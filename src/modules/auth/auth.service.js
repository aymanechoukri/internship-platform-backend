import bcrypt from "bcrypt";
import User from "../../models/User.js";
import { generateToken } from "../../utils/jwt.js";

export const register = async (userData) => {
  const { name, email, password, role } = userData;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return createdUser;
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const token = generateToken(user._id);

  return { user, token };
};
