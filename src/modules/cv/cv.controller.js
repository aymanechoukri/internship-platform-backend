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

export const downloadCV = asyncHandler(async (req, res) => {
  const cv = await cvService.getCVFileById(req.user._id, req.params.cvId);

  res.type("application/pdf");
  res.attachment(cv.fileName);
  res.setHeader("Content-Length", cv.fileSize);
  res.send(cv.fileData);
});

export const deleteCV = asyncHandler(async (req, res) => {
  const result = await cvService.deleteCV(req.user._id, req.params.cvId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});


export const downloadApplicantCV = asyncHandler(async (req, res) => {
  const cv = await cvService.getApplicantCVFile(req.user._id, req.params.cvId);
  res.type("application/pdf");
  res.attachment(cv.fileName);
  res.setHeader("Content-Length", cv.fileSize);
  res.send(cv.fileData);
});
