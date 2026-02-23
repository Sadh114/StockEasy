require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoute = require("./Routes/AuthRoute");
const apiRoute = require("./Routes/ApiRoute");

const app = express();
const port = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection failed", err));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim());

"scripts": {
  "start": "node index.js"
}
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  return res.status(200).json({ success: true, status: "ok" });
});

app.use("/auth", authRoute);
app.use("/api", apiRoute);

app.use((err, _req, res, _next) => {
  console.error("[SERVER] Unhandled error", err);
  return res.status(500).json({ success: false, message: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
