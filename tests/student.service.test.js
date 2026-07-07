import test from "node:test";
import assert from "node:assert/strict";
import Student from "../src/models/Student.js";
import { createStudent } from "../src/modules/auth/student/student.service.js";

test("createStudent forwards the authenticated user id and profile fields to the model", async () => {
  const originalFindOne = Student.findOne;
  const originalCreate = Student.create;
  let createdPayload = null;

  Student.findOne = async () => null;
  Student.create = async (payload) => {
    createdPayload = payload;
    return payload;
  };

  try {
    await createStudent("user123", {
      university: "Ibn Zohr University",
      faculty: "Faculty of Sciences",
      major: "Computer Science",
      graduationYear: 2027,
      phone: "0612345678",
      bio: "Backend Developer",
    });

    assert.equal(createdPayload.user, "user123");
    assert.equal(createdPayload.university, "Ibn Zohr University");
    assert.equal(createdPayload.faculty, "Faculty of Sciences");
    assert.equal(createdPayload.major, "Computer Science");
    assert.equal(createdPayload.graduationYear, 2027);
    assert.equal(createdPayload.phone, "0612345678");
    assert.equal(createdPayload.bio, "Backend Developer");
  } finally {
    Student.findOne = originalFindOne;
    Student.create = originalCreate;
  }
});
