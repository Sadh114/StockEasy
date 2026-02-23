const { model } = require("mongoose");
const { PortfolioSchema } = require("../schemas/PortfolioSchema");

const PortfolioModel = model("portfolio", PortfolioSchema);

module.exports = { PortfolioModel };
