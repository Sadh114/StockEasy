require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoute = require("./Routes/AuthRoute");
const apiRoute = require("./Routes/ApiRoute");
const { WatchlistModel } = require("./model/WatchlistModel");
const { PendingOrderModel } = require("./model/PendingOrderModel");
const { checkPendingOrdersForUser } = require("./controllers/TradingController");

const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

mongoose
  .connect(uri)
  .then(async () => {
    console.log("MongoDB connected successfully");
    // Adds the new folderId-aware unique index and drops the old one now
    // that WatchlistSchema supports multiple lists per stock.
    await WatchlistModel.syncIndexes();
  })
  .catch((err) => console.error("MongoDB connection failed", err));

// Periodic sweep for limit/stop-loss orders, so they still trigger even if
// no one is actively browsing the site. Dashboard/market-data requests also
// trigger an opportunistic check for immediate responsiveness while in use.
const PENDING_ORDER_SWEEP_INTERVAL_MS = 30 * 1000;
setInterval(async () => {
  try {
    const userIds = await PendingOrderModel.distinct("userId", { status: "ACTIVE" });
    for (const userId of userIds) {
      await checkPendingOrdersForUser(userId);
    }
  } catch (error) {
    console.error("[PENDING ORDER] Sweep failed", error.message);
  }
}, PENDING_ORDER_SWEEP_INTERVAL_MS);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim());

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
