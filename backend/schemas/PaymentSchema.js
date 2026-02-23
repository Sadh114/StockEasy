const { Schema } = require("mongoose");

const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      enum: ["UPI", "NET_BANKING"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
    failureReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = { PaymentSchema };
