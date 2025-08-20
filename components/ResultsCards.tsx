// Results display component for single and side-by-side layouts
import { ModelResult, Evaluation } from '@/types';
import { getSourceBadge } from '@/lib/models/providers';
import ScoreBadge from './ScoreBadge';

interface ResultsCardsProps {
  results: ModelResult[];
  evaluations?: Evaluation['perModelResults'];
  layout: 'single' | 'side-by-side';
  loading?: boolean;
  error?: string;
}

export default function ResultsCards({
  results,
  evaluations,
  layout,
  loading = false,
  error
}: ResultsCardsProps) {
  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
        <p>Evaluating responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-error">
        <div className="error-icon">⚠️</div>
        <h3>Evaluation Failed</h3>
        <p>{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="results-empty">
        <p>No results to display</p>
      </div>
    );
  }

  const getEvaluationForModel = (modelId: string) => {
    return evaluations?.find(evaluation => evaluation.modelId === modelId);
  };

  const formatLatency = (latencyMs: number) => {
    if (latencyMs < 1000) {
      return `${latencyMs}ms`;
    }
    return `${(latencyMs / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`results-container ${layout}`}>
      <div className="results-header">
        <h3>Results</h3>
        <span className="results-count">
          {results.length} model{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className={`results-grid ${layout}`}>
        {results.map((result, index) => {
          const evaluation = getEvaluationForModel(result.modelId);
          
          return (
            <div key={`${result.modelId}-${index}`} className="result-card">
              <div className="result-header">
                <div className="model-info">
                  <h4 className="model-name">{result.modelId}</h4>
                  <span className={`source-badge ${result.source}`}>
                    {getSourceBadge(result)}
                  </span>
                </div>
                
                <div className="result-meta">
                  <span className="latency">
                    ⏱️ {formatLatency(result.latencyMs)}
                  </span>
                  {result.usageTokens && (
                    <span className="tokens">
                      📝 {result.usageTokens} tokens
                    </span>
                  )}
                </div>
              </div>
              
              <div className="result-content">
                <div className="response-text">
                  {result.text}
                </div>
              </div>
              
              {evaluation && evaluation.score !== undefined && (
                <div className="result-evaluation">
                  <ScoreBadge
                    score={evaluation.score}
                    breakdown={evaluation.breakdown || { clarity: 0, completeness: 0 }}
                    notes={evaluation.notes}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {layout === 'side-by-side' && results.length > 1 && (
        <div className="comparison-summary">
          <h4>Quick Comparison</h4>
          <div className="comparison-metrics">
            <div className="metric">
              <span className="metric-label">Fastest:</span>
              <span className="metric-value">
                {results.reduce((fastest, current) => 
                  current.latencyMs < fastest.latencyMs ? current : fastest
                ).modelId}
              </span>
            </div>
            
            {evaluations && evaluations.length > 0 && (
              <div className="metric">
                <span className="metric-label">Highest Score:</span>
                <span className="metric-value">
                  {evaluations.reduce((highest, current) => 
                    (current.score || 0) > (highest.score || 0) ? current : highest
                  ).modelId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}