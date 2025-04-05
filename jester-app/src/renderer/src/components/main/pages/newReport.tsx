import React, { useState, useEffect } from 'react';
import '../../../assets/components/main/pages/newReport.css';
import { Calendar, ChevronDown, FileText } from 'lucide-react';

interface NewReportProps {
  // You can add props as needed
}

interface Crypto {
  id: string;
  cryptoName: string;
  img?: string;
  score?: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const NewReport: React.FC<NewReportProps> = () => {
  const [availableCryptos, setAvailableCryptos] = useState<Crypto[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getFormattedDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
    endDate: getFormattedDate(new Date()) // Today
  });
  const [reportName, setReportName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [includePlatforms, setIncludePlatforms] = useState({
    reddit: true,
    twitter: true,
    youtube: true
  });

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

  const handleCreateReport = () => {
    // Create report logic would go here
    console.log('Creating report with:', {
      cryptoId: selectedCrypto,
      cryptoName: availableCryptos.find(c => c.id === selectedCrypto)?.cryptoName,
      dateRange,
      reportName,
      includePlatforms
    });
    
    // You would typically call an API or service here
    alert('Report generation initiated!');
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
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="crypto-select">Cryptocurrency</label>
              <select 
                id="crypto-select" 
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                disabled={availableCryptos.length === 0}
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
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setDateRange({
                  startDate: getFormattedDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                  endDate: getFormattedDate(new Date())
                })}
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => setDateRange({
                  startDate: getFormattedDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
                  endDate: getFormattedDate(new Date())
                })}
              >
                Last 90 Days
              </button>
            </div>
          </div>
          
          <div className="form-section">
            <div 
              className="advanced-options-toggle"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
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
                    />
                    <label htmlFor="reddit-toggle">Reddit</label>
                  </div>
                  
                  <div className="platform-toggle">
                    <input 
                      type="checkbox" 
                      id="twitter-toggle"
                      checked={includePlatforms.twitter}
                      onChange={() => togglePlatform('twitter')}
                    />
                    <label htmlFor="twitter-toggle">Twitter</label>
                  </div>
                  
                  <div className="platform-toggle">
                    <input 
                      type="checkbox" 
                      id="youtube-toggle"
                      checked={includePlatforms.youtube}
                      onChange={() => togglePlatform('youtube')}
                    />
                    <label htmlFor="youtube-toggle">YouTube</label>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button className="create-report-button" onClick={handleCreateReport}>
              <FileText size={18} />
              Generate Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewReport;