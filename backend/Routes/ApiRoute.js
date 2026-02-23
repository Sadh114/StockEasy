const router = require("express").Router();
const { authRequired } = require("../middleware/AuthMiddleware");
const {
  getMe,
  logout,
  getDashboardSummary,
  getWatchlist,
  addToWatchlist,
  getPortfolio,
  getOrders,
  executeTrade,
  getMarketData,
  getMarketSymbolsData,
  depositFunds,
  getPayments,
} = require("../controllers/TradingController");
const {
  getSentiment,
  getRecommendation,
  getFundamentals,
} = require("../controllers/AIController");

router.get("/market/:symbol", authRequired, getMarketData);
router.get("/market", authRequired, getMarketSymbolsData);
router.get("/me", authRequired, getMe);
router.post("/logout", authRequired, logout);
router.get("/dashboard/summary", authRequired, getDashboardSummary);
router.get("/watchlist", authRequired, getWatchlist);
router.post("/watchlist", authRequired, addToWatchlist);
router.get("/portfolio", authRequired, getPortfolio);
router.get("/orders", authRequired, getOrders);
router.post("/trades/execute", authRequired, executeTrade);
router.post("/payments/deposit", authRequired, depositFunds);
router.get("/payments/history", authRequired, getPayments);

// AI routes
router.get("/ai/sentiment/:stockSymbol", authRequired, getSentiment);
router.get("/ai/recommendation/:stockSymbol", authRequired, getRecommendation);
router.get("/ai/fundamentals/:stockSymbol", authRequired, getFundamentals);

module.exports = router;
