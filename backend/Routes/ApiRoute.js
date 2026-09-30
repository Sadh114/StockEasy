const router = require("express").Router();
const { authRequired } = require("../middleware/AuthMiddleware");
const {
  getMe,
  logout,
  getDashboardSummary,
  getWatchlist,
  getFollowedWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getPortfolio,
  getOrders,
  executeTrade,
  getMarketData,
  getMarketHistory,
  getMarketSymbolsData,
  depositFunds,
  getPayments,
  placePendingOrder,
  listPendingOrders,
  cancelPendingOrder,
  downloadContractNote,
} = require("../controllers/TradingController");
const {
  getSentiment,
  getRecommendation,
  getFundamentals,
} = require("../controllers/AIController");
const {
  createFolder,
  listFolders,
  deleteFolder,
  getFolderStocks,
  addStockToFolder,
  removeStockFromFolder,
} = require("../controllers/WatchlistFolderController");

router.get("/market/:symbol/history", authRequired, getMarketHistory);
router.get("/market/:symbol", authRequired, getMarketData);
router.get("/market", authRequired, getMarketSymbolsData);
router.get("/me", authRequired, getMe);
router.post("/logout", authRequired, logout);
router.get("/dashboard/summary", authRequired, getDashboardSummary);
router.get("/watchlist", authRequired, getWatchlist);
router.post("/watchlist", authRequired, addToWatchlist);
router.get("/watchlist/followed", authRequired, getFollowedWatchlist);
router.delete("/watchlist/:symbol", authRequired, removeFromWatchlist);
router.get("/portfolio", authRequired, getPortfolio);
router.get("/orders", authRequired, getOrders);
router.post("/trades/execute", authRequired, executeTrade);
router.post("/payments/deposit", authRequired, depositFunds);
router.get("/payments/history", authRequired, getPayments);

// Limit / stop-loss pending orders
router.post("/orders/pending", authRequired, placePendingOrder);
router.get("/orders/pending", authRequired, listPendingOrders);
router.delete("/orders/pending/:id", authRequired, cancelPendingOrder);

// PDF contract note
router.get("/orders/:id/contract-note", authRequired, downloadContractNote);

// Multiple watchlists
router.post("/watchlist/folders", authRequired, createFolder);
router.get("/watchlist/folders", authRequired, listFolders);
router.delete("/watchlist/folders/:id", authRequired, deleteFolder);
router.get("/watchlist/folders/:id", authRequired, getFolderStocks);
router.post("/watchlist/folders/:id/stocks", authRequired, addStockToFolder);
router.delete("/watchlist/folders/:id/stocks/:symbol", authRequired, removeStockFromFolder);

// AI routes
router.get("/ai/sentiment/:stockSymbol", authRequired, getSentiment);
router.get("/ai/recommendation/:stockSymbol", authRequired, getRecommendation);
router.get("/ai/fundamentals/:stockSymbol", authRequired, getFundamentals);

module.exports = router;
