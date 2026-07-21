export const validateCreateNotification = (req, res, next) => {
  const { userId, title, content } = req.body || {};

  if (!userId || !title?.trim() || !content?.trim()) {
    return res.status(400).json({
      success: false,
      message: "userId, title, and content are required",
    });
  }

  next();
};
