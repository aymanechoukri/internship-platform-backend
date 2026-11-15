import dotenv from "dotenv";

dotenv.config();

const { getJwtSecret } = await import("./utils/jwt.js");

try {
  getJwtSecret();
} catch (error) {
  console.error(`❌ Fatal Configuration Error: ${error.message}`);
  process.exit(1);
}

const app = (await import("./app.js")).default;
const connectDB = (await import("./config/db.js")).default;

const PORT = process.env.PORT || 5000;

await connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
