const { model } = require("mongoose");
const { TradeSchema } = require("../schemas/TradeSchema");

const TradeModel = model("trade", TradeSchema);

module.exports = { TradeModel };
