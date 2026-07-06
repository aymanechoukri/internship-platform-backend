import dotenv from "dotenv";

dotenv.config();

const app = (await import("./app.js")).default;
const connectDB = (await import("./config/db.js")).default;

const PORT = process.env.PORT || 5000;

await connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
