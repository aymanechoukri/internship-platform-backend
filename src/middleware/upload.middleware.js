import multer from "multer";

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    cb(new Error("Only PDF files are allowed"), false);
    return;
  }

  cb(null, true);
};

// Vercel Functions have a read-only deployment filesystem. Keep the upload in
// memory and persist its contents in MongoDB instead of writing to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

export const uploadSingleCV = upload.single("cv");
