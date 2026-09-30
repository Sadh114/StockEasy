const { model } = require("mongoose");

const { PendingOrderSchema } = require("../schemas/PendingOrderSchema");

const PendingOrderModel = new model("pendingOrder", PendingOrderSchema);

module.exports = { PendingOrderModel };
