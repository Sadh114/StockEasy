const { Schema } = require("mongoose");

const WatchlistFolderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
  },
  { timestamps: true }
);

WatchlistFolderSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = { WatchlistFolderSchema };
