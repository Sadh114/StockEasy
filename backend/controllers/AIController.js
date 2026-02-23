const { getMarketSentiment } = require('../ai/sentimentService');
const { getStockRecommendation } = require('../ai/recommendationService');
const { getFundamentalAnalysis } = require('../ai/fundamentalsService');

/**
 * Controller for Market Sentiment Analysis
 */
const getSentiment = async (req, res) => {
  try {
    const { stockSymbol } = req.params;

    if (!stockSymbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required' });
    }

    const result = await getMarketSentiment(stockSymbol.toUpperCase());
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getSentiment:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze sentiment' });
  }
};

/**
 * Controller for AI Stock Recommendations
 */
const getRecommendation = async (req, res) => {
  try {
    const { stockSymbol } = req.params;

    if (!stockSymbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required' });
    }

    const result = await getStockRecommendation(stockSymbol.toUpperCase());
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getRecommendation:', error);
    res.status(500).json({ success: false, message: 'Failed to get recommendation' });
  }
};

/**
 * Controller for Company Fundamental Analysis
 */
const getFundamentals = async (req, res) => {
  try {
    const { stockSymbol } = req.params;

    if (!stockSymbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required' });
    }

    const result = await getFundamentalAnalysis(stockSymbol.toUpperCase());
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getFundamentals:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze fundamentals' });
  }
};

module.exports = {
  getSentiment,
  getRecommendation,
  getFundamentals
};