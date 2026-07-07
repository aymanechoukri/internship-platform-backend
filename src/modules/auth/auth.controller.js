import * as authService from "./auth.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "user logged in successfully",
    data,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: req.user,
  });
});
