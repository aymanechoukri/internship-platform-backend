import jwt from "jsonwebtoken";

const WEAK_SECRETS = new Set([
  "development-secret",
  "secret",
  "default",
  "123456",
  "changeme",
  "jwt_secret",
  "password",
]);

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== "string" || !secret.trim()) {
    throw new Error("JWT_SECRET environment variable is missing or empty.");
  }

  const normalized = secret.trim().toLowerCase();
  if (WEAK_SECRETS.has(normalized)) {
    throw new Error(
      "Insecure JWT_SECRET provided. Do not use default or weak secrets."
    );
  }

  return secret.trim();
};

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: "7d" });
};
