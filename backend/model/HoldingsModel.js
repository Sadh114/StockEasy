const {model}= require('mongoose');

const { HoldingsSchema } = require("../schemas/HoldingSchema");

const HoldingsModel = new model("Holdings", HoldingsSchema);

module.exports = { HoldingsModel };