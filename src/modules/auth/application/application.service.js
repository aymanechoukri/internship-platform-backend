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
