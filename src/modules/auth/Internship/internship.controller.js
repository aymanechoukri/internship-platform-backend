import asyncHandler from "../../../utils/asyncHandler.js";
import * as internshipService from "./internship.service.js";

export const createInternshipById = asyncHandler(async (req, res) => {
  const internship = await internshipService.createInternship(
    req.user._id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Internship Created Successfully",
    data: internship,
  });
});
