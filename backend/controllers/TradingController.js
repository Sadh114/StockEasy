const mongoose = require("mongoose");
const User = require("../model/UserModel");
const { OrdersModel } = require("../model/OrdersModel");
const { TradeModel } = require("../model/TradeModel");
const { PortfolioModel } = require("../model/PortfolioModel");
const { WatchlistModel } = require("../model/WatchlistModel");
const { PaymentModel } = require("../model/PaymentModel");
const { PendingOrderModel } = require("../model/PendingOrderModel");
const { normalizeSymbol } = require("../util/marketData");
const { getMarketSnapshot, getHistoricalRange, getMarketSymbols } = require("../util/liveMarketData");

const VALID_CHART_RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];
const { calculateCharges } = require("../util/charges");
const { streamContractNote } = require("../util/contractNote");

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

const buildMergedWatchlist = async (watchlistDocs) => {
  const bySymbol = new Map(watchlistDocs.map((item) => [item.symbol, item]));

  const defaultRows = await Promise.all(
    DEFAULT_WATCHLIST_SYMBOLS.map(async (symbol) => {
      const row = bySymbol.get(symbol);
      if (row) {
        return row;
      }
      const market = await getMarketSnapshot(symbol);
      return {
        _id: `default-${symbol}`,
        symbol,
        companyName: market?.companyName || symbol,
      };
    })
  );

  const extras = watchlistDocs.filter((item) => !DEFAULT_WATCHLIST_SYMBOLS.includes(item.symbol));
  return [...defaultRows, ...extras];
};

const serializeHolding = async (holding) => {
  const market = await getMarketSnapshot(holding.symbol);
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
    priceSource: market?.source || "simulated",
  };
};

const ensureDefaultWatchlist = async (userId) => {
  const existing = await WatchlistModel.find({ userId, folderId: null }).select("symbol");
  const existingSymbols = new Set(existing.map((item) => item.symbol));
  const missingSymbols = DEFAULT_WATCHLIST_SYMBOLS.filter((symbol) => !existingSymbols.has(symbol));

  if (!missingSymbols.length) {
    return;
  }

  const defaults = await Promise.all(
    missingSymbols.map(async (symbol) => {
      const market = await getMarketSnapshot(symbol);
      return {
        userId,
        symbol,
        companyName: market?.companyName || symbol,
        folderId: null,
        isDefault: true,
      };
    })
  );

  await WatchlistModel.insertMany(defaults);
};

const getMe = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

const logout = async (_req, res) => {
  res.clearCookie("token", {  httpOnly: true,  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",  secure: process.env.NODE_ENV === "production",});

  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

const getDashboardSummary = async (req, res) => {
  try {
    await ensureDefaultWatchlist(req.user._id);
    await checkPendingOrdersForUser(req.user._id).catch((err) =>
      console.error("[PENDING ORDER] Opportunistic check failed", err.message)
    );

    const [holdings, watchlist, recentTrades] = await Promise.all([
      PortfolioModel.find({ userId: req.user._id }).sort({ updatedAt: -1 }),
      WatchlistModel.find({ userId: req.user._id, folderId: null }).sort({ createdAt: -1 }).limit(20),
      TradeModel.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(5),
    ]);

    const serializedHoldings = await Promise.all(holdings.map(serializeHolding));
    const invested = serializedHoldings.reduce((sum, item) => sum + item.invested, 0);
    const currentValue = serializedHoldings.reduce((sum, item) => sum + item.currentValue, 0);
    const portfolioPnl = currentValue - invested;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysTrades = recentTrades.filter((trade) => new Date(trade.createdAt) >= today);
    const todaysPnl = todaysTrades
      .filter((trade) => trade.type === "SELL")
      .reduce((sum, trade) => sum + trade.total * 0.01, 0);

    const mergedWatchlist = await buildMergedWatchlist(watchlist);

    const watchlistWithMarket = await Promise.all(
      mergedWatchlist.map(async (item) => {
        const market = await getMarketSnapshot(item.symbol);
        return {
          symbol: item.symbol,
          companyName: item.companyName || market?.companyName || item.symbol,
          livePrice: market?.livePrice || 0,
          changePct: market?.changePct || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        availableBalance: Number(req.user.balance.toFixed(2)),
        todayPnl: Number(todaysPnl.toFixed(2)),
        watchlist: watchlistWithMarket,
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
    const watchlist = await WatchlistModel.find({ userId: req.user._id, folderId: null }).sort({ createdAt: -1 });
    const mergedWatchlist = await buildMergedWatchlist(watchlist);
    const data = await Promise.all(
      mergedWatchlist.map(async (item) => {
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
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[WATCHLIST] Fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch watchlist." });
  }
};

// Only stocks the user explicitly followed — no auto-seeded defaults, no
// custom-folder items. Backs the dedicated /watchlists page.
const getFollowedWatchlist = async (req, res) => {
  try {
    const items = await WatchlistModel.find({ userId: req.user._id, folderId: null, isDefault: false }).sort({
      createdAt: -1,
    });
    const data = await Promise.all(
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
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[WATCHLIST] Followed fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch your followed stocks." });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);
    await WatchlistModel.deleteOne({ userId: req.user._id, symbol, folderId: null, isDefault: false });
    return res.status(200).json({ success: true, message: "Removed from watchlist." });
  } catch (error) {
    console.error("[WATCHLIST] Remove failed", error);
    return res.status(500).json({ success: false, message: "Unable to remove stock." });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Stock symbol is required." });
    }

    const market = await getMarketSnapshot(symbol);
    if (!market) {
      return res.status(400).json({ success: false, message: "Invalid stock symbol." });
    }

    const doc = await WatchlistModel.findOneAndUpdate(
      { userId: req.user._id, symbol, folderId: null },
      { userId: req.user._id, symbol, companyName: market.companyName, folderId: null, isDefault: false },
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
    const rows = await Promise.all(holdings.map(serializeHolding));
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
        charges: order.charges,
        netAmount: order.netAmount,
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

/**
 * Core trade execution — always prices at the server's own live market
 * snapshot (never a client-supplied price), applies illustrative brokerage/
 * tax charges, and commits everything (order, holdings, balance, trade log)
 * inside one MongoDB transaction. Shared by the manual "Buy/Sell" flow and
 * the pending limit/stop-loss order engine so both behave identically.
 */
const executeTradeCore = async ({ userId, type, symbol, quantity }) => {
  const market = await getMarketSnapshot(symbol);
  if (!market) {
    return { ok: false, status: 400, message: "Stock symbol is invalid." };
  }

  const price = market.livePrice;
  const total = Number((quantity * price).toFixed(2));
  const charges = calculateCharges(total, type);
  const netAmount = type === "BUY" ? Number((total + charges.totalCharges).toFixed(2)) : Number((total - charges.totalCharges).toFixed(2));

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    const holding = await PortfolioModel.findOne({ userId, symbol }).session(session);

    if (type === "BUY" && user.balance < netAmount) {
      await session.abortTransaction();
      session.endSession();
      return { ok: false, status: 400, message: "Insufficient balance for this trade." };
    }

    if (type === "SELL" && (!holding || holding.quantity < quantity)) {
      await session.abortTransaction();
      session.endSession();
      return { ok: false, status: 400, message: "Insufficient holdings to sell." };
    }

    const [order] = await OrdersModel.create(
      [
        {
          userId,
          symbol,
          companyName: market.companyName,
          type,
          quantity,
          price,
          total,
          charges,
          netAmount,
          status: "PENDING",
        },
      ],
      { session }
    );

    if (type === "BUY") {
      if (holding) {
        const mergedQty = holding.quantity + quantity;
        const mergedCost = holding.averageBuyPrice * holding.quantity + total;
        holding.quantity = mergedQty;
        holding.averageBuyPrice = Number((mergedCost / mergedQty).toFixed(2));
        holding.currentPrice = price;
        await holding.save({ session });
      } else {
        await PortfolioModel.create(
          [
            {
              userId,
              symbol,
              companyName: market.companyName,
              quantity,
              averageBuyPrice: price,
              currentPrice: price,
            },
          ],
          { session }
        );
      }
      user.balance = Number((user.balance - netAmount).toFixed(2));
    } else {
      holding.quantity -= quantity;
      holding.currentPrice = price;
      if (holding.quantity <= 0) {
        await PortfolioModel.deleteOne({ _id: holding._id }, { session });
      } else {
        await holding.save({ session });
      }
      user.balance = Number((user.balance + netAmount).toFixed(2));
    }

    await user.save({ session });
    await TradeModel.create(
      [
        {
          userId,
          symbol,
          companyName: market.companyName,
          type,
          quantity,
          price,
          total,
          charges,
          netAmount,
        },
      ],
      { session }
    );
    order.status = "EXECUTED";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { ok: true, order, balance: user.balance };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("[TRADE] Execution failed", { userId: userId?.toString(), symbol, quantity, type, error: error.message });
    return { ok: false, status: 500, message: "Trade execution failed. Please retry." };
  }
};

const executeTrade = async (req, res) => {
  const type = String(req.body.type || "").toUpperCase();
  const symbol = normalizeSymbol(req.body.symbol);
  const quantity = Number(req.body.quantity);

  if (!["BUY", "SELL"].includes(type)) {
    return res.status(400).json({ success: false, message: "Order type must be BUY or SELL." });
  }
  if (!symbol) {
    return res.status(400).json({ success: false, message: "Stock symbol is required." });
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive whole number." });
  }

  const result = await executeTradeCore({ userId: req.user._id, type, symbol, quantity });
  if (!result.ok) {
    return res.status(result.status).json({ success: false, message: result.message });
  }

  return res.status(200).json({
    success: true,
    message: `${type} order executed successfully.`,
    data: {
      orderId: result.order._id,
      charges: result.order.charges,
      netAmount: result.order.netAmount,
      balance: result.balance,
    },
  });
};

const getMarketData = async (req, res) => {
  const symbol = normalizeSymbol(req.params.symbol || req.query.symbol);
  const snapshot = await getMarketSnapshot(symbol);
  if (!snapshot) {
    return res.status(404).json({ success: false, message: "Stock symbol not found." });
  }

  await checkPendingOrdersForUser(req.user._id).catch((err) =>
    console.error("[PENDING ORDER] Opportunistic check failed", err.message)
  );

  return res.status(200).json({ success: true, data: snapshot });
};

const getMarketSymbolsData = async (_req, res) => {
  return res.status(200).json({ success: true, data: getMarketSymbols() });
};

const getMarketHistory = async (req, res) => {
  const symbol = normalizeSymbol(req.params.symbol);
  const range = String(req.query.range || "1D").toUpperCase();

  if (!symbol) {
    return res.status(400).json({ success: false, message: "Stock symbol is required." });
  }
  if (!VALID_CHART_RANGES.includes(range)) {
    return res.status(400).json({ success: false, message: `Range must be one of: ${VALID_CHART_RANGES.join(", ")}.` });
  }

  const result = await getHistoricalRange(symbol, range);
  if (!result) {
    return res.status(404).json({ success: false, message: "Stock symbol not found." });
  }

  return res.status(200).json({ success: true, data: { symbol, range, ...result } });
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

// ---- Limit / Stop-Loss pending orders ----

const placePendingOrder = async (req, res) => {
  try {
    const type = String(req.body.type || "").toUpperCase();
    const orderCategory = String(req.body.orderCategory || "").toUpperCase();
    const symbol = normalizeSymbol(req.body.symbol);
    const quantity = Number(req.body.quantity);
    const triggerPrice = Number(req.body.triggerPrice);

    if (!["BUY", "SELL"].includes(type)) {
      return res.status(400).json({ success: false, message: "Order type must be BUY or SELL." });
    }
    if (!["LIMIT", "STOP_LOSS"].includes(orderCategory)) {
      return res.status(400).json({ success: false, message: "Order category must be LIMIT or STOP_LOSS." });
    }
    if (orderCategory === "STOP_LOSS" && type !== "SELL") {
      return res.status(400).json({ success: false, message: "Stop-loss orders are only supported for SELL, to protect existing holdings." });
    }
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Stock symbol is required." });
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be a positive whole number." });
    }
    if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) {
      return res.status(400).json({ success: false, message: "Trigger price must be greater than 0." });
    }

    const market = await getMarketSnapshot(symbol);
    if (!market) {
      return res.status(400).json({ success: false, message: "Stock symbol is invalid." });
    }

    if (type === "SELL") {
      const holding = await PortfolioModel.findOne({ userId: req.user._id, symbol });
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ success: false, message: "Insufficient holdings to place this sell order." });
      }
    }

    const pendingOrder = await PendingOrderModel.create({
      userId: req.user._id,
      symbol,
      companyName: market.companyName,
      type,
      orderCategory,
      quantity,
      triggerPrice,
    });

    return res.status(201).json({
      success: true,
      message: `${orderCategory === "LIMIT" ? "Limit" : "Stop-loss"} order placed. It will execute automatically when the trigger condition is met.`,
      data: pendingOrder,
    });
  } catch (error) {
    console.error("[PENDING ORDER] Placement failed", error);
    return res.status(500).json({ success: false, message: "Unable to place order." });
  }
};

const listPendingOrders = async (req, res) => {
  try {
    const orders = await PendingOrderModel.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("[PENDING ORDER] Fetch failed", error);
    return res.status(500).json({ success: false, message: "Unable to fetch pending orders." });
  }
};

const cancelPendingOrder = async (req, res) => {
  try {
    const order = await PendingOrderModel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Only active orders can be cancelled." });
    }
    order.status = "CANCELLED";
    await order.save();
    return res.status(200).json({ success: true, message: "Order cancelled.", data: order });
  } catch (error) {
    console.error("[PENDING ORDER] Cancel failed", error);
    return res.status(500).json({ success: false, message: "Unable to cancel order." });
  }
};

// Checks a single user's active pending orders against the current market
// and executes any that meet their trigger condition. Called both by the
// periodic background sweep and opportunistically on dashboard/market reads
// so orders still resolve promptly on a free-tier host that may sleep.
const checkPendingOrdersForUser = async (userId) => {
  const activeOrders = await PendingOrderModel.find({ userId, status: "ACTIVE" });
  for (const pending of activeOrders) {
    const market = await getMarketSnapshot(pending.symbol);
    if (!market) {
      continue;
    }

    const shouldTrigger =
      (pending.orderCategory === "LIMIT" && pending.type === "BUY" && market.livePrice <= pending.triggerPrice) ||
      (pending.orderCategory === "LIMIT" && pending.type === "SELL" && market.livePrice >= pending.triggerPrice) ||
      (pending.orderCategory === "STOP_LOSS" && market.livePrice <= pending.triggerPrice);

    if (!shouldTrigger) {
      continue;
    }

    const result = await executeTradeCore({
      userId,
      type: pending.type,
      symbol: pending.symbol,
      quantity: pending.quantity,
    });

    if (result.ok) {
      pending.status = "TRIGGERED";
      pending.resultingOrderId = result.order._id;
    } else {
      pending.status = "FAILED";
      pending.failureReason = result.message;
    }
    await pending.save();
  }
};

const downloadContractNote = async (req, res) => {
  try {
    const order = await OrdersModel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.status !== "EXECUTED") {
      return res.status(400).json({ success: false, message: "Contract note is only available for executed orders." });
    }

    streamContractNote(res, { order, user: req.user, charges: order.charges });
  } catch (error) {
    console.error("[CONTRACT NOTE] Generation failed", error);
    return res.status(500).json({ success: false, message: "Unable to generate contract note." });
  }
};

module.exports = {
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
  executeTradeCore,
  getMarketData,
  getMarketHistory,
  getMarketSymbolsData,
  depositFunds,
  getPayments,
  placePendingOrder,
  listPendingOrders,
  cancelPendingOrder,
  checkPendingOrdersForUser,
  downloadContractNote,
};
