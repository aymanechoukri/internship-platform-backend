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
  const student = await Student.findOne({ user: userId }).populate(
    "user",
    "name email role",
  );

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
};

export const updateStudentByUserId = async (userId, updateData) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  student.university = updateData.university ?? student.university;
  student.faculty = updateData.faculty ?? student.faculty;
  student.major = updateData.major ?? student.major;
  student.graduationYear = updateData.graduationYear ?? student.graduationYear;
  student.phone = updateData.phone ?? student.phone;
  student.bio = updateData.bio ?? student.bio;

  await student.save();
  return student.populate("user", "name email role");
};

export const deleteStudentByUserId = async (userId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  await student.deleteOne();
};
