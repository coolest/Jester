// Modified Reports.tsx to integrate the enhanced report results

import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, AlertTriangle, Check, X, ChevronRight, Eye, Trash2, XCircle } from 'lucide-react';
import '../../../assets/components/main/pages/Reports.css';
// Import the new enhanced styles

interface ReportPlatformStatus {
  [key: string]: string; // platform -> status
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
  updatedAt: string;
  completionTime: string | null;
  platformStatus: ReportPlatformStatus;
  error: string | null;
}

interface SentimentDataPoint {
  timestamp: number;
  reddit: number | null;
  twitter: number | null;
  youtube: number | null;
}

interface ReportsProps {
  onNavigate?: (route: string, params?: any) => void;
}

const Reports: React.FC<ReportsProps> = ({ onNavigate = () => {} }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<SentimentDataPoint[] | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Status display mapping
  const statusDisplayMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
    pending: { 
      label: 'Pending', 
      color: 'var(--orange)', 
      icon: <RefreshCw size={16} className="status-icon spinning" /> 
    },
    running: { 
      label: 'Running', 
      color: 'var(--blue)', 
      icon: <RefreshCw size={16} className="status-icon spinning" /> 
    },
    completed: { 
      label: 'Completed', 
      color: 'var(--green)', 
      icon: <Check size={16} className="status-icon" /> 
    },
    failed: { 
      label: 'Failed', 
      color: 'var(--red)', 
      icon: <AlertTriangle size={16} className="status-icon" /> 
    }
  };

  // Load reports on component mount and when refresh is triggered
  useEffect(() => {
    loadReports();
    
    // Set up polling for updates
    const interval = setInterval(() => {
      loadReports(false); // Don't show loading indicator for background refreshes
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  // Load report data when a report is selected
  useEffect(() => {
    if (selectedReport) {
      loadReportData(selectedReport.id);
    }
  }, [selectedReport]);

  // Load all reports
  const loadReports = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const result = await window.api.getAllReports();
      if (result.success) {
        // Sort reports by createdAt date (newest first)
        const sortedReports = result.reports.sort((a: Report, b: Report) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setReports(sortedReports);
        
        // Update selected report if needed
        if (selectedReport) {
          const updatedReport = sortedReports.find(r => r.id === selectedReport.id);
          if (updatedReport) {
            setSelectedReport(updatedReport);
          }
        }
        
        setError(null);
      } else {
        setError(result.error || 'Failed to load reports');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('An unexpected error occurred while loading reports');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Load data for a specific report
  const loadReportData = async (reportId: string) => {
    try {
      setError(null);
      console.log(`Loading data for report: ${reportId}`);
      const result = await window.api.getReportById(reportId);
      
      if (result.success) {
        console.log(`Report data loaded:`, result);
        
        if (result.resultData) {
          // Process the data to ensure it's in the right format
          const processedData = result.resultData.map((item: any) => ({
            timestamp: item.timestamp,
            reddit: item.reddit !== undefined ? item.reddit : null,
            twitter: item.twitter !== undefined ? item.twitter : null,
            youtube: item.youtube !== undefined ? item.youtube : null
          }));
          
          console.log('Processed sentiment data:', processedData);
          setReportData(processedData);
        } else if (result.resultFileExists) {
          // File exists but no data was returned - this could be a parsing error
          console.error('Result file exists but no data was returned');
          setError('The result file exists but could not be parsed. The file may be corrupted.');
          setReportData(null);
        } else {
          // No result file exists yet
          console.log('No result file exists yet for this report');
          setReportData(null);
        }
      } else {
        console.error('Error loading report data:', result.error);
        setError(result.error || 'Failed to load report data');
        setReportData(null);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('An unexpected error occurred while loading report data');
      setReportData(null);
    }
  };

  // Cancel a report
  const handleCancelReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to cancel this report? This will stop all running scrapers.')) {
      return;
    }
    
    try {
      const result = await window.api.cancelReport(reportId);
      if (result.success) {
        // Refresh the reports list
        setRefreshTrigger(prev => prev + 1);
      } else {
        setError(result.error || 'Failed to cancel report');
      }
    } catch (err) {
      console.error('Error canceling report:', err);
      setError('An unexpected error occurred while canceling the report');
    }
  };

  // Delete a report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await window.api.deleteReport(reportId);
      if (result.success) {
        // Refresh the reports list
        setRefreshTrigger(prev => prev + 1);
        
        // Reset selected report if it was the one that was deleted
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(null);
          setReportData(null);
        }
      } else {
        setError(result.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('An unexpected error occurred while deleting the report');
    }
  };

  // View report details using the new enhanced modal
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    
    // Set up a retry mechanism in case the file is still being processed
    let retryCount = 0;
    const maxRetries = 3;
    
    const tryLoadReportData = async () => {
      await loadReportData(report.id);
      
      if (!reportData && retryCount < maxRetries) {
        retryCount++;
        console.log(`No report data found, retrying (${retryCount}/${maxRetries})...`);
        setTimeout(tryLoadReportData, 2000); // Retry after 2 seconds
      }
    };
    
    tryLoadReportData();
  };

  // Close the report view modal
  const handleCloseReportView = () => {
    setSelectedReport(null);
    setReportData(null);
  };

  // Toggle expanded state for a report
  const toggleExpandReport = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (expandedReports.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  // Navigate to create new report page
  const handleCreateNewReport = () => {
    onNavigate('newReport');
  };

  // Format timestamp to human-readable date
  const formatDate = (timestamp: string | number) => {
    // If the timestamp is a string and not a number, convert it
    const ts = typeof timestamp === 'string' ? 
      timestamp.match(/^\d+$/) ? parseInt(timestamp) : new Date(timestamp).getTime() / 1000 :
      timestamp;
    
    return new Date(ts * 1000).toLocaleString();
  };

  // Calculate duration between two timestamps
  const calculateDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'In progress';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    // Convert to appropriate units
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hours, ${remainingMinutes} minutes`;
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusInfo = statusDisplayMap[status.toLowerCase()] || {
      label: 'Unknown',
      color: '#777',
      icon: <RefreshCw size={16} />
    };
    
    return (
      <div className="status-badge" style={{ backgroundColor: statusInfo.color }}>
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </div>
    );
  };

  // Render platforms included in the report
  const renderPlatformBadges = (platforms: { [key: string]: boolean }) => {
    return (
      <div className="platform-badges">
        {Object.entries(platforms).map(([platform, enabled]) => (
          enabled && (
            <div className="platform-badge" key={platform}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </div>
          )
        ))}
      </div>
    );
  };

  // Render platform status for an expanded report
  const renderPlatformStatus = (platformStatus: ReportPlatformStatus) => {
    return (
      <div className="platform-status-list">
        {Object.entries(platformStatus).map(([platform, status]) => (
          <div className="platform-status-item" key={platform}>
            <div className="platform-name">{platform.charAt(0).toUpperCase() + platform.slice(1)}</div>
            {renderStatusBadge(status)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Analysis Reports</h2>
        <div className="reports-actions">
          <button 
            className="refresh-button" 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            title="Refresh reports list"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            className="create-report-button" 
            onClick={handleCreateNewReport}
          >
            <FileText size={18} />
            New Report
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="reports-list-container">
        {loading ? (
          <div className="loading-indicator">
            <RefreshCw size={24} className="spinning" />
            <span>Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="no-reports">
            <FileText size={48} />
            <p>No reports found</p>
            <button onClick={handleCreateNewReport}>Create your first report</button>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div 
                key={report.id} 
                className={`report-item ${expandedReports.has(report.id) ? 'expanded' : ''}`}
              >
                <div className="report-header" onClick={() => toggleExpandReport(report.id)}>
                  <div className="report-title-section">
                    <ChevronRight size={18} className={`expand-icon ${expandedReports.has(report.id) ? 'rotated' : ''}`} />
                    <div className="report-title">{report.reportName}</div>
                    {renderStatusBadge(report.status)}
                  </div>
                  <div className="report-crypto">{report.cryptoName}</div>
                  <div className="report-date">{formatDate(report.createdAt)}</div>
                </div>
                
                {expandedReports.has(report.id) && (
                  <div className="report-details">
                    <div className="report-info-grid">
                      <div className="report-info-item">
                        <span className="label">Time Range:</span>
                        <span className="value">{formatDate(report.timeRange.startDate)} - {formatDate(report.timeRange.endDate)}</span>
                      </div>
                      <div className="report-info-item">
                        <span className="label">Duration:</span>
                        <span className="value">{calculateDuration(report.createdAt, report.completionTime)}</span>
                      </div>
                      <div className="report-info-item">
                        <span className="label">Platforms:</span>
                        <span className="value">{renderPlatformBadges(report.platforms)}</span>
                      </div>
                      {report.error && (
                        <div className="report-info-item error">
                          <span className="label">Error:</span>
                          <span className="value">{report.error}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="platform-status-section">
                      <h4>Platform Status</h4>
                      {renderPlatformStatus(report.platformStatus)}
                    </div>
                    
                    <div className="report-actions">
                      <button 
                        className="view-button" 
                        onClick={() => handleViewReport(report)}
                        disabled={report.status !== 'completed'}
                      >
                        <Eye size={16} />
                        View Results
                      </button>
                      
                      {(report.status === 'running' || report.status === 'pending') && (
                        <button 
                          className="cancel-button" 
                          onClick={() => handleCancelReport(report.id)}
                        >
                          <XCircle size={16} />
                          Cancel
                        </button>
                      )}
                      
                      <button 
                        className="delete-button" 
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Report Results Modal */}
      {/*selectedReport && reportData && (
        <ReportResultsModal 
          report={selectedReport}
          reportData={reportData}
          onClose={handleCloseReportView}
        />
      )*/}
    </div>
  );
};

export default Reports;