import fs from "fs";
import path from "path";
import AppError from "../../utils/AppError.js";
import CV from "../../models/CV.js";
import Student from "../../models/Student.js";

export const uploadCV = async (userId, file) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (!file) {
    throw new AppError("CV file is required", 400);
  }

  const cv = await CV.create({
    student: student._id,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
  });

  return cv;
};

export const getMyCVs = async (userId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return CV.find({ student: student._id }).sort({ createdAt: -1 });
};

export const getCVById = async (userId, cvId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const cv = await CV.findById(cvId);

  if (!cv) {
    throw new AppError("CV not found", 404);
  }

  if (cv.student.toString() !== student._id.toString()) {
    throw new AppError("Forbidden", 403);
  }

  return cv;
};

export const deleteCV = async (userId, cvId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const cv = await CV.findById(cvId);

  if (!cv) {
    throw new AppError("CV not found", 404);
  }

  if (cv.student.toString() !== student._id.toString()) {
    throw new AppError("Forbidden", 403);
  }

  if (cv.filePath && fs.existsSync(cv.filePath)) {
    fs.unlinkSync(cv.filePath);
  }

  await cv.deleteOne();

  return { message: "CV deleted successfully" };
};
