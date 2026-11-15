import AppError from "../utils/AppError.js";

export const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path || "field"}: ${err.value !== undefined ? err.value : ""}`.trim();
  return new AppError(message, 400);
};

export const handleDuplicateFieldsDB = (err) => {
  let message = "Duplicate field value entered. Please use another value!";

  if (err.keyValue && typeof err.keyValue === "object") {
    const entries = Object.entries(err.keyValue);
    if (entries.length > 0) {
      const formatted = entries.map(([key, val]) => `${key}: ${val}`).join(", ");
      message = `Duplicate field value: ${formatted}. Please use another value!`;
    }
  } else if (err.message) {
    const match = err.message.match(/(["'])(\\?.)*?\1/);
    if (match) {
      message = `Duplicate field value: ${match[0]}. Please use another value!`;
    }
  }

  return new AppError(message, 400);
};

export const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {})
    .map((el) => el.message || el)
    .filter(Boolean);

  const message = errors.length > 0
    ? `Invalid input data. ${errors.join(". ")}`
    : "Invalid input data";

  return new AppError(message, 400);
};

export const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

export const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

export const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

export const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    // 1) Log unexpected error for debugging
    console.error("ERROR 💥:", err);

    // 2) Send generic message without leaking internal details
    res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong! Please try again later.",
    });
  }
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;

  if (!error || typeof error !== "object") {
    error = new AppError(String(error || "Internal Server Error"), 500);
  }

  error.statusCode = Number(error.statusCode) || 500;
  error.status = error.status || (`${error.statusCode}`.startsWith("4") ? "fail" : "error");

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (err.stack && error !== err) {
    error.stack = err.stack;
  }

  if (process.env.NODE_ENV === "production") {
    sendErrorProd(error, req, res);
  } else {
    sendErrorDev(error, req, res);
  }
};

export default errorHandler;
