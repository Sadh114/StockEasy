import { useEffect, useState } from 'react';
import apiClient from '../../api/client';

const RecommendationPanel = ({ symbol }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const getRecommendationColor = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'BUY': return 'bg-green-100 text-green-800';
      case 'SELL': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="panel-card">
      <h3>AI Stock Recommendation</h3>
      {loading && <p>Loading recommendation...</p>}
      {error && <p className="error">{error}</p>}
      {recommendation && !loading && !error && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRecommendationColor(recommendation.recommendation)}`}>
              {recommendation.recommendation}
            </span>
            <span className="text-sm text-gray-500">
              ({(recommendation.confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {recommendation.reasoning.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecommendationPanel;