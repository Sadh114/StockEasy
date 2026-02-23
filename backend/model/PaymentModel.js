const { model } = require("mongoose");
const { PaymentSchema } = require("../schemas/PaymentSchema");

const PaymentModel = model("payment", PaymentSchema);

module.exports = { PaymentModel };
