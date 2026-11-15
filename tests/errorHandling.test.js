import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../src/utils/AppError.js";
import errorHandler, {
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  handleJWTError,
  handleJWTExpiredError,
} from "../src/middleware/error.middleware.js";
import app from "../src/app.js";

// Helper to simulate Express res object
const createMockResponse = () => {
  return {
    statusCode: null,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

test("AppError creates operational error with correct properties for 4xx", () => {
  const err = new AppError("Resource not found", 404);

  assert.equal(err instanceof Error, true);
  assert.equal(err instanceof AppError, true);
  assert.equal(err.name, "AppError");
  assert.equal(err.message, "Resource not found");
  assert.equal(err.statusCode, 404);
  assert.equal(typeof err.statusCode, "number");
  assert.equal(err.status, "fail");
  assert.equal(err.isOperational, true);
  assert.ok(err.stack);
});

test("AppError creates operational error with correct properties for 5xx", () => {
  const err = new AppError("Server failure", 500);

  assert.equal(err.statusCode, 500);
  assert.equal(typeof err.statusCode, "number");
  assert.equal(err.status, "error");
  assert.equal(err.isOperational, true);
});

test("AppError converts string status codes to numbers", () => {
  const err = new AppError("Bad request", "400");

  assert.equal(err.statusCode, 400);
  assert.equal(typeof err.statusCode, "number");
  assert.equal(err.status, "fail");
});

test("handleCastErrorDB formats CastError correctly", () => {
  const castErr = {
    name: "CastError",
    path: "_id",
    value: "invalid-id",
  };

  const appErr = handleCastErrorDB(castErr);
  assert.equal(appErr.statusCode, 400);
  assert.equal(appErr.status, "fail");
  assert.equal(appErr.isOperational, true);
  assert.equal(appErr.message, "Invalid _id: invalid-id");
});

test("handleDuplicateFieldsDB formats MongoDB 11000 duplicate key error", () => {
  const dupErr = {
    code: 11000,
    keyValue: { email: "student@example.com" },
  };

  const appErr = handleDuplicateFieldsDB(dupErr);
  assert.equal(appErr.statusCode, 400);
  assert.equal(appErr.status, "fail");
  assert.equal(appErr.isOperational, true);
  assert.match(appErr.message, /student@example\.com/);
});

test("handleValidationErrorDB formats Mongoose ValidationError", () => {
  const valErr = {
    name: "ValidationError",
    errors: {
      email: { message: "Email is required" },
      role: { message: "Invalid role specified" },
    },
  };

  const appErr = handleValidationErrorDB(valErr);
  assert.equal(appErr.statusCode, 400);
  assert.equal(appErr.status, "fail");
  assert.equal(appErr.isOperational, true);
  assert.match(appErr.message, /Email is required/);
  assert.match(appErr.message, /Invalid role specified/);
});

test("handleJWTError returns 401 unauthorized AppError", () => {
  const appErr = handleJWTError();
  assert.equal(appErr.statusCode, 401);
  assert.equal(appErr.status, "fail");
  assert.equal(appErr.isOperational, true);
  assert.equal(appErr.message, "Invalid token. Please log in again!");
});

test("handleJWTExpiredError returns 401 unauthorized AppError", () => {
  const appErr = handleJWTExpiredError();
  assert.equal(appErr.statusCode, 401);
  assert.equal(appErr.status, "fail");
  assert.equal(appErr.isOperational, true);
  assert.equal(appErr.message, "Your token has expired! Please log in again.");
});

test("errorHandler in production sends clean operational errors without leaking stack", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const res = createMockResponse();
    const err = new AppError("Student not found", 404);

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "Student not found");
    assert.equal(res.body.stack, undefined);
    assert.equal(res.body.error, undefined);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("errorHandler in production hides unexpected programming errors and returns 500", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const res = createMockResponse();
    const err = new TypeError("Cannot read property of undefined (secret internal detail)");

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "error");
    assert.equal(res.body.message, "Something went wrong! Please try again later.");
    assert.equal(res.body.stack, undefined);
    assert.equal(res.body.error, undefined);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("errorHandler in development provides full details and stack trace", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  try {
    const res = createMockResponse();
    const err = new AppError("Bad input", 400);

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "Bad input");
    assert.ok(res.body.stack);
    assert.ok(res.body.error);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("errorHandler delegates to next if headersSent is true", () => {
  const res = createMockResponse();
  res.headersSent = true;
  let nextCalledWith = null;

  const err = new AppError("Too late", 500);
  errorHandler(err, {}, res, (passedErr) => {
    nextCalledWith = passedErr;
  });

  assert.equal(nextCalledWith, err);
  assert.equal(res.statusCode, null);
});

test("errorHandler handles Mongoose CastError automatically", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const res = createMockResponse();
    const castErr = new Error("Cast to ObjectId failed");
    castErr.name = "CastError";
    castErr.path = "studentId";
    castErr.value = "abc123xyz";

    errorHandler(castErr, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "Invalid studentId: abc123xyz");
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("errorHandler handles MongoDB duplicate key error automatically", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const res = createMockResponse();
    const dupErr = new Error("E11000 duplicate key error");
    dupErr.code = 11000;
    dupErr.keyValue = { email: "user@test.com" };

    errorHandler(dupErr, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.match(res.body.message, /user@test\.com/);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("errorHandler handles JWT expired token error automatically", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const res = createMockResponse();
    const jwtErr = new Error("jwt expired");
    jwtErr.name = "TokenExpiredError";

    errorHandler(jwtErr, {}, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "Your token has expired! Please log in again.");
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("GET / returns 200 welcome message", async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.message, "Welcome to the Internship Platform API");
  } finally {
    server.close();
  }
});

test("unhandled routes return 404 via global error handler in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/non-existent-route`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.status, "fail");
    assert.equal(data.message, "Can't find /api/non-existent-route on this server!");
    assert.equal(data.stack, undefined);
  } finally {
    server.close();
    process.env.NODE_ENV = originalEnv;
  }
});

