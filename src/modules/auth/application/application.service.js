import AppError from "../../../utils/AppError.js";
import Application from "../../../models/application.js";
import Student from "../../../models/Student.js";
import Internship from "../../../models/Internship.js";
import Company from "../../../models/Companies.js";
import Notification from "../../../models/Notification.js";
import CV from "../../../models/CV.js";

export const creatApplication = async (userId, internshipId) => {
  const student = await Student.findOne({
    user: userId,
  });

  if (!student) {
    throw new AppError("Student Not Found", 404);
  }

  const internship = await Internship.findById(internshipId).populate("company");

  if (!internship || !internship.isActive || internship.moderationStatus !== "approved" || internship.company?.verificationStatus !== "approved") {
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

export const getCompanyApplications = async (userId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  const internships = await Internship.find({ company: company._id }).select("_id");
  const internshipIds = internships.map((item) => item._id);
  const applications = await Application.find({ internship: { $in: internshipIds } })
    .populate({ path: "student", populate: { path: "user", select: "name email" } })
    .populate("internship", "title location type")
    .sort({ createdAt: -1 });
  const studentIds = [...new Set(applications.map((item) => String(item.student?._id)).filter(Boolean))];
  const cvs = await CV.find({ student: { $in: studentIds } }).select("fileName fileSize createdAt student").sort({ createdAt: -1 });
  const cvMap = new Map();
  for (const cv of cvs) {
    const key = String(cv.student);
    if (!cvMap.has(key)) cvMap.set(key, []);
    cvMap.get(key).push({ _id: cv._id, fileName: cv.fileName, fileSize: cv.fileSize, createdAt: cv.createdAt });
  }
  return applications.map((application) => ({
    ...application.toObject(),
    cvs: cvMap.get(String(application.student?._id)) || [],
  }));
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

export const updateApplicationStatus = async (
  userId,
  applicationId,
  status
) => {
  // Check status
  if (!["Accepted", "Rejected"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  // Find Company
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Find Application
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  // Find Internship
  const internship = await Internship.findById(application.internship);

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  // Ownership Check
  if (!internship.company.equals(company._id)) {
    throw new AppError("Forbidden", 403);
  }

  if (application.status !== "Pending") {
    throw new AppError("This application has already been reviewed", 409);
  }

  // Update Status
  application.status = status;

  await application.save();
  const student = await Student.findById(application.student).select("user");
  if (student?.user) {
    await Notification.create({
      user: student.user,
      title: `Application ${status.toLowerCase()}`,
      content: `Your application for ${internship.title} was ${status.toLowerCase()} by the company.`,
    });
  }

  return application;
};

export const withdrawApplication = async (userId, applicationId) => {
  // Find Student
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  // Find Application
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  // Ownership Check
  if (!application.student.equals(student._id)) {
    throw new AppError("Forbidden", 403);
  }

  // Delete Application
  await application.deleteOne();

  return;
};