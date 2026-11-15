import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import { protect } from "../src/middleware/auth.middleware.js";
import { getJwtSecret, generateToken } from "../src/utils/jwt.js";
import AppError from "../src/utils/AppError.js";
import errorHandler from "../src/middleware/error.middleware.js";

const TEST_SECRET = "super-secret-jwt-key-for-testing-only-123456";

const createMockResponse = () => {
  return {
    statusCode: null,
    body: null,
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

test("getJwtSecret fails safely when JWT_SECRET is missing or empty", () => {
  const originalSecret = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /JWT_SECRET environment variable is missing or empty/i);

    process.env.JWT_SECRET = "   ";
    assert.throws(() => getJwtSecret(), /JWT_SECRET environment variable is missing or empty/i);
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});

test("getJwtSecret rejects weak default secrets", () => {
  const originalSecret = process.env.JWT_SECRET;
  try {
    process.env.JWT_SECRET = "development-secret";
    assert.throws(() => getJwtSecret(), /Insecure JWT_SECRET/i);

    process.env.JWT_SECRET = "secret";
    assert.throws(() => getJwtSecret(), /Insecure JWT_SECRET/i);

    process.env.JWT_SECRET = "123456";
    assert.throws(() => getJwtSecret(), /Insecure JWT_SECRET/i);
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});

test("protect returns 401 via AppError and next when no token is provided", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const req = { headers: {} };
    const res = createMockResponse();
    let nextCalledError = null;

    await protect(req, res, (err) => {
      nextCalledError = err;
    });

    assert.ok(nextCalledError instanceof AppError);
    assert.equal(nextCalledError.statusCode, 401);
    assert.equal(nextCalledError.status, "fail");
    assert.equal(nextCalledError.message, "No token provided");

    // Pass to errorHandler
    errorHandler(nextCalledError, req, res, () => {});
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "No token provided");
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});

test("protect passes invalid JWT token error to next and global error handler handles it", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const req = {
      headers: { authorization: "Bearer invalid.malformed.jwt.token" },
    };
    const res = createMockResponse();
    let nextCalledError = null;

    await protect(req, res, (err) => {
      nextCalledError = err;
    });

    assert.ok(nextCalledError);
    assert.equal(nextCalledError.name, "JsonWebTokenError");

    // Pass error through the global errorHandler
    errorHandler(nextCalledError, req, res, () => {});
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "Invalid token. Please log in again!");
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});

test("protect passes expired JWT token error to next and global error handler handles it", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const expiredToken = jwt.sign({ id: "user-123" }, TEST_SECRET, {
      expiresIn: "-1s",
    });

    const req = {
      headers: { authorization: `Bearer ${expiredToken}` },
    };
    const res = createMockResponse();
    let nextCalledError = null;

    await protect(req, res, (err) => {
      nextCalledError = err;
    });

    assert.ok(nextCalledError);
    assert.equal(nextCalledError.name, "TokenExpiredError");

    // Pass error through the global errorHandler
    errorHandler(nextCalledError, req, res, () => {});
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(res.body.message, "Your token has expired! Please log in again.");
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});

test("protect returns 401 when verified token user no longer exists in database", async () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalFindById = User.findById;
  process.env.JWT_SECRET = TEST_SECRET;

  // Mock User.findById returning null
  User.findById = () => ({
    select: async () => null,
  });

  try {
    const token = generateToken("deleted-user-id");
    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = createMockResponse();
    let nextCalledError = null;

    await protect(req, res, (err) => {
      nextCalledError = err;
    });

    assert.ok(nextCalledError instanceof AppError);
    assert.equal(nextCalledError.statusCode, 401);
    assert.equal(nextCalledError.status, "fail");
    assert.equal(
      nextCalledError.message,
      "The user belonging to this token no longer exists."
    );

    // Pass to global error handler
    errorHandler(nextCalledError, req, res, () => {});
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.status, "fail");
    assert.equal(
      res.body.message,
      "The user belonging to this token no longer exists."
    );
  } finally {
    User.findById = originalFindById;
    process.env.JWT_SECRET = originalSecret;
  }
});

test("protect attaches user and calls next() without error for valid token and existing user", async () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalFindById = User.findById;
  process.env.JWT_SECRET = TEST_SECRET;

  const mockUser = {
    _id: "user-456",
    name: "John Doe",
    email: "john@example.com",
    role: "student",
  };

  User.findById = (id) => {
    assert.equal(id, "user-456");
    return {
      select: async (fields) => {
        assert.equal(fields, "-password");
        return mockUser;
      },
    };
  };

  try {
    const token = generateToken("user-456");
    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = createMockResponse();
    let nextCalled = false;
    let nextError = null;

    await protect(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    assert.equal(nextCalled, true);
    assert.equal(nextError, undefined);
    assert.deepEqual(req.user, mockUser);
  } finally {
    User.findById = originalFindById;
    process.env.JWT_SECRET = originalSecret;
  }
});
