import { useEffect, useState } from 'react';
import apiClient from '../../api/client';

const FundamentalsMeter = ({ symbol }) => {
  const [fundamentals, setFundamentals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (symbol) {
      loadFundamentals();
    }
  }, [symbol]);

  const loadFundamentals = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/api/ai/fundamentals/${symbol}`);
      if (data?.success) {
        setFundamentals(data.data);
      } else {
        setError(data?.message || 'Failed to load fundamentals');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load fundamentals');
    } finally {
      setLoading(false);
    }
  };

  const getRatingClass = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'profit';
      case 'strong': return 'profit';
      case 'good': return 'muted';
      case 'average': return 'loss';
      default: return 'loss';
    }
  };

  const getScoreBarStyle = (score) => {
    let color = '#cc2b36'; // red for low
    if (score >= 80) color = '#0f8f43'; // green
    else if (score >= 60) color = '#0b5dc2'; // blue
    else if (score >= 40) color = '#68819f'; // gray
    return {
      width: '100%',
      height: '16px',
      backgroundColor: '#edf2f8',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '8px'
    };
  };

  const getScoreFillStyle = (score) => {
    let color = '#cc2b36'; // red for low
    if (score >= 80) color = '#0f8f43'; // green
    else if (score >= 60) color = '#0b5dc2'; // blue
    else if (score >= 40) color = '#68819f'; // gray
    return {
      width: `${score}%`,
      height: '100%',
      backgroundColor: color,
      borderRadius: '8px'
    };
  };

  return (
    <div className="panel-card">
      <h3>Company Health Score</h3>
      {loading && <p>Loading fundamentals...</p>}
      {error && <p className="error">{error}</p>}
      {fundamentals && !loading && !error && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="muted">Health Score</span>
              <span className="font-bold">{fundamentals.healthScore}/100</span>
            </div>
            <div style={getScoreBarStyle(fundamentals.healthScore)}>
              <div style={getScoreFillStyle(fundamentals.healthScore)}></div>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span className={`font-bold ${getRatingClass(fundamentals.rating)}`}>
              {fundamentals.rating} Financial Strength
            </span>
          </div>
          <ul style={{ paddingLeft: '20px' }}>
            {fundamentals.insights.map((insight, index) => (
              <li key={index} className="muted">{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FundamentalsMeter;