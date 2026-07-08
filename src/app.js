import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import studentRoutes from "./modules/auth/student/student.routes.js";
import companyRoute from "./modules/auth/companies/companies.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use(errorHandler);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Internship Platform API",
  });
});

export default app;
