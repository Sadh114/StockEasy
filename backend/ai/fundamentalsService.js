const yahooFinance = require('yahoo-finance2').default;
const NodeCache = require('node-cache');

// Initialize cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * Fetches fundamental data for a stock
 * @param {string} symbol - Stock symbol
 * @returns {Promise<object>} Fundamental data
 */
async function getFundamentalData(symbol) {
  const cacheKey = `fundamentals_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const quote = await yahooFinance.quote(symbol + '.NS');
    const summary = await yahooFinance.quoteSummary(symbol + '.NS', { modules: ['financialData', 'summaryDetail'] });

    const data = {
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      eps: quote.epsTrailingTwelveMonths,
      revenue: summary.financialData?.totalRevenue?.raw,
      netIncome: summary.financialData?.netIncome?.raw,
      debtToEquity: summary.financialData?.debtToEquity?.raw,
      returnOnEquity: summary.financialData?.returnOnEquity?.raw,
      // Add more as needed
    };

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching fundamental data:', error);
    return {};
  }
}

/**
 * Calculates health score based on fundamentals
 * @param {object} data - Fundamental data
 * @returns {number} Health score (0-100)
 */
function calculateHealthScore(data) {
  let score = 50; // Base score

  // Revenue growth (simplified, assuming positive is good)
  if (data.revenue && data.revenue > 0) score += 10;

  // Net profit margin
  if (data.netIncome && data.revenue) {
    const margin = data.netIncome / data.revenue;
    if (margin > 0.1) score += 15;
    else if (margin > 0) score += 5;
  }

  // Debt to equity (lower is better)
  if (data.debtToEquity !== undefined) {
    if (data.debtToEquity < 0.5) score += 15;
    else if (data.debtToEquity < 1) score += 10;
    else score -= 10;
  }

  // ROE (higher is better)
  if (data.returnOnEquity && data.returnOnEquity > 0.15) score += 15;
  else if (data.returnOnEquity && data.returnOnEquity > 0.1) score += 10;

  // EPS positive
  if (data.eps && data.eps > 0) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Gets financial strength rating
 * @param {number} score - Health score
 * @returns {string} Rating
 */
function getRating(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Average';
  return 'Weak';
}

/**
 * Generates insights based on data
 * @param {object} data - Fundamental data
 * @returns {string[]} Insights
 */
function generateInsights(data) {
  const insights = [];

  if (data.revenue && data.revenue > 0) insights.push('Consistent revenue growth');
  if (data.netIncome && data.netIncome > 0) insights.push('Profitable operations');
  if (data.debtToEquity && data.debtToEquity < 0.5) insights.push('Low debt ratio');
  if (data.returnOnEquity && data.returnOnEquity > 0.15) insights.push('High return on equity');
  if (data.eps && data.eps > 0) insights.push('Positive earnings per share');

  if (insights.length === 0) insights.push('Limited fundamental data available');

  return insights;
}

/**
 * Main function to get company fundamental analysis
 * @param {string} symbol - Stock symbol
 * @returns {Promise<{stock: string, healthScore: number, rating: string, insights: string[]}>}
 */
async function getFundamentalAnalysis(symbol) {
  const data = await getFundamentalData(symbol);
  const healthScore = calculateHealthScore(data);
  const rating = getRating(healthScore);
  const insights = generateInsights(data);

  return {
    stock: symbol,
    healthScore,
    rating,
    insights
  };
}

module.exports = { getFundamentalAnalysis };