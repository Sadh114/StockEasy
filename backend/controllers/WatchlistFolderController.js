const { WatchlistFolderModel } = require("../model/WatchlistFolderModel");
const { WatchlistModel } = require("../model/WatchlistModel");
const { normalizeSymbol } = require("../util/marketData");
const { getMarketSnapshot } = require("../util/liveMarketData");

const createFolder = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "List name is required." });
    }

    const folder = await WatchlistFolderModel.create({ userId: req.user._id, name });
    return res.status(201).json({ success: true, message: "Watchlist created.", data: folder });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You already have a list with this name." });
    }
    console.error("[WATCHLIST FOLDER] Create failed", error);
    return res.status(500).json({ success: false, message: "Unable to create watchlist." });
  }
};

const listFolders = async (req, res) => {
  try {
    const folders = await WatchlistFolderModel.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const counts = await WatchlistModel.aggregate([
      { $match: { userId: req.user._id, folderId: { $ne: null } } },
      { $group: { _id: "$folderId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((row) => [row._id.toString(), row.count]));

    return res.status(200).json({
      success: true,
      data: folders.map((folder) => ({
        id: folder._id,
        name: folder.name,
        stockCount: countMap.get(folder._id.toString()) || 0,
      })),
    });
  } catch (error) {
    console.error("[WATCHLIST FOLDER] Fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch watchlists." });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const folder = await WatchlistFolderModel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ success: false, message: "Watchlist not found." });
    }
    await WatchlistModel.deleteMany({ userId: req.user._id, folderId: folder._id });
    await folder.deleteOne();
    return res.status(200).json({ success: true, message: "Watchlist deleted." });
  } catch (error) {
    console.error("[WATCHLIST FOLDER] Delete failed", error);
    return res.status(500).json({ success: false, message: "Unable to delete watchlist." });
  }
};

const getFolderStocks = async (req, res) => {
  try {
    const folder = await WatchlistFolderModel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ success: false, message: "Watchlist not found." });
    }
    const items = await WatchlistModel.find({ userId: req.user._id, folderId: folder._id }).sort({ createdAt: -1 });
    const stocks = await Promise.all(
      items.map(async (item) => {
        const market = await getMarketSnapshot(item.symbol);
        return {
          id: item._id,
          symbol: item.symbol,
          companyName: item.companyName || market?.companyName || item.symbol,
          livePrice: market?.livePrice || 0,
          changePct: market?.changePct || 0,
        };
      })
    );
    return res.status(200).json({
      success: true,
      data: { folder: { id: folder._id, name: folder.name }, stocks },
    });
  } catch (error) {
    console.error("[WATCHLIST FOLDER] Stocks fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch watchlist stocks." });
  }
};

const addStockToFolder = async (req, res) => {
  try {
    const folder = await WatchlistFolderModel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ success: false, message: "Watchlist not found." });
    }

    const symbol = normalizeSymbol(req.body.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Stock symbol is required." });
    }
    const market = await getMarketSnapshot(symbol);
    if (!market) {
      return res.status(400).json({ success: false, message: "Invalid stock symbol." });
    }

    const doc = await WatchlistModel.findOneAndUpdate(
      { userId: req.user._id, symbol, folderId: folder._id },
      { userId: req.user._id, symbol, companyName: market.companyName, folderId: folder._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, message: "Added to watchlist.", data: doc });
  } catch (error) {
    console.error("[WATCHLIST FOLDER] Add stock failed", error);
    return res.status(500).json({ success: false, message: "Unable to add stock." });
  }
};

const removeStockFromFolder = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);
    await WatchlistModel.deleteOne({ userId: req.user._id, folderId: req.params.id, symbol });
    return res.status(200).json({ success: true, message: "Removed from watchlist." });
  } catch (error) {
    console.error("[WATCHLIST FOLDER] Remove stock failed", error);
    return res.status(500).json({ success: false, message: "Unable to remove stock." });
  }
};

module.exports = {
  createFolder,
  listFolders,
  deleteFolder,
  getFolderStocks,
  addStockToFolder,
  removeStockFromFolder,
};
