const axios = require('axios');
const OpenAI = require('openai');
const NodeCache = require('node-cache');
const { getNewsSearchTerm } = require('../util/marketData');

// Initialize cache with 10 minutes TTL
const cache = new NodeCache({ stdTTL: 600 });

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Fetches news headlines for a given stock symbol
 * @param {string} symbol - Stock symbol (e.g., 'RELIANCE')
 * @returns {Promise<string[]>} Array of news headlines
 */
// Restricting to established financial-news outlets avoids false matches on
// short/ambiguous tickers (e.g. "ITC" is also a US retail loyalty program).
const FINANCIAL_NEWS_DOMAINS =
  'economictimes.indiatimes.com,moneycontrol.com,livemint.com,business-standard.com,ndtv.com,reuters.com,cnbctv18.com';

async function fetchNewsHeadlines(symbol) {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    const query = encodeURIComponent(getNewsSearchTerm(symbol));
    const response = await axios.get(
      `https://newsapi.org/v2/everything?qInTitle=${query}&domains=${FINANCIAL_NEWS_DOMAINS}&sortBy=publishedAt&apiKey=${newsApiKey}&pageSize=10`
    );
    if (!response.data.articles.length) {
      throw new Error('No relevant headlines found');
    }
    return response.data.articles.map(article => article.title);
  } catch (error) {
    console.error('Error fetching news:', error);
    // Fallback: return sample headlines
    return [
      `${symbol} announces new expansion plans`,
      `Market analysis: ${symbol} shows strong growth`,
      `${symbol} faces regulatory challenges`
    ];
  }
}

/**
 * Analyzes sentiment of news headlines using keyword analysis
 * @param {string[]} headlines - Array of news headlines
 * @returns {Promise<{sentiment: string, confidence: number, summary: string}>}
 */
async function analyzeSentiment(headlines) {
  const cacheKey = `sentiment_${headlines.join('').substring(0, 100)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Try OpenAI first
    const prompt = `
Analyze the sentiment of the following news headlines about a stock. Classify as Positive, Neutral, or Negative.
Provide a confidence score (0-1) and a short summary.

Headlines:
${headlines.join('\n')}

Response format: JSON with keys: sentiment, confidence, summary
`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content.trim());
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('OpenAI API error, falling back to keyword analysis:', error);

    // Fallback: Simple keyword-based sentiment analysis
    const positiveWords = ['growth', 'profit', 'rise', 'increase', 'expansion', 'success', 'strong', 'bullish', 'upgrade', 'gains', 'surge', 'rally', 'beats', 'positive', 'good', 'excellent', 'outperform'];
    const negativeWords = ['loss', 'decline', 'fall', 'drop', 'crisis', 'weak', 'bearish', 'downgrade', 'scandal', 'falls', 'slump', 'crash', 'losses', 'negative', 'bad', 'poor', 'underperform'];

    let positiveCount = 0;
    let negativeCount = 0;
    let totalWords = 0;

    headlines.forEach(headline => {
      const words = headline.toLowerCase().split(/\s+/);
      totalWords += words.length;

      words.forEach(word => {
        if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
        if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
      });
    });

    let sentiment = 'Neutral';
    let confidence = 0.5;
    let summary = 'Market sentiment appears balanced based on recent news coverage.';

    if (positiveCount > negativeCount) {
      sentiment = 'Positive';
      confidence = Math.min(0.8, 0.5 + (positiveCount - negativeCount) * 0.1);
      summary = `Positive market sentiment detected with ${positiveCount} positive indicators in recent news.`;
    } else if (negativeCount > positiveCount) {
      sentiment = 'Negative';
      confidence = Math.min(0.8, 0.5 + (negativeCount - positiveCount) * 0.1);
      summary = `Negative market sentiment detected with ${negativeCount} concerning indicators in recent news.`;
    }

    const result = { sentiment, confidence, summary };
    cache.set(cacheKey, result);
    return result;
  }
}

/**
 * Main function to get market sentiment for a stock
 * @param {string} symbol - Stock symbol
 * @returns {Promise<{stock: string, sentiment: string, confidence: number, summary: string}>}
 */
async function getMarketSentiment(symbol) {
  const headlines = await fetchNewsHeadlines(symbol);
  const analysis = await analyzeSentiment(headlines);

  return {
    stock: symbol,
    sentiment: analysis.sentiment,
    confidence: analysis.confidence,
    summary: analysis.summary
  };
}

module.exports = { getMarketSentiment };