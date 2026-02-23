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

  const getSentimentClass = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'profit';
      case 'negative': return 'loss';
      default: return 'muted';
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>{getSentimentIcon(sentiment.sentiment)}</span>
            <span className={`font-bold ${getSentimentClass(sentiment.sentiment)}`}>
              {sentiment.sentiment}
            </span>
            <span className="muted">
              ({(sentiment.confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>
          <p className="muted">{sentiment.summary}</p>
        </div>
      )}
    </div>
  );
};

export default SentimentCard;