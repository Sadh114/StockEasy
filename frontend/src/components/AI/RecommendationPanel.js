import { useEffect, useState } from 'react';
import apiClient from '../../api/client';

const RecommendationPanel = ({ symbol }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNews, setShowNews] = useState(false);

  useEffect(() => {
    if (symbol) {
      loadRecommendation();
    }
  }, [symbol]);

  const loadRecommendation = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/api/ai/recommendation/${symbol}`);
      if (data?.success) {
        setRecommendation(data.data);
      } else {
        setError(data?.message || 'Failed to load recommendation');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load recommendation');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationClass = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'BUY': return 'profit';
      case 'SELL': return 'loss';
      default: return 'muted';
    }
  };

  const getRecommendationEmoji = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'BUY': return '🟢';
      case 'SELL': return '🔴';
      default: return '🟡';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="panel-card" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ color: '#2c3e50', marginBottom: '16px', fontSize: '1.4em' }}>
        🤖 AI Stock Recommendation
      </h3>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '1.2em', color: '#6c757d' }}>Analyzing market data...</div>
          <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#adb5bd' }}>
            Fetching technical indicators and news sentiment
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
          ⚠️ {error}
        </div>
      )}

      {recommendation && !loading && !error && (
        <div>
          {/* Main Recommendation */}
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${recommendation.recommendation === 'BUY' ? '#28a745' : recommendation.recommendation === 'SELL' ? '#dc3545' : '#ffc107'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: getRecommendationClass(recommendation.recommendation) === 'profit' ? '#28a745' : getRecommendationClass(recommendation.recommendation) === 'loss' ? '#dc3545' : '#ffc107' }}>
                {getRecommendationEmoji(recommendation.recommendation)} {recommendation.recommendation}
              </span>
              <span style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '12px', fontSize: '0.9em', fontWeight: 'bold' }}>
                {(recommendation.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>

            <div style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '8px' }}>
              📊 News Sentiment: <strong style={{ color: recommendation.newsSentiment === 'Positive' ? '#28a745' : recommendation.newsSentiment === 'Negative' ? '#dc3545' : '#ffc107' }}>
                {recommendation.newsSentiment}
              </strong>
            </div>
          </div>

          {/* Reasoning */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#495057', marginBottom: '8px', fontSize: '1.1em' }}>💡 Analysis & Reasoning</h4>
            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              {recommendation.reasoning.map((reason, index) => (
                <div key={index} style={{ marginBottom: '6px', fontSize: '0.95em', lineHeight: '1.4' }}>
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* News Section */}
          <div>
            <button
              onClick={() => setShowNews(!showNews)}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9em',
                marginBottom: '8px'
              }}
            >
              📰 {showNews ? 'Hide' : 'Show'} Related News ({recommendation.news?.length || 0})
            </button>

            {showNews && recommendation.news && (
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                {recommendation.news.map((article, index) => (
                  <div key={index} style={{
                    padding: '8px 0',
                    borderBottom: index < recommendation.news.length - 1 ? '1px solid #e9ecef' : 'none'
                  }}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#007bff',
                        textDecoration: 'none',
                        fontSize: '0.9em',
                        lineHeight: '1.3'
                      }}
                    >
                      {article.title}
                    </a>
                    <div style={{ fontSize: '0.8em', color: '#6c757d', marginTop: '2px' }}>
                      {formatDate(article.publishedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationPanel;