import test from "node:test";
import assert from "node:assert/strict";
import { validateCreateNotification } from "../src/modules/notification/notification.validation.js";

test("validateCreateNotification rejects missing title or content", () => {
  let statusCode = null;
  let responseBody = null;

  const req = {
    body: {
      userId: "user-123",
      title: "",
      content: "",
    },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
  };

  const next = () => {
    throw new Error("next should not be called for invalid payload");
  };

  validateCreateNotification(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.match(responseBody.message, /title|content/i);
});

test("validateCreateNotification passes valid payload to next", () => {
  let calledNext = false;

  const req = {
    body: {
      userId: "user-123",
      title: "Application update",
      content: "Your application was reviewed.",
    },
  };

  const res = {
    status() {
      throw new Error("res.status should not be called for valid payload");
    },
    json() {
      throw new Error("res.json should not be called for valid payload");
    },
  };

  validateCreateNotification(req, res, () => {
    calledNext = true;
  });

  assert.equal(calledNext, true);
});
