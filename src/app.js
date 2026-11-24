import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import AppError from "./utils/AppError.js";
import errorHandler from "./middleware/error.middleware.js";
import connectDB from "./config/db.js";
import { getJwtSecret } from "./utils/jwt.js";
import authRoutes from "./modules/auth/auth.routes.js";
import studentRoutes from "./modules/auth/student/student.routes.js";
import companyRoute from "./modules/auth/companies/companies.routes.js";
import internshipRoute from "./modules/auth/Internship/internship.routes.js";
import applicationRoute from "./modules/auth/application/application.routes.js";
import messageRoute from "./modules/auth/message/message.routes.js";
import notificationRoute from "./modules/notification/notification.routes.js";
import cvRoute from "./modules/cv/cv.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(async (req, res, next) => {
  try {
    getJwtSecret();
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to the Internship Platform API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoute);
app.use("/api/internship", internshipRoute);
app.use("/api/applications", applicationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/cvs", cvRoute);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);
export default app;
