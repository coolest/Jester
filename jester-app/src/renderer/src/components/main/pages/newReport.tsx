import React, { useState, useEffect } from 'react';
import '../../../assets/components/main/pages/newReport.css';
import { Calendar, ChevronDown, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

interface NewReportProps {
  onNavigate?: (route: string) => void;
}

interface Crypto {
  id: string;
  cryptoName: string;
  img?: string;
  score?: number;
  subreddit: string;
  hashtag: string;
  videoLink: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const getStartOfDayTimestamp = (date) => {
  const dateObj = new Date(date);
  dateObj.setUTCHours(0, 0, 0, 0);
  
  return Math.floor(dateObj.getTime() / 1000);
};

const NewReport: React.FC<NewReportProps> = ({ onNavigate = () => {} }) => {
  const [availableCryptos, setAvailableCryptos] = useState<Crypto[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getFormattedDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
    endDate: getFormattedDate(new Date()) // Today
  });
  const [reportName, setReportName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [includePlatforms, setIncludePlatforms] = useState({
    reddit: true,
    twitter: true,
    youtube: true
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Function to format date to YYYY-MM-DD
  function getFormattedDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Load available cryptos from the API
  useEffect(() => {
    const loadCryptos = async () => {
      try {
        setIsLoading(true);
        const loadedCryptos: Crypto[] = await window.api.getCryptos();
        setAvailableCryptos(loadedCryptos);
        
        // Set first crypto as selected if there are any
        if (loadedCryptos.length > 0) {
          setSelectedCrypto(loadedCryptos[0].id);
          // Auto-generate report name based on first crypto
          setReportName(`${loadedCryptos[0].cryptoName} Analysis Report`);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading cryptos:', error);
        setError('Failed to load cryptocurrencies. Please try again.');
        setIsLoading(false);
      }
    };

    loadCryptos();
  }, []);

  // Update report name when selected crypto changes
  useEffect(() => {
    if (selectedCrypto) {
      const crypto = availableCryptos.find(c => c.id === selectedCrypto);
      if (crypto) {
        setReportName(`${crypto.cryptoName} Analysis Report`);
      }
    }
  }, [selectedCrypto, availableCryptos]);

  const handleCreateReport = async () => {
    // Clear any previous messages
    setError(null);
    setSuccessMessage(null);
    
    // Validate form
    if (!selectedCrypto) {
      setError('Please select a cryptocurrency.');
      return;
    }
    
    if (!reportName.trim()) {
      setError('Please enter a report name.');
      return;
    }
    
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select a date range.');
      return;
    }
    
    // Check if at least one platform is selected
    const platformsSelected = Object.values(includePlatforms).some(value => value);
    if (!platformsSelected) {
      setError('Please select at least one platform to analyze.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const crypto = availableCryptos.find(c => c.id === selectedCrypto);
      
      if (!crypto) {
        throw new Error('Selected cryptocurrency not found.');
      }
      
      // Convert dates to Unix timestamps (seconds)
      const startTimestamp = getStartOfDayTimestamp(dateRange.startDate);
      const endTimestamp = getStartOfDayTimestamp(dateRange.endDate) + 86400; // End of the selected day  
      
      // Create report data
      const reportData = {
        cryptoId: selectedCrypto,
        cryptoName: crypto.cryptoName,
        reportName: reportName,
        startDate: startTimestamp,
        endDate: endTimestamp,
        platforms: includePlatforms
      };
      
      console.log('Creating report with data:', reportData);
      
      // Call API to create report
      const result = await window.api.createReport(reportData);
      
      if (result.success) {
        setSuccessMessage(`Report generation initiated! Report ID: ${result.reportId}`);
        
        // Automatically navigate to reports page after 3 seconds
        setTimeout(() => {
          onNavigate('reports');
        }, 3000);
      } else {
        setError(result.error || 'Failed to create report. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating report:', error);
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlatform = (platform: 'reddit' | 'twitter' | 'youtube') => {
    setIncludePlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  return (
    <div className="new-report-container">
      <div className="new-report-header">
        <h2>Create New Analysis Report</h2>
        <p>Configure your report parameters below</p>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <RefreshCw size={18} className="spinning" />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-indicator">Loading available cryptocurrencies...</div>
      ) : (
        <div className="report-form">
          <div className="form-section">
            <h3>Report Information</h3>
            
            <div className="form-group">
              <label htmlFor="report-name">Report Name</label>
              <input 
                type="text" 
                id="report-name" 
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                disabled={submitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="crypto-select">Cryptocurrency</label>
              <select 
                id="crypto-select" 
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                disabled={availableCryptos.length === 0 || submitting}
              >
                {availableCryptos.length === 0 ? (
                  <option value="">No cryptocurrencies available</option>
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

          <div className="form-section">
            <h3>Date Range</h3>
            
            <div className="date-range-inputs">
              <div className="form-group">
                <label htmlFor="start-date">Start Date</label>
                <div className="date-input-wrapper">
                  <Calendar size={16} />
                  <input 
                    type="date" 
                    id="start-date" 
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    max={dateRange.endDate}
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="end-date">End Date</label>
                <div className="date-input-wrapper">
                  <Calendar size={16} />
                  <input 
                    type="date" 
                    id="end-date" 
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    min={dateRange.startDate}
                    max={getFormattedDate(new Date())}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
            
            <div className="date-presets">
              <button 
                onClick={() => setDateRange({
                  startDate: getFormattedDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                  endDate: getFormattedDate(new Date())
                })}
                disabled={submitting}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setDateRange({
                  startDate: getFormattedDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                  endDate: getFormattedDate(new Date())
                })}
                disabled={submitting}
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => setDateRange({
                  startDate: getFormattedDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
                  endDate: getFormattedDate(new Date())
                })}
                disabled={submitting}
              >
                Last 90 Days
              </button>
            </div>
          </div>
          
          <div className="form-section">
            <div 
              className="advanced-options-toggle"
              onClick={() => !submitting && setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <h3>Advanced Options</h3>
              <ChevronDown 
                size={20} 
                className={`chevron ${showAdvancedOptions ? 'rotate' : ''}`}
              />
            </div>
            
            {showAdvancedOptions && (
              <div className="advanced-options">
                <h4>Include Platforms</h4>
                <div className="platform-toggles">
                  <div className="platform-toggle">
                    <input 
                      type="checkbox" 
                      id="reddit-toggle"
                      checked={includePlatforms.reddit}
                      onChange={() => togglePlatform('reddit')}
                      disabled={submitting}
                    />
                    <label htmlFor="reddit-toggle">Reddit</label>
                  </div>
                  
                  <div className="platform-toggle">
                    <input 
                      type="checkbox" 
                      id="twitter-toggle"
                      checked={includePlatforms.twitter}
                      onChange={() => togglePlatform('twitter')}
                      disabled={submitting}
                    />
                    <label htmlFor="twitter-toggle">Twitter</label>
                  </div>
                  
                  <div className="platform-toggle">
                    <input 
                      type="checkbox" 
                      id="youtube-toggle"
                      checked={includePlatforms.youtube}
                      onChange={() => togglePlatform('youtube')}
                      disabled={submitting}
                    />
                    <label htmlFor="youtube-toggle">YouTube</label>
                  </div>
                </div>
                
                {/* Display the platform sources for the selected crypto */}
                {selectedCrypto && (
                  <div className="platform-sources">
                    <h4>Data Sources</h4>
                    <div className="source-list">
                      {includePlatforms.reddit && (
                        <div className="source-item">
                          <span className="source-label">Reddit Subreddit:</span>
                          <span className="source-value">
                            r/{availableCryptos.find(c => c.id === selectedCrypto)?.subreddit || 'N/A'}
                          </span>
                        </div>
                      )}
                      
                      {includePlatforms.twitter && (
                        <div className="source-item">
                          <span className="source-label">Twitter Hashtag:</span>
                          <span className="source-value">
                            #{availableCryptos.find(c => c.id === selectedCrypto)?.hashtag || 'N/A'}
                          </span>
                        </div>
                      )}
                      
                      {includePlatforms.youtube && (
                        <div className="source-item">
                          <span className="source-label">YouTube Search Term:</span>
                          <span className="source-value">
                            {availableCryptos.find(c => c.id === selectedCrypto)?.videoLink || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              className="create-report-button" 
              onClick={handleCreateReport}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Generate Report
                </>
              )}
            </button>
            
            <button 
              className="cancel-button" 
              onClick={() => onNavigate('reports')}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewReport;