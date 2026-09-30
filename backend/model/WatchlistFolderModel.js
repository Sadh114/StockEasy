const { model } = require("mongoose");

const { WatchlistFolderSchema } = require("../schemas/WatchlistFolderSchema");

const WatchlistFolderModel = new model("watchlistFolder", WatchlistFolderSchema);

module.exports = { WatchlistFolderModel };
