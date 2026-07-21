import asyncHandler from "../../utils/asyncHandler.js";
import * as cvService from "./cv.service.js";

export const uploadCV = asyncHandler(async (req, res) => {
  const cv = await cvService.uploadCV(req.user._id, req.file);

  res.status(201).json({
    success: true,
    message: "CV uploaded successfully",
    data: cv,
  });
});

export const getMyCVs = asyncHandler(async (req, res) => {
  const cvs = await cvService.getMyCVs(req.user._id);

  res.status(200).json({
    success: true,
    count: cvs.length,
    data: cvs,
  });
});

export const getCVById = asyncHandler(async (req, res) => {
  const cv = await cvService.getCVById(req.user._id, req.params.cvId);

  res.status(200).json({
    success: true,
    data: cv,
  });
});

export const deleteCV = asyncHandler(async (req, res) => {
  const result = await cvService.deleteCV(req.user._id, req.params.cvId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
