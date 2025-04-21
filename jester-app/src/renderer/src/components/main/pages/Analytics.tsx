import React, { useState, useEffect } from 'react';
import '../../../assets/components/main/pages/Analytics.css';
import { Plus, BarChart2, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface AnalyticsProps {
  selectedCryptoId: string;
  onNavigate?: (route: string, params?: any) => void;
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

interface SentimentDataPoint {
  timestamp: number;
  reddit: number | null;
  twitter: number | null;
  youtube: number | null;
  formattedDate?: string;
  average?: number | null;
}

interface Report {
  id: string;
  cryptoId: string;
  cryptoName: string;
  reportName: string;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  platforms: {
    reddit: boolean;
    twitter: boolean;
    youtube: boolean;
  };
  status: string;
  resultFilePath: string;
  createdAt: string;
}

// Custom tooltip component that matches the app's dark theme
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-data">
          {payload.map((entry, index) => (
            entry.value !== null && (
              <div key={`tooltip-${index}`} className="tooltip-item">
                <div className="tooltip-color" style={{ backgroundColor: entry.color }}></div>
                <span className="tooltip-name">{entry.name}:</span>
                <span className="tooltip-value">{entry.value?.toFixed(1)}</span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Analytics: React.FC<AnalyticsProps> = ({ 
  selectedCryptoId,
  onNavigate = () => {}
}) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>(selectedCryptoId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableCryptos, setAvailableCryptos] = useState<Crypto[]>([]);
  const [recentReport, setRecentReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<SentimentDataPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cryptoDetails, setCryptoDetails] = useState<Crypto | null>(null);

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
        
        // Find the current crypto's details
        if (selectedCrypto) {
          const crypto = loadedCryptos.find(c => c.id === selectedCrypto);
          if (crypto) {
            setCryptoDetails(crypto);
          }
        }
      } catch (error) {
        console.error('Error loading cryptos:', error);
        setError('Failed to load cryptocurrencies. Please try again.');
      }
    };

    loadCryptos();
  }, [selectedCrypto]);

  // Load recent reports for the selected crypto
  useEffect(() => {
    const loadRecentReport = async () => {
      if (!selectedCrypto) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all reports
        const result = await window.api.getAllReports();
        if (result.success && result.reports && result.reports.length > 0) {
          // Filter reports for this crypto and get the most recent completed one
          const cryptoReports = result.reports.filter(
            (report: Report) => report.cryptoId === selectedCrypto && report.status === 'completed'
          );
          
          if (cryptoReports.length > 0) {
            // Sort by creation date (newest first)
            cryptoReports.sort((a: Report, b: Report) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            // Get the most recent report
            const latest = cryptoReports[0];
            setRecentReport(latest);
            
            // Load the report data right away
            await loadReportData(latest.id);
          } else {
            setRecentReport(null);
            setReportData(null);
            setIsLoading(false);
          }
        } else {
          setRecentReport(null);
          setReportData(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading recent reports:', error);
        setError('Failed to load reports. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadRecentReport();
  }, [selectedCrypto]);

  // Load report data with improved data handling
  const loadReportData = async (reportId: string) => {
    try {
      const result = await window.api.getReportById(reportId);
      
      if (result.success && result.resultData) {
        // Ensure the data is properly formatted
        const formattedData = result.resultData.map((item: any) => {
          // Format date for each data point
          const date = new Date(item.timestamp * 1000);
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
          
          // Ensure values are properly typed numbers or null
          const redditValue = typeof item.reddit === 'number' ? item.reddit : null;
          const twitterValue = typeof item.twitter === 'number' ? item.twitter : null;
          const youtubeValue = typeof item.youtube === 'number' ? item.youtube : null;
          
          // Calculate average only for non-null values
          const values = [redditValue, twitterValue, youtubeValue].filter(v => v !== null) as number[];
          const average = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : null;
          
          return {
            timestamp: item.timestamp,
            reddit: redditValue,
            twitter: twitterValue,
            youtube: youtubeValue,
            formattedDate,
            average
          };
        });
        
        // Sort by timestamp (oldest to newest)
        formattedData.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('Processed report data:', formattedData);
        setReportData(formattedData);
        setIsLoading(false);
        return true;
      } else {
        console.error('Error loading report data:', result.error);
        setError('Failed to load report data. Please try again.');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('An unexpected error occurred while loading data.');
      setIsLoading(false);
      return false;
    }
  };

  // Navigate to new report page
  const handleCreateNewAnalysis = () => {
    onNavigate('newReport');
  };

  // View past analysis
  const handleViewPastAnalysis = () => {
    onNavigate('reports', { cryptoId: selectedCrypto });
  };

  // Get custom stroke colors
  const getStrokeColor = (platform: string) => {
    switch (platform) {
      case 'reddit':
        return '#FF4500'; // Reddit orange
      case 'twitter':
        return '#1DA1F2'; // Twitter blue
      case 'youtube':
        return '#FF0000'; // YouTube red
      default:
        return '#4CAF50'; // Green for average
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: string | number) => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(ts * 1000).toLocaleDateString();
  };

  // Calculate platform average
  const calculatePlatformAverage = (platform: 'reddit' | 'twitter' | 'youtube') => {
    if (!reportData) return 'N/A';
    
    const values = reportData
      .map(point => point[platform])
      .filter(value => value !== null) as number[];
    
    if (values.length === 0) return 'N/A';
    
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return average.toFixed(1);
  };

  // Calculate overall average
  const calculateOverallAverage = () => {
    if (!reportData) return 'N/A';
    
    let sum = 0;
    let count = 0;
    
    reportData.forEach(point => {
      if (point.reddit !== null) { sum += point.reddit; count++; }
      if (point.twitter !== null) { sum += point.twitter; count++; }
      if (point.youtube !== null) { sum += point.youtube; count++; }
    });
    
    return count > 0 ? (sum / count).toFixed(1) : 'N/A';
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
            disabled={availableCryptos.length === 0 || isLoading}
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
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="analytics-content-wrapper">
        {isLoading ? (
          <div className="loading-indicator">
            <RefreshCw size={24} className="spinning" />
            <span>Loading sentiment data...</span>
          </div>
        ) : recentReport && reportData && reportData.length > 0 ? (
          // Show data visualization if we have report data
          <div className="report-visualization">
            <div className="report-info">
              <h3>{recentReport.reportName}</h3>
              <div className="report-date-range">
                {formatDate(recentReport.timeRange.startDate)} - {formatDate(recentReport.timeRange.endDate)}
              </div>
            </div>

            {/* Main Chart */}
            <div className="chart-container">
              <h3>Sentiment Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={reportData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="var(--text-color)"
                    tick={{ fill: 'var(--text-color)' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="var(--text-color)"
                    tick={{ fill: 'var(--text-color)' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'var(--text-color)' }}
                  />
                  
                  {/* Only render lines for platforms that are enabled in the report */}
                  {recentReport.platforms.reddit && (
                    <Line
                      type="monotone"
                      dataKey="reddit"
                      name="Reddit"
                      stroke={getStrokeColor('reddit')}
                      activeDot={{ r: 8 }}
                      connectNulls
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  
                  {recentReport.platforms.twitter && (
                    <Line
                      type="monotone"
                      dataKey="twitter"
                      name="Twitter"
                      stroke={getStrokeColor('twitter')}
                      activeDot={{ r: 8 }}
                      connectNulls
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  
                  {recentReport.platforms.youtube && (
                    <Line
                      type="monotone"
                      dataKey="youtube"
                      name="YouTube"
                      stroke={getStrokeColor('youtube')}
                      activeDot={{ r: 8 }}
                      connectNulls
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Average"
                    stroke={getStrokeColor('average')}
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    connectNulls
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Platform statistics table */}
            <div className="platform-statistics">
              <h3>Platform Sentiment</h3>
              <table className="statistics-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Average Sentiment</th>
                    <th>Data Points</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReport.platforms.reddit && (
                    <tr>
                      <td>Reddit</td>
                      <td>{calculatePlatformAverage('reddit')}</td>
                      <td>{reportData.filter(d => d.reddit !== null).length}</td>
                    </tr>
                  )}
                  
                  {recentReport.platforms.twitter && (
                    <tr>
                      <td>Twitter</td>
                      <td>{calculatePlatformAverage('twitter')}</td>
                      <td>{reportData.filter(d => d.twitter !== null).length}</td>
                    </tr>
                  )}
                  
                  {recentReport.platforms.youtube && (
                    <tr>
                      <td>YouTube</td>
                      <td>{calculatePlatformAverage('youtube')}</td>
                      <td>{reportData.filter(d => d.youtube !== null).length}</td>
                    </tr>
                  )}
                  
                  <tr className="overall-row">
                    <td>Overall</td>
                    <td>{calculateOverallAverage()}</td>
                    <td>{(() => {
                      let count = 0;
                      reportData.forEach(point => {
                        if (point.reddit !== null) count++;
                        if (point.twitter !== null) count++;
                        if (point.youtube !== null) count++;
                      });
                      return count;
                    })()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Source info */}
            <div className="source-info">
              <h3>Data Sources</h3>
              <div className="source-details">
                {recentReport.platforms.reddit && (
                  <div className="source-item">
                    <strong>Reddit:</strong> r/{cryptoDetails?.subreddit || 'N/A'}
                  </div>
                )}
                {recentReport.platforms.twitter && (
                  <div className="source-item">
                    <strong>Twitter:</strong> #{cryptoDetails?.hashtag || 'N/A'}
                  </div>
                )}
                {recentReport.platforms.youtube && (
                  <div className="source-item">
                    <strong>YouTube:</strong> {cryptoDetails?.videoLink || 'N/A'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // If no report, show prompt to create one
          <div className="no-report-view">
            <div className="no-report-message">
              {cryptoDetails ? (
                <>
                  <h3>No sentiment analysis available for {cryptoDetails.cryptoName}</h3>
                  <p>To see sentiment analysis, you need to generate a report first.</p>
                  <div className="crypto-info">
                    <div className="info-item">
                      <span className="label">Subreddit:</span>
                      <span className="value">r/{cryptoDetails.subreddit}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Twitter Hashtag:</span>
                      <span className="value">#{cryptoDetails.hashtag}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">YouTube Keywords:</span>
                      <span className="value">{cryptoDetails.videoLink}</span>
                    </div>
                  </div>
                  <button 
                    className="create-report-button"
                    onClick={handleCreateNewAnalysis}
                  >
                    <Plus size={18} />
                    Generate Sentiment Report
                  </button>
                </>
              ) : (
                <>
                  <h3>Please select a cryptocurrency</h3>
                  <p>Select a cryptocurrency from the dropdown above to view its sentiment analysis.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;