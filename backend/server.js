import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminUserRoutes from "./routes/adminUsers.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin", adminAuthRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Admin backend running on port ${process.env.PORT}`)
);
