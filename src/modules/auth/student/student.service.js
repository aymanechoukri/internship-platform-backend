import AppError from "../../../utils/AppError.js";
import Student from "../../../models/Student.js";

export const createStudent = async (userId, studentData = {}) => {
  const existingStudent = await Student.findOne({
    user: userId,
  });

  if (existingStudent) {
    throw new AppError("Student already exists", 400);
  }

  return await Student.create({
    user: userId,
    ...studentData,
  });
};

export const getStudentByUserId = async (userId) => {
  const student = await Student.findOne({ user: userId })
  .populate("user", "name email role");

  if (!student) {
    throw new AppError("Student not found", 404)
  }

  return student;
};
