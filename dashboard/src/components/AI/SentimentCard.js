import { useEffect, useState } from 'react';
import apiClient from '../../api/client';

const SentimentCard = ({ symbol }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (symbol) {
      loadSentiment();
    }
  }, [symbol]);

  const loadSentiment = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/api/ai/sentiment/${symbol}`);
      if (data?.success) {
        setSentiment(data.data);
      } else {
        setError(data?.message || 'Failed to load sentiment');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load sentiment');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  return (
    <div className="panel-card">
      <h3>AI Sentiment Analysis</h3>
      {loading && <p>Loading sentiment...</p>}
      {error && <p className="error">{error}</p>}
      {sentiment && !loading && !error && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getSentimentIcon(sentiment.sentiment)}</span>
            <span className={`font-bold text-lg ${getSentimentColor(sentiment.sentiment)}`}>
              {sentiment.sentiment}
            </span>
            <span className="text-sm text-gray-500">
              ({(sentiment.confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>
          <p className="text-sm text-gray-700">{sentiment.summary}</p>
        </div>
      )}
    </div>
  );
};

export default SentimentCard;