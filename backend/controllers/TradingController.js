const User = require("../model/UserModel");
const { OrdersModel } = require("../model/OrdersModel");
const { TradeModel } = require("../model/TradeModel");
const { PortfolioModel } = require("../model/PortfolioModel");
const { WatchlistModel } = require("../model/WatchlistModel");
const { PaymentModel } = require("../model/PaymentModel");
const { getMarketSnapshot, normalizeSymbol, getMarketSymbols } = require("../util/marketData");

const DEFAULT_WATCHLIST_SYMBOLS = [
  "HDFCBANK",
  "RELIANCE",
  "WIPRO",
  "TCS",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "ITC",
  "KOTAKBANK",
  "LT",
  "BAJFINANCE",
  "MARUTI",
  "AXISBANK",
  "BHARTIARTL",
  "NTPC",
  "POWERGRID",
  "ONGC",
  "COALINDIA",
  "TATAMOTORS",
  "SUNPHARMA",
];

const buildMergedWatchlist = (watchlistDocs) => {
  const bySymbol = new Map(watchlistDocs.map((item) => [item.symbol, item]));

  const defaultRows = DEFAULT_WATCHLIST_SYMBOLS.map((symbol) => {
    const row = bySymbol.get(symbol);
    if (row) {
      return row;
    }
    const market = getMarketSnapshot(symbol);
    return {
      _id: `default-${symbol}`,
      symbol,
      companyName: market?.companyName || symbol,
    };
  });

  const extras = watchlistDocs.filter((item) => !DEFAULT_WATCHLIST_SYMBOLS.includes(item.symbol));
  return [...defaultRows, ...extras];
};

const serializeHolding = (holding) => {
  const market = getMarketSnapshot(holding.symbol);
  const currentPrice = market?.livePrice || holding.currentPrice || holding.averageBuyPrice;
  const invested = holding.averageBuyPrice * holding.quantity;
  const currentValue = currentPrice * holding.quantity;
  const pnl = currentValue - invested;

  return {
    id: holding._id,
    symbol: holding.symbol,
    companyName: holding.companyName || market?.companyName || holding.symbol,
    quantity: holding.quantity,
    averageBuyPrice: Number(holding.averageBuyPrice.toFixed(2)),
    currentPrice: Number(currentPrice.toFixed(2)),
    invested: Number(invested.toFixed(2)),
    currentValue: Number(currentValue.toFixed(2)),
    pnl: Number(pnl.toFixed(2)),
    pnlPct: invested ? Number(((pnl / invested) * 100).toFixed(2)) : 0,
  };
};

const ensureDefaultWatchlist = async (userId) => {
  const existing = await WatchlistModel.find({ userId }).select("symbol");
  const existingSymbols = new Set(existing.map((item) => item.symbol));
  const missingSymbols = DEFAULT_WATCHLIST_SYMBOLS.filter((symbol) => !existingSymbols.has(symbol));

  if (!missingSymbols.length) {
    return;
  }

  const defaults = missingSymbols.map((symbol) => {
    const market = getMarketSnapshot(symbol);
    return {
      userId,
      symbol,
      companyName: market?.companyName || symbol,
    };
  });

  await WatchlistModel.insertMany(defaults);
};

const getMe = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

const logout = async (_req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

const getDashboardSummary = async (req, res) => {
  try {
    await ensureDefaultWatchlist(req.user._id);

    const [holdings, watchlist, recentTrades] = await Promise.all([
      PortfolioModel.find({ userId: req.user._id }).sort({ updatedAt: -1 }),
      WatchlistModel.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20),
      TradeModel.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(5),
    ]);

    const serializedHoldings = holdings.map(serializeHolding);
    const invested = serializedHoldings.reduce((sum, item) => sum + item.invested, 0);
    const currentValue = serializedHoldings.reduce((sum, item) => sum + item.currentValue, 0);
    const portfolioPnl = currentValue - invested;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysTrades = recentTrades.filter((trade) => new Date(trade.createdAt) >= today);
    const todaysPnl = todaysTrades
      .filter((trade) => trade.type === "SELL")
      .reduce((sum, trade) => sum + trade.total * 0.01, 0);

    const mergedWatchlist = buildMergedWatchlist(watchlist);

    return res.status(200).json({
      success: true,
      data: {
        availableBalance: Number(req.user.balance.toFixed(2)),
        todayPnl: Number(todaysPnl.toFixed(2)),
        watchlist: mergedWatchlist.map((item) => {
          const market = getMarketSnapshot(item.symbol);
          return {
            symbol: item.symbol,
            companyName: item.companyName || market?.companyName || item.symbol,
            livePrice: market?.livePrice || 0,
            changePct: market?.changePct || 0,
          };
        }),
        portfolioTotalValue: Number(currentValue.toFixed(2)),
        portfolioPnl: Number(portfolioPnl.toFixed(2)),
        recentTrades: recentTrades.map((trade) => ({
          id: trade._id,
          symbol: trade.symbol,
          companyName: trade.companyName,
          type: trade.type,
          quantity: trade.quantity,
          price: trade.price,
          total: trade.total,
          timestamp: trade.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[DASHBOARD] Summary failed", error);
    return res.status(500).json({ success: false, message: "Unable to load dashboard right now." });
  }
};

const getWatchlist = async (req, res) => {
  try {
    await ensureDefaultWatchlist(req.user._id);
    const watchlist = await WatchlistModel.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const mergedWatchlist = buildMergedWatchlist(watchlist);
    return res.status(200).json({
      success: true,
      data: mergedWatchlist.map((item) => {
        const market = getMarketSnapshot(item.symbol);
        return {
          id: item._id,
          symbol: item.symbol,
          companyName: item.companyName || market?.companyName || item.symbol,
          livePrice: market?.livePrice || 0,
          changePct: market?.changePct || 0,
        };
      }),
    });
  } catch (error) {
    console.error("[WATCHLIST] Fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch watchlist." });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Stock symbol is required." });
    }

    const market = getMarketSnapshot(symbol);
    if (!market) {
      return res.status(400).json({ success: false, message: "Invalid stock symbol." });
    }

    const doc = await WatchlistModel.findOneAndUpdate(
      { userId: req.user._id, symbol },
      { userId: req.user._id, symbol, companyName: market.companyName },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: "Added to watchlist.",
      data: {
        id: doc._id,
        symbol: doc.symbol,
        companyName: doc.companyName,
      },
    });
  } catch (error) {
    console.error("[WATCHLIST] Add failed", error);
    return res.status(500).json({ success: false, message: "Unable to add stock to watchlist." });
  }
};

const getPortfolio = async (req, res) => {
  try {
    const holdings = await PortfolioModel.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    const rows = holdings.map(serializeHolding);
    const summary = {
      totalInvested: Number(rows.reduce((sum, row) => sum + row.invested, 0).toFixed(2)),
      totalCurrentValue: Number(rows.reduce((sum, row) => sum + row.currentValue, 0).toFixed(2)),
    };
    summary.totalPnl = Number((summary.totalCurrentValue - summary.totalInvested).toFixed(2));
    summary.totalPnlPct = summary.totalInvested
      ? Number(((summary.totalPnl / summary.totalInvested) * 100).toFixed(2))
      : 0;

    return res.status(200).json({ success: true, data: { holdings: rows, summary } });
  } catch (error) {
    console.error("[PORTFOLIO] Fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch portfolio." });
  }
};

const getOrders = async (req, res) => {
  try {
    const { symbol, type, date } = req.query;
    const filter = { userId: req.user._id };
    if (symbol) {
      filter.symbol = normalizeSymbol(symbol);
    }
    if (type) {
      filter.type = String(type).toUpperCase();
    }
    if (date) {
      const dt = new Date(date);
      if (!Number.isNaN(dt.getTime())) {
        const start = new Date(dt);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dt);
        end.setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: start, $lte: end };
      }
    }

    const orders = await OrdersModel.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: orders.map((order) => ({
        id: order._id,
        symbol: order.symbol,
        companyName: order.companyName,
        type: order.type,
        quantity: order.quantity,
        price: order.price,
        total: order.total,
        status: order.status,
        reason: order.reason,
        timestamp: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("[ORDERS] Fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch orders." });
  }
};

const executeTrade = async (req, res) => {
  const type = String(req.body.type || "").toUpperCase();
  const symbol = normalizeSymbol(req.body.symbol);
  const quantity = Number(req.body.quantity);
  const price = Number(req.body.price);

  if (!["BUY", "SELL"].includes(type)) {
    return res.status(400).json({ success: false, message: "Order type must be BUY or SELL." });
  }
  if (!symbol) {
    return res.status(400).json({ success: false, message: "Stock symbol is required." });
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive whole number." });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ success: false, message: "Price must be greater than 0." });
  }

  const market = getMarketSnapshot(symbol);
  if (!market) {
    return res.status(400).json({ success: false, message: "Stock symbol is invalid." });
  }

  const total = Number((quantity * price).toFixed(2));

  try {
    const user = await User.findById(req.user._id);
    const holding = await PortfolioModel.findOne({ userId: req.user._id, symbol });

    if (type === "BUY" && user.balance < total) {
      console.error("[TRADE] Insufficient funds", { userId: req.user._id.toString(), symbol, total, balance: user.balance });
      return res.status(400).json({ success: false, message: "Insufficient balance for this trade." });
    }

    if (type === "SELL" && (!holding || holding.quantity < quantity)) {
      console.error("[TRADE] Insufficient holdings", {
        userId: req.user._id.toString(),
        symbol,
        holdingQty: holding?.quantity || 0,
        sellQty: quantity,
      });
      return res.status(400).json({ success: false, message: "Insufficient holdings to sell." });
    }

    const order = await OrdersModel.create({
      userId: req.user._id,
      symbol,
      companyName: market.companyName,
      type,
      quantity,
      price,
      total,
      status: "PENDING",
    });

    if (type === "BUY") {
      if (holding) {
        const mergedQty = holding.quantity + quantity;
        const mergedCost = holding.averageBuyPrice * holding.quantity + total;
        holding.quantity = mergedQty;
        holding.averageBuyPrice = Number((mergedCost / mergedQty).toFixed(2));
        holding.currentPrice = price;
        await holding.save();
      } else {
        await PortfolioModel.create({
          userId: req.user._id,
          symbol,
          companyName: market.companyName,
          quantity,
          averageBuyPrice: price,
          currentPrice: price,
        });
      }
      user.balance = Number((user.balance - total).toFixed(2));
    } else {
      holding.quantity -= quantity;
      holding.currentPrice = price;
      if (holding.quantity <= 0) {
        await PortfolioModel.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
      user.balance = Number((user.balance + total).toFixed(2));
    }

    await user.save();
    await TradeModel.create({
      userId: req.user._id,
      symbol,
      companyName: market.companyName,
      type,
      quantity,
      price,
      total,
    });
    order.status = "EXECUTED";
    await order.save();

    return res.status(200).json({
      success: true,
      message: `${type} order executed successfully.`,
      data: {
        orderId: order._id,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("[TRADE] Execution failed", {
      userId: req.user?._id?.toString(),
      symbol,
      quantity,
      price,
      type,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Trade execution failed. Please retry." });
  }
};

const getMarketData = async (req, res) => {
  const symbol = normalizeSymbol(req.params.symbol || req.query.symbol);
  const snapshot = getMarketSnapshot(symbol);
  if (!snapshot) {
    return res.status(404).json({ success: false, message: "Stock symbol not found." });
  }
  return res.status(200).json({ success: true, data: snapshot });
};

const getMarketSymbolsData = async (_req, res) => {
  return res.status(200).json({ success: true, data: getMarketSymbols() });
};

const depositFunds = async (req, res) => {
  const amount = Number(req.body.amount);
  const method = String(req.body.method || "").toUpperCase();

  if (!["UPI", "NET_BANKING"].includes(method)) {
    return res.status(400).json({ success: false, message: "Payment method must be UPI or NET_BANKING." });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be greater than 0." });
  }

  try {
    const success = Math.random() >= 0.2;
    const transactionRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const payment = await PaymentModel.create({
      userId: req.user._id,
      amount,
      method,
      status: success ? "SUCCESS" : "FAILED",
      transactionRef,
      failureReason: success ? "" : "Dummy gateway declined payment.",
    });

    if (success) {
      const user = await User.findById(req.user._id);
      user.balance = Number((user.balance + amount).toFixed(2));
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Payment successful. Balance updated.",
        data: { balance: user.balance, transaction: payment },
      });
    }

    console.error("[PAYMENT] Dummy gateway failure", {
      userId: req.user._id.toString(),
      amount,
      method,
      transactionRef,
    });
    return res.status(200).json({
      success: false,
      message: "Payment failed in dummy gateway simulation.",
      data: { transaction: payment },
    });
  } catch (error) {
    console.error("[PAYMENT] Processing failed", error);
    return res.status(500).json({ success: false, message: "Unable to process payment at the moment." });
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await PaymentModel.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error("[PAYMENT] History fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch payment history." });
  }
};

module.exports = {
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
};
