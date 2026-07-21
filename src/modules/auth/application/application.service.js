import AppError from "../../../utils/AppError.js";
import Application from "../../../models/application.js";
import Student from "../../../models/Student.js";
import Internship from "../../../models/Internship.js";

export const creatApplication = async (userId, internshipId) => {
  const student = await Student.findOne({
    user: userId,
  });

  if (!student) {
    throw new AppError("Student Not Found", 404);
  }

  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw new AppError("Internship Not Found", 404);
  }

  const existingApplication = await Application.findOne({
    student: student._id,
    internship: internship._id,
  });

  if (existingApplication) {
    throw new AppError("You have already applied for this internship", 400);
  }

  const application = await Application.create({
    student: student._id,
    internship: internship._id,
  });

  return application;
};

export const getMyApplications = async (userId) => {
  // Find Student
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  // Get Applications
  const applications = await Application.find({
    student: student._id,
  })
    .populate({
      path: "internship",
      populate: {
        path: "company",
        populate: {
          path: "user",
          select: "name email role",
        },
      },
    })
    .sort({ createdAt: -1 });

  return applications;
};

export const getInternshipApplications = async (userId, internshipId) => {
  // Find Company
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Find Internship
  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  // Ownership Check
  if (!internship.company.equals(company._id)) {
    throw new AppError("Forbidden", 403);
  }

  // Get Applications
  const applications = await Application.find({
    internship: internship._id,
  })
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "name email",
      },
    })
    .sort({ createdAt: -1 });

  return applications;
};
