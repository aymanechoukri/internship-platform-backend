import jwt from "jsonwebtoken";

export const getJwtSecret = () => process.env.JWT_SECRET || "development-secret";

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: "7d" });
};