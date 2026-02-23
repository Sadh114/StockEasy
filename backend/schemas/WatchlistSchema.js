const { Schema } = require("mongoose");

const WatchlistSchema = new Schema(
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
  },
  { timestamps: true }
);

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = { WatchlistSchema };
