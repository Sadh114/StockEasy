const { Schema } = require("mongoose");

const PendingOrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    orderCategory: {
      type: String,
      enum: ["LIMIT", "STOP_LOSS"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    triggerPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRIGGERED", "CANCELLED", "FAILED"],
      default: "ACTIVE",
    },
    resultingOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = { PendingOrderSchema };
