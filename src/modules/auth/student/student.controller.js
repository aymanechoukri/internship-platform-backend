import asyncHandler from "../../../utils/asyncHandler.js";
import * as studentService from "./student.service.js";

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Student created Successfully",
    data: student,
  });
});

export const getStudentByUserId = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);

  res.status(200).json({
    success: true,
    message: "Student retrieved successfully",
    data: student,
  });
});

export const updateStudentByUserId = asyncHandler(async (req, res) => {
  const updatedStudent = await studentService.updateStudentByUserId(
    req.user._id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: updatedStudent,
  });
});

export const deleteStudentByUserId = asyncHandler(async (req, res) => {
  const deletedStudent = await studentService.deleteStudentByUserId(
    req.user._id,
  );

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
    data: deletedStudent,
  });
});
