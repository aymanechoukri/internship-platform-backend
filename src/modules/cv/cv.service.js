import AppError from "../../utils/AppError.js";
import CV from "../../models/CV.js";
import Student from "../../models/Student.js";
import mongoose from "mongoose";
import Company from "../../models/Companies.js";
import Internship from "../../models/Internship.js";
import Application from "../../models/application.js";

const getStudentForUser = async (userId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
};

const getOwnedCV = async (studentId, cvId, includeFile = false) => {
  let query = CV.findById(cvId);

  if (includeFile) {
    query = query.select("+fileData");
  }

  const cv = await query;

  if (!cv) {
    throw new AppError("CV not found", 404);
  }

  if (cv.student.toString() !== studentId.toString()) {
    throw new AppError("Forbidden", 403);
  }

  return cv;
};

export const uploadCV = async (userId, file) => {
  const student = await getStudentForUser(userId);

  if (!file || !file.buffer) {
    throw new AppError("CV file is required", 400);
  }

  // Do not trust the browser-provided MIME type alone.
  if (
    file.mimetype !== "application/pdf" ||
    file.buffer.subarray(0, 5).toString() !== "%PDF-"
  ) {
    throw new AppError("The uploaded file must be a valid PDF", 400);
  }

  return CV.create({
    student: student._id,
    fileName: file.originalname,
    fileData: file.buffer,
    filePath: null,
    mimeType: "application/pdf",
    fileSize: file.size,
  });
};

export const getMyCVs = async (userId) => {
  const student = await getStudentForUser(userId);
  return CV.find({ student: student._id }).sort({ createdAt: -1 });
};

export const getCVById = async (userId, cvId) => {
  const student = await getStudentForUser(userId);
  return getOwnedCV(student._id, cvId);
};

export const getCVFileById = async (userId, cvId) => {
  const student = await getStudentForUser(userId);
  const cv = await getOwnedCV(student._id, cvId, true);

  if (!cv.fileData) {
    throw new AppError(
      "This CV was uploaded before cloud storage was enabled and is not available on this server.",
      410,
    );
  }

  return cv;
};

export const deleteCV = async (userId, cvId) => {
  const student = await getStudentForUser(userId);
  const cv = await getOwnedCV(student._id, cvId);

  await cv.deleteOne();

  return { message: "CV deleted successfully" };
};


export const getApplicantCVFile = async (userId, cvId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  if (!mongoose.isValidObjectId(cvId)) throw new AppError("CV not found", 404);

  const cv = await CV.findById(cvId).select("+fileData");
  if (!cv) throw new AppError("CV not found", 404);

  const internshipIds = await Internship.find({ company: company._id }).distinct("_id");
  const application = await Application.findOne({
    student: cv.student,
    internship: { $in: internshipIds },
  }).select("_id");

  if (!application) throw new AppError("You can only access CVs of candidates who applied to your internships", 403);
  if (!cv.fileData) throw new AppError("This CV file is not available on the server", 410);
  return cv;
};
