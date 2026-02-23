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

  const getRatingColor = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'text-green-600';
      case 'strong': return 'text-blue-600';
      case 'good': return 'text-yellow-600';
      case 'average': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="panel-card">
      <h3>Company Health Score</h3>
      {loading && <p>Loading fundamentals...</p>}
      {error && <p className="error">{error}</p>}
      {fundamentals && !loading && !error && (
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-lg font-bold">{fundamentals.healthScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${getScoreColor(fundamentals.healthScore)}`}
                style={{ width: `${fundamentals.healthScore}%` }}
              ></div>
            </div>
          </div>
          <div className="mb-3">
            <span className={`font-bold ${getRatingColor(fundamentals.rating)}`}>
              {fundamentals.rating} Financial Strength
            </span>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {fundamentals.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FundamentalsMeter;