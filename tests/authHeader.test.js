import test from "node:test";
import assert from "node:assert/strict";
import { extractBearerToken } from "../src/utils/authHeader.js";

test("extracts token from a standard bearer header", () => {
  assert.equal(extractBearerToken("Bearer eyJhbGciOiJIUzI1NiJ9"), "eyJhbGciOiJIUzI1NiJ9");
});

test("extracts token when the token is wrapped in quotes", () => {
  assert.equal(
    extractBearerToken('Bearer  "eyJhbGciOiJIUzI1NiJ9"'),
    "eyJhbGciOiJIUzI1NiJ9"
  );
});

test("returns null when no bearer token is present", () => {
  assert.equal(extractBearerToken("Basic abc123"), null);
  assert.equal(extractBearerToken(""), null);
});
