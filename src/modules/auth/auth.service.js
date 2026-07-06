import bcrypt from "bcrypt";
import User from "../../models/User.js";

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

