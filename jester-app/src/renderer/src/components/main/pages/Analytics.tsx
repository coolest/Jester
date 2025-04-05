import React, { useState, useEffect } from 'react';
import '../../../assets/components/main/pages/Analytics.css';
import { Plus, BarChart2 } from 'lucide-react';

interface AnalyticsProps {
  selectedCryptoId: string;
  onNavigate?: (route: string) => void; // Add navigation prop
}

interface Crypto {
  id: string;
  cryptoName: string;
  videoLink: string;
  subreddit: string;
  hashtag: string;
  score: number;
  img?: string;
}

interface SentimentData {
  platform: string;
  positive: number;
  neutral: number;
  negative: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
}

interface CryptoSentiment {
  name: string;
  symbol: string;
  overallScore: number;
  sources: SentimentData[];
  historicalSentiment: {
    date: string;
    score: number;
  }[];
}

const Analytics: React.FC<AnalyticsProps> = ({ 
  selectedCryptoId,
  onNavigate = () => {} // Default empty function if not provided
}) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>(selectedCryptoId);
  const [timeframe, setTimeframe] = useState<string>('1w');
  const [sentimentData, setSentimentData] = useState<CryptoSentiment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableCryptos, setAvailableCryptos] = useState<Crypto[]>([]);

  // Update selected crypto when props change
  useEffect(() => {
    if (selectedCryptoId) {
      setSelectedCrypto(selectedCryptoId);
    }
  }, [selectedCryptoId]);

  // Load available cryptos from the API
  useEffect(() => {
    const loadCryptos = async () => {
      try {
        const loadedCryptos: Crypto[] = await window.api.getCryptos();
        setAvailableCryptos(loadedCryptos);
        
        // Set first crypto as selected if there are any and no crypto is currently selected
        if (loadedCryptos.length > 0 && !selectedCrypto) {
          setSelectedCrypto(loadedCryptos[0].id);
        }
      } catch (error) {
        console.error('Error loading cryptos:', error);
      }
    };

    loadCryptos();
  }, []);

  // Generate sentiment data when a crypto is selected
  useEffect(() => {
    // Don't fetch if no crypto is selected
    if (!selectedCrypto) return;
    
    const fetchSentimentData = () => {
      setIsLoading(true);
      
      // In a real app, this would come from an API with real sentiment analysis
      setTimeout(() => {
        const selectedCryptoData = availableCryptos.find(c => c.id === selectedCrypto);
        
        if (!selectedCryptoData) {
          setIsLoading(false);
          return;
        }
        
        // Use the crypto's actual score if available
        const baseScore = selectedCryptoData.score || Math.floor(Math.random() * 40) + 40; // Random 40-80 score
        
        // Mock data using the actual crypto information
        const mockSentimentData: CryptoSentiment = {
          name: selectedCryptoData.cryptoName,
          symbol: selectedCryptoData.cryptoName.substring(0, 3).toUpperCase(), // Generate a symbol from the name
          overallScore: baseScore,
          sources: [
            { 
              platform: 'Reddit', 
              positive: Math.floor(baseScore * 0.9 + Math.random() * 10), 
              neutral: Math.floor((100 - baseScore) * 0.6), 
              negative: Math.floor((100 - baseScore) * 0.4),
              volume: Math.floor(Math.random() * 2000) + 500,
              trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down'
            },
            { 
              platform: 'Twitter', 
              positive: Math.floor(baseScore * 0.85 + Math.random() * 10), 
              neutral: Math.floor((100 - baseScore) * 0.5), 
              negative: Math.floor((100 - baseScore) * 0.5),
              volume: Math.floor(Math.random() * 5000) + 2000,
              trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down'
            },
            { 
              platform: 'YouTube', 
              positive: Math.floor(baseScore * 1.05 + Math.random() * 5), 
              neutral: Math.floor((100 - baseScore) * 0.6), 
              negative: Math.floor((100 - baseScore) * 0.4),
              volume: Math.floor(Math.random() * 500) + 100,
              trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down'
            }
          ],
          historicalSentiment: [
            { date: '7 days ago', score: baseScore - Math.floor(Math.random() * 15) },
            { date: '6 days ago', score: baseScore - Math.floor(Math.random() * 12) },
            { date: '5 days ago', score: baseScore - Math.floor(Math.random() * 8) },
            { date: '4 days ago', score: baseScore - Math.floor(Math.random() * 10) },
            { date: '3 days ago', score: baseScore - Math.floor(Math.random() * 5) },
            { date: '2 days ago', score: baseScore - Math.floor(Math.random() * 3) },
            { date: 'Yesterday', score: baseScore - 1 },
            { date: 'Today', score: baseScore }
          ]
        };
        
        // Normalize percentage values to ensure they add up to 100%
        mockSentimentData.sources.forEach(source => {
          const total = source.positive + source.neutral + source.negative;
          source.positive = Math.round(source.positive / total * 100);
          source.neutral = Math.round(source.neutral / total * 100);
          source.negative = 100 - source.positive - source.neutral;
        });
        
        setSentimentData(mockSentimentData);
        setIsLoading(false);
      }, 800);
    };

    fetchSentimentData();
  }, [selectedCrypto, timeframe, availableCryptos]);

  // Calculate overall sentiment class
  const getSentimentClass = (score: number): string => {
    if (score >= 70) return 'very-positive';
    if (score >= 55) return 'positive';
    if (score >= 45) return 'neutral';
    if (score >= 30) return 'negative';
    return 'very-negative';
  };

  // Format trend indicator
  const getTrendIndicator = (trend: 'up' | 'down' | 'stable'): string => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  // Navigate to new report page
  const handleCreateNewAnalysis = () => {
    // Navigate to the new report page
    onNavigate('newReport');
  };

  // View past analysis
  const handleViewPastAnalysis = () => {
    console.log('View past analysis clicked');
    // Implement functionality later
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-title-container">
          <h2>Social Sentiment Analysis</h2>
          <div className="analytics-actions">
            <button 
              className="past-analysis-button"
              onClick={handleViewPastAnalysis}
              title="View past analysis"
            >
              Past Analysis
            </button>
            <button 
              className="add-analysis-button"
              onClick={handleCreateNewAnalysis}
              title="Create new analysis"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="crypto-selector">
          <label htmlFor="crypto-select">Cryptocurrency:</label>
          <select 
            id="crypto-select" 
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value)}
            disabled={availableCryptos.length === 0}
          >
            {availableCryptos.length === 0 ? (
              <option value="">No cryptocurrencies added</option>
            ) : (
              availableCryptos.map((crypto) => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.cryptoName}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div className="timeframe-selector">
          <button 
            className={timeframe === '24h' ? 'active' : ''} 
            onClick={() => setTimeframe('24h')}
          >
            24H
          </button>
          <button 
            className={timeframe === '1w' ? 'active' : ''} 
            onClick={() => setTimeframe('1w')}
          >
            1W
          </button>
          <button 
            className={timeframe === '1m' ? 'active' : ''} 
            onClick={() => setTimeframe('1m')}
          >
            1M
          </button>
          <button 
            className={timeframe === '3m' ? 'active' : ''} 
            onClick={() => setTimeframe('3m')}
          >
            3M
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading sentiment data...</div>
      ) : sentimentData && (
        <>
          <div className="sentiment-overview">
            <div className="overall-sentiment">
              <h3>Overall Sentiment Score</h3>
              <div className={`sentiment-score ${getSentimentClass(sentimentData.overallScore)}`}>
                {sentimentData.overallScore}
              </div>
              <div className="sentiment-label">
                {
                  sentimentData.overallScore >= 70 ? 'Very Positive' :
                  sentimentData.overallScore >= 55 ? 'Positive' :
                  sentimentData.overallScore >= 45 ? 'Neutral' :
                  sentimentData.overallScore >= 30 ? 'Negative' : 'Very Negative'
                }
              </div>
            </div>

            <div className="sentiment-summary">
              <h3>Sentiment Trend ({timeframe})</h3>
              <div className="trend-visualization">
                {sentimentData.historicalSentiment.map((data, index) => (
                  <div key={index} className="trend-day">
                    <div 
                      className={`trend-bar ${getSentimentClass(data.score)}`}
                      style={{ height: `${data.score}%` }}
                    ></div>
                    <div className="trend-date">{data.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="analytics-section">
            <h3>Sentiment by Platform</h3>
            <div className="platform-table">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Positive</th>
                    <th>Neutral</th>
                    <th>Negative</th>
                    <th>Mentions</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sentimentData.sources.map((source) => (
                    <tr key={source.platform}>
                      <td className="platform-name">{source.platform}</td>
                      <td className="positive">{source.positive}%</td>
                      <td className="neutral">{source.neutral}%</td>
                      <td className="negative">{source.negative}%</td>
                      <td>{source.volume.toLocaleString()}</td>
                      <td className={source.trend === 'up' ? 'positive' : source.trend === 'down' ? 'negative' : 'neutral'}>
                        {getTrendIndicator(source.trend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-section">
            <h3>Key Community Insights</h3>
            <div className="insights-container">
              <div className="insight-card">
                <h4>Reddit r/{availableCryptos.find(c => c.id === selectedCrypto)?.subreddit || 'unknown'}</h4>
                <p className="insight-text">Community sentiment has improved by {Math.floor(Math.random() * 10) + 2}% over the past week with increased discussion about new partnerships and development updates.</p>
                <div className="insight-stats">
                  <span>{(Math.floor(Math.random() * 15) + 1) / 10}K posts</span>
                  <span>{(Math.floor(Math.random() * 85) + 15) / 10}K comments</span>
                </div>
              </div>
              
              <div className="insight-card">
                <h4>Twitter {availableCryptos.find(c => c.id === selectedCrypto)?.hashtag || '#unknown'}</h4>
                <p className="insight-text">Recent tweets show {sentimentData.overallScore > 60 ? 'high optimism' : sentimentData.overallScore > 45 ? 'mixed reactions' : 'some concerns'} with {availableCryptos.find(c => c.id === selectedCrypto)?.hashtag || '#unknown'} trending in crypto communities. Influencer activity is {Math.random() > 0.5 ? 'up' : 'down'} {Math.floor(Math.random() * 30) + 5}%.</p>
                <div className="insight-stats">
                  <span>{(Math.floor(Math.random() * 43) + 10) / 10}K tweets</span>
                  <span>{(Math.floor(Math.random() * 128) + 30) / 10}K retweets</span>
                </div>
              </div>
              
              <div className="insight-card">
                <h4>YouTube Analysis</h4>
                <p className="insight-text">Content creators are predominantly {sentimentData.sources[2].positive > 65 ? 'positive' : sentimentData.sources[2].positive > 50 ? 'optimistic' : 'cautious'} with {sentimentData.sources[2].positive}% of recent videos discussing {sentimentData.overallScore > 60 ? 'bullish signals' : 'technical analysis'} {sentimentData.overallScore > 55 ? 'supporting upward movement' : 'suggesting careful monitoring'}.</p>
                <div className="insight-stats">
                  <span>{Math.floor(Math.random() * 300) + 100} videos</span>
                  <span>{(Math.floor(Math.random() * 20) + 1) / 10}M views</span>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-section">
            <h3>Top Keywords</h3>
            <div className="keyword-cloud">
              <span className="keyword size-xl">bullish</span>
              <span className="keyword size-l">partnership</span>
              <span className="keyword size-m">upgrade</span>
              <span className="keyword size-xl">development</span>
              <span className="keyword size-s">stake</span>
              <span className="keyword size-m">adoption</span>
              <span className="keyword size-l">future</span>
              <span className="keyword size-s">community</span>
              <span className="keyword size-m">hodl</span>
              <span className="keyword size-s">growth</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;