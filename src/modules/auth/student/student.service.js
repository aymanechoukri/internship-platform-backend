import AppError from "../../../utils/AppError.js";
import Student from "../../../models/Student.js";
import Application from "../../../models/application.js";
import CV from "../../../models/CV.js";

const PROFILE_FIELDS = ["university", "major", "faculty", "graduationYear", "phone", "bio"];

const sanitizeStudent = (data = {}) => {
  const safe = {};
  for (const field of PROFILE_FIELDS) {
    if (data[field] !== undefined) safe[field] = data[field];
  }

  for (const field of ["university", "major", "faculty", "phone", "bio"]) {
    if (safe[field] !== undefined) {
      if (typeof safe[field] !== "string") throw new AppError(`${field} must be a string`, 400);
      safe[field] = safe[field].trim();
    }
  }

  if (safe.university !== undefined && !safe.university) throw new AppError("University is required", 400);
  if (safe.major !== undefined && !safe.major) throw new AppError("Major is required", 400);
  if (safe.faculty !== undefined && !safe.faculty) throw new AppError("Faculty is required", 400);
  if (safe.phone !== undefined && !safe.phone) throw new AppError("Phone number is required", 400);
  if (safe.bio !== undefined && safe.bio.length > 1000) throw new AppError("Bio cannot exceed 1000 characters", 400);

  if (safe.graduationYear !== undefined) {
    safe.graduationYear = Number(safe.graduationYear);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(safe.graduationYear) || safe.graduationYear < currentYear - 20 || safe.graduationYear > currentYear + 10) {
      throw new AppError("Please provide a valid graduation year", 400);
    }
  }

  return safe;
};

export const createStudent = async (userId, studentData = {}) => {
  const existingStudent = await Student.findOne({ user: userId });
  if (existingStudent) throw new AppError("Student profile already exists", 409);

  const safeData = sanitizeStudent(studentData);
  for (const field of ["university", "major", "faculty", "graduationYear", "phone"]) {
    if (safeData[field] === undefined || safeData[field] === "") {
      throw new AppError(`${field} is required`, 400);
    }
  }

  return Student.create({ ...safeData, user: userId });
};

export const getStudentByUserId = async (userId) => {
  const student = await Student.findOne({ user: userId }).populate("user", "name email role");
  if (!student) throw new AppError("Student profile not found", 404);
  return student;
};

export const updateStudentByUserId = async (userId, updateData = {}) => {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError("Student profile not found", 404);

  const safeData = sanitizeStudent(updateData);
  if (!Object.keys(safeData).length) throw new AppError("No valid profile fields were provided", 400);

  for (const [key, value] of Object.entries(safeData)) student[key] = value;
  await student.save();
  return student.populate("user", "name email role");
};

export const deleteStudentByUserId = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError("Student profile not found", 404);

  const [applicationCount, cvCount] = await Promise.all([
    Application.countDocuments({ student: student._id }),
    CV.countDocuments({ student: student._id }),
  ]);
  if (applicationCount || cvCount) {
    throw new AppError("This profile has application or CV history and cannot be deleted. Contact an administrator for account closure.", 409);
  }

  await student.deleteOne();
  return { id: student._id, deleted: true };
};
