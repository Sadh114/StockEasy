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
    // null = the default/global watchlist (existing behavior).
    // set = belongs to a user-created custom watchlist folder.
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "watchlistFolder",
      default: null,
      index: true,
    },
    // true = auto-seeded starter symbol (not something the user chose).
    // false = the user explicitly followed/added this stock.
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

WatchlistSchema.index({ userId: 1, symbol: 1, folderId: 1 }, { unique: true });

module.exports = { WatchlistSchema };
