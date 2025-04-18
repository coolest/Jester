// Import required modules
const { electronApp, is, optimizer } = require('@electron-toolkit/utils');
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { join } = require('path');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const chokidar = require('chokidar');
const icon = '../../resources/icon.png?asset';

// Initialize store using async IIFE for cryptocurrencies
let store;
(async () => {
  const { default: ElectronStore } = await import('electron-store');
  store = new ElectronStore({
    name: 'crypto-data',
    defaults: {
      cryptos: []
    }
  });
})();

let reportsStore;
(async () => {
  const { default: ElectronStore } = await import('electron-store');
  reportsStore = new ElectronStore({
    name: 'sentiment-reports',
    defaults: {
      reports: []
    }
  });
})();

// ======================================================================
// REPORT SERVICE IMPLEMENTATION
// ======================================================================

// Status constants
const ReportStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Report Service class to manage report operations
class ReportService {
  constructor() {
    // Create reports directory if it doesn't exist
    this.reportsDir = path.join(app.getPath('userData'), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    
    // Initialize active process tracking
    this.activeProcesses = new Map();
  }

  // Create a new report
  createReport({ cryptoId, cryptoName, startDate, endDate, platforms, reportName }) {
    if (!reportsStore) {
      console.error('Reports store not initialized');
      throw new Error('Reports store not initialized');
    }

    const reportId = uuidv4();
    const now = new Date().toISOString();
    const fileBaseName = `${cryptoName.replace(/\s+/g, '_')}_${startDate}_${endDate}`;
    const resultFilePath = path.join(this.reportsDir, `${fileBaseName}.json`);
    
    const report = {
      id: reportId,
      cryptoId,
      cryptoName,
      reportName,
      timeRange: {
        startDate,
        endDate
      },
      platforms,
      status: ReportStatus.PENDING,
      resultFilePath,
      createdAt: now,
      updatedAt: now,
      completionTime: null,
      platformStatus: Object.fromEntries(
        Object.keys(platforms)
          .filter(platform => platforms[platform])
          .map(platform => [platform, ReportStatus.PENDING])
      ),
      error: null
    };
    
    // Save to store
    const reports = reportsStore.get('reports') || [];
    reports.push(report);
    reportsStore.set('reports', reports);
    
    return report;
  }

  // Get all reports
  getAllReports() {
    if (!reportsStore) {
      console.error('Reports store not initialized');
      return [];
    }
    return reportsStore.get('reports') || [];
  }

  // Get report by ID
  getReportById(reportId) {
    if (!reportsStore) {
      console.error('Reports store not initialized');
      return null;
    }
    const reports = reportsStore.get('reports') || [];
    return reports.find(report => report.id === reportId);
  }

  // Update report status
  updateReportStatus(reportId, status, error = null) {
    if (!reportsStore) {
      console.error('Reports store not initialized');
      return false;
    }

    const reports = reportsStore.get('reports') || [];
    const reportIndex = reports.findIndex(report => report.id === reportId);
    
    if (reportIndex === -1) return false;
    
    reports[reportIndex].status = status;
    reports[reportIndex].updatedAt = new Date().toISOString();
    
    if (error) {
      reports[reportIndex].error = error;
    }
    
    if (status === ReportStatus.COMPLETED || status === ReportStatus.FAILED) {
      reports[reportIndex].completionTime = new Date().toISOString();
    }
    
    reportsStore.set('reports', reports);
    return true;
  }

  // Update platform status for a report
  updatePlatformStatus(reportId, platform, status, error = null) {
    if (!reportsStore) {
      console.error('Reports store not initialized');
      return false;
    }

    const reports = reportsStore.get('reports') || [];
    const reportIndex = reports.findIndex(report => report.id === reportId);
    
    if (reportIndex === -1) return false;
    
    if (reports[reportIndex].platformStatus[platform]) {
      reports[reportIndex].platformStatus[platform] = status;
      reports[reportIndex].updatedAt = new Date().toISOString();
      
      if (error) {
        if (!reports[reportIndex].platformErrors) {
          reports[reportIndex].platformErrors = {};
        }
        reports[reportIndex].platformErrors[platform] = error;
      }
      
      // Check if all platforms are completed or failed
      const allCompleted = Object.values(reports[reportIndex].platformStatus)
        .every(s => s === ReportStatus.COMPLETED || s === ReportStatus.FAILED);
      
      const anyFailed = Object.values(reports[reportIndex].platformStatus)
        .some(s => s === ReportStatus.FAILED);
      
      if (allCompleted) {
        reports[reportIndex].status = anyFailed ? ReportStatus.FAILED : ReportStatus.COMPLETED;
        reports[reportIndex].completionTime = new Date().toISOString();
      }
      
      reportsStore.set('reports', reports);
      return true;
    }
    
    return false;
  }

  // Track an active process
  trackProcess(reportId, platform, process) {
    if (!this.activeProcesses.has(reportId)) {
      this.activeProcesses.set(reportId, new Map());
    }
    this.activeProcesses.get(reportId).set(platform, process);
  }

  // Get active process
  getProcess(reportId, platform) {
    if (this.activeProcesses.has(reportId)) {
      return this.activeProcesses.get(reportId).get(platform);
    }
    return null;
  }

  // Remove tracking for a process
  untrackProcess(reportId, platform) {
    if (this.activeProcesses.has(reportId)) {
      this.activeProcesses.get(reportId).delete(platform);
      if (this.activeProcesses.get(reportId).size === 0) {
        this.activeProcesses.delete(reportId);
      }
    }
  }

  // Kill all processes for a report
  killReportProcesses(reportId) {
    if (this.activeProcesses.has(reportId)) {
      for (const [platform, process] of this.activeProcesses.get(reportId).entries()) {
        try {
          process.kill('SIGTERM');
          this.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, 'Process terminated by user');
        } catch (error) {
          console.error(`Error killing process for ${platform}:`, error);
        }
      }
      this.activeProcesses.delete(reportId);
      this.updateReportStatus(reportId, ReportStatus.FAILED, 'Report generation terminated by user');
    }
  }

  // Delete a report and its result file
  deleteReport(reportId) {
    // First kill any running processes
    if (!reportsStore) {
      console.error('Reports store not initialized');
      return false;
    }

    this.killReportProcesses(reportId);
    
    const reports = reportsStore.get('reports') || [];
    const reportIndex = reports.findIndex(report => report.id === reportId);
    
    if (reportIndex === -1) return false;
    
    // Try to delete the result file
    const filePath = reports[reportIndex].resultFilePath;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Error deleting report file ${filePath}:`, error);
      }
    }
    
    // Remove from store
    reports.splice(reportIndex, 1);
    reportsStore.set('reports', reports);
    
    return true;
  }
}

// ======================================================================
// SCRAPER MANAGER IMPLEMENTATION
// ======================================================================

// Helper function to get path to scrape directory
function getScrapePath() {
  return path.join(__dirname, '..', '..', '..', 'scrape');
}

class ScraperManager {
  constructor(reportService) {
    this.reportService = reportService;
    this.timeouts = new Map(); // Store timeout handlers
    this.logStreams = new Map(); // Track log streams by reportId
    
    // Ensure logs directory exists
    this.logsDir = path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }
  
  getCryptoDetails(cryptoId) {
    try {
      if (!store) {
        console.error('Crypto store not initialized');
        return null;
      }
      
      const cryptos = store.get('cryptos') || [];
      return cryptos.find(crypto => crypto.id === cryptoId);
    } catch (error) {
      console.error('Error getting crypto details:', error);
      return null;
    }
  }

async startReportGeneration(report) {
  const { id: reportId, cryptoId, cryptoName, timeRange, platforms } = report;
  
  // Create log streams
  const mainLogPath = path.join(this.logsDir, `${reportId}.log`);
  const mainLogStream = fs.createWriteStream(mainLogPath, { flags: 'a' });
  
  // Store the stream reference
  this.logStreams.set(reportId, mainLogStream);
  
  // Log start of report generation
  const startMessage = `\n\n========== STARTING REPORT GENERATION ==========\n` +
    `Report ID: ${reportId}\n` +
    `Crypto: ${cryptoName} (${cryptoId})\n` +
    `Time Range: ${new Date(parseInt(timeRange.startDate) * 1000).toISOString()} to ${new Date(parseInt(timeRange.endDate) * 1000).toISOString()}\n` +
    `Platforms: ${Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k).join(', ')}\n` +
    `Started at: ${new Date().toISOString()}\n` +
    `========== END OF HEADER ==========\n\n`;
    
  try {
    this.writeToLog(reportId, startMessage);
    
    // Update report status to running
    this.reportService.updateReportStatus(reportId, ReportStatus.RUNNING);
    
    // Get crypto details for the scrapers
    const cryptos = this.getCryptoDetails(cryptoId);
    if (!cryptos) {
      throw new Error(`Could not find crypto with ID: ${cryptoId}`);
    }
    
    // **** NEW CODE: Ensure a result file exists for this report ****
    // This is crucial for the FileWatcher to correctly identify reports
    const fileWatcher = new FileWatcher(this.reportService);
    const resultFilePath = fileWatcher.ensureResultFileExists(reportId);
    
    if (!resultFilePath) {
      throw new Error(`Failed to create or locate a result file for report ${reportId}`);
    }
    
    this.writeToLog(reportId, `\n[${new Date().toISOString()}] Created result file at: ${resultFilePath}\n`);
    // **** END NEW CODE ****
    
    // Start each selected platform scraper
    const tasks = [];
    
    // Start Reddit scraper if selected
    if (platforms.reddit) {
      tasks.push(this.runRedditScraper(
        reportId, 
        cryptos.subreddit, 
        timeRange.startDate, 
        timeRange.endDate
      ));
    }
    
    // Start Twitter scraper if selected
    if (platforms.twitter) {
      tasks.push(this.runTwitterScraper(
        reportId, 
        cryptos.hashtag, 
        timeRange.startDate, 
        timeRange.endDate
      ));
    }
    
    // Start YouTube scraper if selected
    if (platforms.youtube) {
      tasks.push(this.runYoutubeScraper(
        reportId, 
        cryptos.videoLink, 
        timeRange.startDate, 
        timeRange.endDate
      ));
    }
    
    // Wait for all scrapers to complete
    await Promise.all(tasks);
    
    // All scrapers have completed - close the log stream
    this.writeToLog(reportId, `\n[${new Date().toISOString()}] All scrapers completed successfully.\n`);
    this.closeLogStream(reportId);
    
    return true;
  } catch (error) {
    // Log error
    this.writeToLog(reportId, `\n[${new Date().toISOString()}] ERROR: ${error.message}\n`);
    this.closeLogStream(reportId);
    
    this.reportService.updateReportStatus(reportId, ReportStatus.FAILED, error.message);
    return false;
  }
}
  
  // Helper method for safely writing to log
  writeToLog(reportId, message) {
    try {
      const stream = this.logStreams.get(reportId);
      if (stream && stream.writable) {
        stream.write(message);
      }
    } catch (error) {
      console.error(`Error writing to log for report ${reportId}:`, error);
    }
  }
  
  // Helper method for safely closing log stream
  closeLogStream(reportId) {
    try {
      const stream = this.logStreams.get(reportId);
      if (stream) {
        if (stream.writable) {
          stream.end();
        }
        this.logStreams.delete(reportId);
      }
    } catch (error) {
      console.error(`Error closing log stream for report ${reportId}:`, error);
    }
  }
  
  // Now modify the platform-specific methods to use the centralized logging:
  async runRedditScraper(reportId, subreddit, startTimestamp, endTimestamp) {
  const platform = 'reddit';
  this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.RUNNING);
  
  return new Promise((resolve, reject) => {
    // Log start with more details
    console.log(`Starting Reddit scraper for report ${reportId}, subreddit: ${subreddit}, timeRange: ${startTimestamp}-${endTimestamp}`);
    this.writeToLog(reportId, `\n[${new Date().toISOString()}] Starting Reddit scraper for subreddit: ${subreddit}\n`);
    
    // Get path to Python script
    const scriptPath = path.join(getScrapePath(), 'reddit.py');
    console.log(`Reddit script path: ${scriptPath}`);
    
    if (!fs.existsSync(scriptPath)) {
      const error = new Error(`Reddit scraper script not found at ${scriptPath}`);
      console.error(error.message);
      this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, error.message);
      this.writeToLog(reportId, `ERROR: ${error.message}\n`);
      reject(error);
      return;
    }
    
    // Log command being executed
    const pythonCommand = `python3 ${scriptPath} --reddit=${subreddit} --start=${startTimestamp} --end=${endTimestamp}`;
    console.log(`Executing command: ${pythonCommand}`);
    
    // Spawn Python process with detailed logging
    const pythonProcess = spawn('python3', [
      scriptPath,
      `--reddit=${subreddit}`,
      `--start=${startTimestamp}`,
      `--end=${endTimestamp}`
    ]);
    
    console.log(`Python process spawned with PID: ${pythonProcess.pid}`);
    
    // Track this process
    this.reportService.trackProcess(reportId, platform, pythonProcess);
    
    // Set timeout (30 minutes)
    const timeout = setTimeout(() => {
      console.log(`Reddit scraper timeout triggered for report ${reportId}`);
      this.writeToLog(reportId, `\n[${new Date().toISOString()}] Reddit scraper TIMEOUT after 30 minutes\n`);
      
      try {
        console.log(`Killing Python process ${pythonProcess.pid} due to timeout`);
        pythonProcess.kill('SIGTERM');
      } catch (error) {
        console.error(`Error killing Python process: ${error.message}`);
      }
      
      this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, 'Process timed out after 30 minutes');
      this.reportService.untrackProcess(reportId, platform);
      reject(new Error('Reddit scraper timed out'));
    }, 30 * 60 * 1000);
    
    this.timeouts.set(`${reportId}-${platform}`, timeout);
    
    // Capture stdout with full logging
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Reddit stdout] ${output.trim()}`);
      this.writeToLog(reportId, `[Reddit] ${output}`);
    });
    
    // Capture stderr with full logging
    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[Reddit stderr] ${output.trim()}`);
      this.writeToLog(reportId, `[Reddit ERROR] ${output}`);
    });
    
    // Handle process completion with detailed logging
    pythonProcess.on('close', (code) => {
      console.log(`Reddit scraper process exited with code ${code} for report ${reportId}`);
      
      // Clear timeout
      clearTimeout(this.timeouts.get(`${reportId}-${platform}`));
      this.timeouts.delete(`${reportId}-${platform}`);
      
      // Untrack process
      this.reportService.untrackProcess(reportId, platform);
      
      if (code === 0) {
        console.log(`Reddit scraper completed successfully for report ${reportId}`);
        this.writeToLog(reportId, `\n[${new Date().toISOString()}] Reddit scraper completed successfully\n`);
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.COMPLETED);
        resolve();
      } else {
        const errorMsg = `Reddit scraper exited with code ${code}`;
        console.error(`${errorMsg} for report ${reportId}`);
        this.writeToLog(reportId, `\n[${new Date().toISOString()}] ${errorMsg}\n`);
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, errorMsg);
        reject(new Error(errorMsg));
      }
    });
    
    // Handle unexpected errors with detailed logging
    pythonProcess.on('error', (error) => {
      console.error(`Reddit scraper process error for report ${reportId}: ${error.message}`);
      
      // Clear timeout
      clearTimeout(this.timeouts.get(`${reportId}-${platform}`));
      this.timeouts.delete(`${reportId}-${platform}`);
      
      // Log error
      this.writeToLog(reportId, `\n[${new Date().toISOString()}] Reddit scraper error: ${error.message}\n`);
      
      // Update status
      this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, error.message);
      this.reportService.untrackProcess(reportId, platform);
      
      reject(error);
    });
  });
}

  cleanupAllResources() {
    // Close all log streams
    for (const [reportId, stream] of this.logStreams.entries()) {
      try {
        if (stream.writable) {
          stream.end();
        }
      } catch (error) {
        console.error(`Error closing log stream for report ${reportId}:`, error);
      }
    }
    this.logStreams.clear();
    
    // Clear all timeouts
    for (const timeoutKey of this.timeouts.keys()) {
      clearTimeout(this.timeouts.get(timeoutKey));
    }
    this.timeouts.clear();
  }

  // Run Twitter scraper
  async runTwitterScraper(reportId, hashtag, startTimestamp, endTimestamp, mainLogStream) {
    const platform = 'twitter';
    this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.RUNNING);
    
    return new Promise((resolve, reject) => {
      // Log start
      this.writeToLog(`\n[${new Date().toISOString()}] Starting Twitter scraper for hashtag: ${hashtag}\n`);
      
      // Get path to Python script
      const scriptPath = path.join(getScrapePath(), 'twitter.py');
      
      if (!fs.existsSync(scriptPath)) {
        const error = new Error(`Twitter scraper script not found at ${scriptPath}`);
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, error.message);
        this.writeToLog(`ERROR: ${error.message}\n`);
        reject(error);
        return;
      }
      
      // Spawn Python process
      const pythonProcess = spawn('python3', [
        scriptPath,
        `--hashtag=${hashtag}`,
        `--start=${startTimestamp}`,
        `--end=${endTimestamp}`
      ]);
      
      // Track this process
      this.reportService.trackProcess(reportId, platform, pythonProcess);
      
      // Set timeout (30 minutes)
      const timeout = setTimeout(() => {
        this.writeToLog(`\n[${new Date().toISOString()}] Twitter scraper TIMEOUT after 30 minutes\n`);
        
        try {
          pythonProcess.kill('SIGTERM');
        } catch (error) {
          // Process might already be terminated
        }
        
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, 'Process timed out after 30 minutes');
        this.reportService.untrackProcess(reportId, platform);
        reject(new Error('Twitter scraper timed out'));
      }, 30 * 60 * 1000);
      
      this.timeouts.set(`${reportId}-${platform}`, timeout);
      
      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.writeToLog(`[Twitter] ${output}`);
      });
      
      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        this.writeToLog(`[Twitter ERROR] ${output}`);
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        // Clear timeout
        clearTimeout(this.timeouts.get(`${reportId}-${platform}`));
        this.timeouts.delete(`${reportId}-${platform}`);
        
        // Untrack process
        this.reportService.untrackProcess(reportId, platform);
        
        if (code === 0) {
          this.writeToLog(`\n[${new Date().toISOString()}] Twitter scraper completed successfully\n`);
          this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.COMPLETED);
          resolve();
        } else {
          const errorMsg = `Twitter scraper exited with code ${code}`;
          this.writeToLog(`\n[${new Date().toISOString()}] ${errorMsg}\n`);
          this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, errorMsg);
          reject(new Error(errorMsg));
        }
      });
      
      // Handle unexpected errors
      pythonProcess.on('error', (error) => {
        // Clear timeout
        clearTimeout(this.timeouts.get(`${reportId}-${platform}`));
        this.timeouts.delete(`${reportId}-${platform}`);
        
        // Log error
        this.writeToLog(`\n[${new Date().toISOString()}] Twitter scraper error: ${error.message}\n`);
        
        // Update status
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, error.message);
        this.reportService.untrackProcess(reportId, platform);
        
        reject(error);
      });
    });
  }

  // Run YouTube scraper
  async runYoutubeScraper(reportId, searchTerm, startTimestamp, endTimestamp, mainLogStream) {
    const platform = 'youtube';
    this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.RUNNING);
    
    return new Promise((resolve, reject) => {
      // Log start
      this.writeToLog(`\n[${new Date().toISOString()}] Starting YouTube scraper for search term: ${searchTerm}\n`);
      
      // Get path to Python script
      const scriptPath = path.join(getScrapePath(), 'youtube.py');
      
      if (!fs.existsSync(scriptPath)) {
        const error = new Error(`YouTube scraper script not found at ${scriptPath}`);
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, error.message);
        this.writeToLog(`ERROR: ${error.message}\n`);
        reject(error);
        return;
      }
      
      // Spawn Python process
      const pythonProcess = spawn('python3', [
        scriptPath,
        `--search=${searchTerm}`,
        `--start=${startTimestamp}`,
        `--end=${endTimestamp}`
      ]);
      
      // Track this process
      this.reportService.trackProcess(reportId, platform, pythonProcess);
      
      // Set timeout (30 minutes)
      const timeout = setTimeout(() => {
        this.writeToLog(`\n[${new Date().toISOString()}] YouTube scraper TIMEOUT after 30 minutes\n`);
        
        try {
          pythonProcess.kill('SIGTERM');
        } catch (error) {
          // Process might already be terminated
        }
        
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, 'Process timed out after 30 minutes');
        this.reportService.untrackProcess(reportId, platform);
        reject(new Error('YouTube scraper timed out'));
      }, 30 * 60 * 1000);
      
      this.timeouts.set(`${reportId}-${platform}`, timeout);
      
      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.writeToLog(`[YouTube] ${output}`);
      });
      
      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        this.writeToLog(`[YouTube ERROR] ${output}`);
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        // Clear timeout
        clearTimeout(this.timeouts.get(`${reportId}-${platform}`));
        this.timeouts.delete(`${reportId}-${platform}`);
        
        // Untrack process
        this.reportService.untrackProcess(reportId, platform);
        
        if (code === 0) {
          this.writeToLog(`\n[${new Date().toISOString()}] YouTube scraper completed successfully\n`);
          this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.COMPLETED);
          resolve();
        } else {
          const errorMsg = `YouTube scraper exited with code ${code}`;
          this.writeToLog(`\n[${new Date().toISOString()}] ${errorMsg}\n`);
          this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, errorMsg);
          reject(new Error(errorMsg));
        }
      });
      
      // Handle unexpected errors
      pythonProcess.on('error', (error) => {
        // Clear timeout
        clearTimeout(this.timeouts.get(`${reportId}-${platform}`));
        this.timeouts.delete(`${reportId}-${platform}`);
        
        // Log error
        this.writeToLog(`\n[${new Date().toISOString()}] YouTube scraper error: ${error.message}\n`);
        
        // Update status
        this.reportService.updatePlatformStatus(reportId, platform, ReportStatus.FAILED, error.message);
        this.reportService.untrackProcess(reportId, platform);
        
        reject(error);
      });
    });
  }

  // Cancel a running report
  cancelReport(reportId) {
    // Clear any timeouts
    for (const platform of ['reddit', 'twitter', 'youtube']) {
      const timeoutKey = `${reportId}-${platform}`;
      if (this.timeouts.has(timeoutKey)) {
        clearTimeout(this.timeouts.get(timeoutKey));
        this.timeouts.delete(timeoutKey);
      }
    }
    
    // Kill all processes for this report
    this.reportService.killReportProcesses(reportId);
    
    return true;
  }
}
// ======================================================================
// FILE WATCHER IMPLEMENTATION
// ======================================================================

class FileWatcher {
  constructor(reportService) {
    this.reportService = reportService;
    this.reportsDir = path.join(app.getPath('userData'), 'reports');
    this.watcher = null;
    this.activeMerges = new Set(); // Track which reports are currently being merged
  }

  // Start watching for file changes
  startWatching() {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    // Create a watcher for the reports directory
    this.watcher = chokidar.watch(this.reportsDir, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    // Watch for file additions or changes
    this.watcher.on('add', (filePath) => this.handleFileChange(filePath));
    this.watcher.on('change', (filePath) => this.handleFileChange(filePath));

    console.log(`Watching for file changes in ${this.reportsDir}`);
    return this;
  }

  // Stop watching
  stopWatching() {
    if (this.watcher) {
      this.watcher.close().then(() => {
        console.log('File watcher stopped');
      });
    }
  }

  // Handle file changes
  async handleFileChange(filePath) {
    // Only process JSON files
    if (!filePath.endsWith('.json')) return;

    const fileName = path.basename(filePath);
    console.log(`File change detected: ${fileName}`);

    try {
      // Get all reports that might match this file
      const reports = this.reportService.getAllReports();
      
      // Try to parse filename to extract crypto name and timestamps
      const fileInfo = this.parseResultFileName(fileName);
      if (!fileInfo) {
        console.log(`Could not parse filename: ${fileName}`);
        return;
      }
      
      console.log(`Parsed file info:`, fileInfo);
      
      // Find matching reports based on timestamps
      const matchingReports = reports.filter(report => {
        // Convert to string and compare to handle potential type mismatches
        const reportStartStr = report.timeRange.startDate.toString();
        const reportEndStr = report.timeRange.endDate.toString();
        const fileStartStr = fileInfo.startTimestamp.toString();
        const fileEndStr = fileInfo.endTimestamp.toString();
        
        // Check if timestamps match
        const timestampsMatch = reportStartStr === fileStartStr && reportEndStr === fileEndStr;
        
        // If timestamps match, also check crypto name if available
        if (timestampsMatch && fileInfo.cryptoName) {
          // Normalize both names (lowercase, remove special chars) for comparison
          const normalizedReportName = report.cryptoName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedFileName = fileInfo.cryptoName.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Check if names are similar
          return normalizedReportName.includes(normalizedFileName) || 
                 normalizedFileName.includes(normalizedReportName);
        }
        
        return timestampsMatch;
      });

      if (matchingReports.length === 0) {
        console.log(`No matching reports found for file: ${fileName}`);
        return;
      }

      console.log(`Found ${matchingReports.length} matching reports for file: ${fileName}`);
      
      // Process each matching report
      for (const report of matchingReports) {
        // Update the report resultFilePath to match this file (ensures future lookups work)
        this.updateReportFilePath(report.id, filePath);
        
        // Process the file content for this report
        await this.processReportFile(report.id, filePath);
      }
    } catch (error) {
      console.error(`Error processing file change for ${fileName}:`, error);
    }
  }

  // Parse a result filename to extract information
  parseResultFileName(fileName) {
    // Expected format: CryptoName_startTimestamp_endTimestamp.json
    // But could also be just startTimestamp_endTimestamp.json
    
    if (!fileName.endsWith('.json')) return null;
    
    const parts = fileName.replace('.json', '').split('_');
    
    // Must have at least two parts (the timestamps)
    if (parts.length < 2) return null;
    
    // Try to parse last two parts as timestamps
    const endTimestamp = parseInt(parts[parts.length - 1], 10);
    const startTimestamp = parseInt(parts[parts.length - 2], 10);
    
    // Verify we got valid timestamps
    if (isNaN(startTimestamp) || isNaN(endTimestamp)) return null;
    
    // Extract crypto name if present (everything before the timestamps)
    let cryptoName = null;
    if (parts.length > 2) {
      cryptoName = parts.slice(0, parts.length - 2).join('_');
    }
    
    return {
      cryptoName,
      startTimestamp,
      endTimestamp
    };
  }

  // Update a report's resultFilePath
  updateReportFilePath(reportId, filePath) {
    try {
      // Get the report
      const report = this.reportService.getReportById(reportId);
      if (!report) return false;
      
      // Check if the path is already correct
      if (report.resultFilePath === filePath) return true;
      
      console.log(`Updating report ${reportId} resultFilePath to ${filePath}`);
      
      // Get all reports to find and update the matching one
      const reports = reportsStore.get('reports') || [];
      const reportIndex = reports.findIndex(r => r.id === reportId);
      
      if (reportIndex === -1) return false;
      
      // Update the path
      reports[reportIndex].resultFilePath = filePath;
      reportsStore.set('reports', reports);
      
      return true;
    } catch (error) {
      console.error(`Error updating report file path for ${reportId}:`, error);
      return false;
    }
  }

  // Process a report file
  async processReportFile(reportId, filePath) {
    // Check if this report is already being processed
    if (this.activeMerges.has(reportId)) {
      return;
    }

    this.activeMerges.add(reportId);

    try {
      const report = this.reportService.getReportById(reportId);
      if (!report) {
        console.error(`Report not found for ID: ${reportId}`);
        this.activeMerges.delete(reportId);
        return;
      }

      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let sentimentData;

      try {
        sentimentData = JSON.parse(fileContent);
      } catch (error) {
        console.error(`Error parsing JSON from ${filePath}:`, error);
        this.reportService.updatePlatformStatus(reportId, 'reddit', ReportStatus.FAILED, `Error parsing result file: ${error.message}`);
        this.activeMerges.delete(reportId);
        return;
      }

      // Validate the data format
      if (!Array.isArray(sentimentData)) {
        console.error(`Invalid data format in ${filePath}: Expected an array`);
        this.reportService.updatePlatformStatus(reportId, 'reddit', ReportStatus.FAILED, 'Invalid data format: Expected an array');
        this.activeMerges.delete(reportId);
        return;
      }

      // Check platform statuses to see what data we have
      const platformsCompleted = [];
      
      // Check for each platform if there's data in the file
      const hasRedditData = sentimentData.some(day => day.reddit !== null);
      const hasTwitterData = sentimentData.some(day => day.twitter !== null);
      const hasYoutubeData = sentimentData.some(day => day.youtube !== null);
      
      // Update platform statuses based on data presence
      if (hasRedditData && report.platforms.reddit) {
        this.reportService.updatePlatformStatus(reportId, 'reddit', ReportStatus.COMPLETED);
        platformsCompleted.push('reddit');
      }
      
      if (hasTwitterData && report.platforms.twitter) {
        this.reportService.updatePlatformStatus(reportId, 'twitter', ReportStatus.COMPLETED);
        platformsCompleted.push('twitter');
      }
      
      if (hasYoutubeData && report.platforms.youtube) {
        this.reportService.updatePlatformStatus(reportId, 'youtube', ReportStatus.COMPLETED);
        platformsCompleted.push('youtube');
      }
      
      console.log(`Report ${reportId} has data for platforms: ${platformsCompleted.join(', ')}`);

      // Check if all requested platforms are completed
      const allRequested = Object.entries(report.platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => platform);
      
      const allCompleted = allRequested.every(platform => platformsCompleted.includes(platform));
      
      // Update overall report status
      if (allCompleted) {
        this.reportService.updateReportStatus(reportId, ReportStatus.COMPLETED);
        console.log(`Report ${reportId} marked as completed`);
      }

      console.log(`Processed file for report ${reportId}`);
    } catch (error) {
      console.error(`Error processing report file for ${reportId}:`, error);
      this.reportService.updateReportStatus(reportId, ReportStatus.FAILED, `Error processing result file: ${error.message}`);
    } finally {
      this.activeMerges.delete(reportId);
    }
  }

  // Create a combined result file from platform-specific results
  createCombinedResultFile(reportId) {
    const report = this.reportService.getReportById(reportId);
    if (!report) {
      console.error(`Report not found for ID: ${reportId}`);
      return false;
    }

    try {
      // Generate filename
      const fileBaseName = `${report.cryptoName.replace(/\s+/g, '_')}_${report.timeRange.startDate}_${report.timeRange.endDate}`;
      const filePath = path.join(this.reportsDir, `${fileBaseName}.json`);
      
      // Create an array of data points with the expected format
      const resultData = [];
      
      // Calculate the number of days in the time range
      const startDate = parseInt(report.timeRange.startDate);
      const endDate = parseInt(report.timeRange.endDate);
      const dayDuration = 86400; // Seconds in a day
      
      // Ensure we're working with start-of-day timestamps
      const alignedStartDate = startDate - (startDate % dayDuration);
      
      // Generate entries for each day in the range
      for (let timestamp = alignedStartDate; timestamp < endDate; timestamp += dayDuration) {
        resultData.push({
          timestamp,
          youtube: null,
          twitter: null,
          reddit: null
        });
      }
      
      // Make sure the directory exists
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }
      
      // Write the initial combined file
      fs.writeFileSync(filePath, JSON.stringify(resultData, null, 2));
      
      // Update the report to reference this file
      this.updateReportFilePath(reportId, filePath);
      
      console.log(`Created combined result file for report ${reportId}: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Error creating combined result file for ${reportId}:`, error);
      return null;
    }
  }

  // Ensure a result file exists for a report
  ensureResultFileExists(reportId) {
    const report = this.reportService.getReportById(reportId);
    if (!report) {
      console.error(`Report not found for ID: ${reportId}`);
      return null;
    }
    
    // Check if the report already has a valid result file
    if (report.resultFilePath && fs.existsSync(report.resultFilePath)) {
      return report.resultFilePath;
    }
    
    // Create a new result file
    return this.createCombinedResultFile(reportId);
  }

  // Merge platform result data into the combined file
  mergePlatformData(reportId, platform, platformData) {
    const report = this.reportService.getReportById(reportId);
    if (!report) {
      console.error(`Report not found for ID: ${reportId}`);
      return false;
    }

    try {
      // Ensure we have a result file
      const filePath = this.ensureResultFileExists(reportId);
      if (!filePath) {
        console.error(`Could not create result file for report ${reportId}`);
        return false;
      }
      
      // Read current combined file
      let combinedData = [];
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        combinedData = JSON.parse(fileContent);
      } catch (error) {
        console.error(`Error reading result file for ${reportId}:`, error);
        return false;
      }

      // Merge the platform data
      for (const entry of platformData) {
        const matchingDay = combinedData.find(day => day.timestamp === entry.timestamp);
        if (matchingDay) {
          matchingDay[platform] = entry[platform] || entry.score;
        }
      }

      // Write the updated data back to the file
      fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
      
      console.log(`Merged ${platform} data for report ${reportId}`);
      return true;
    } catch (error) {
      console.error(`Error merging platform data for ${reportId}:`, error);
      return false;
    }
  }
}

// ======================================================================
// REPORT SERVICES INTEGRATION AND INITIALIZATION
// ======================================================================

// Initialize service instances
let reportService;
let scraperManager;
let fileWatcher;

// Function to initialize report services
let reportServiceReady = false;

// Initialize report services
async function initReportServices() {
  // Wait for stores to be initialized before creating services
  let waitCount = 0;
  while ((!store || !reportsStore) && waitCount < 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    waitCount++;
  }
  
  if (!store || !reportsStore) {
    console.error('Stores not initialized after waiting');
    return;
  }

  if (!reportService) {
    reportService = new ReportService();
    
    // Initialize scraper manager with report service
    scraperManager = new ScraperManager(reportService);
    
    // Initialize and start file watcher
    fileWatcher = new FileWatcher(reportService);
    fileWatcher.startWatching();
    
    console.log('Report services initialized');
    
    // Resume any pending reports
    resumePendingReports();
  }
}

// Resume any pending reports from previous session
async function resumePendingReports() {
  const reports = reportService.getAllReports();
  
  // Find reports that were running when app was closed
  const pendingReports = reports.filter(report => 
    report.status === ReportStatus.RUNNING || report.status === ReportStatus.PENDING);
  
  console.log(`Found ${pendingReports.length} pending reports`);
  
  // For each pending report, restart it if needed
  for (const report of pendingReports) {
    // Check if result file exists
    const fileExists = fs.existsSync(report.resultFilePath);
    
    if (report.status === ReportStatus.RUNNING || 
        (report.status === ReportStatus.PENDING && !fileExists)) {
      console.log(`Resuming report ${report.id} (${report.reportName})`);
      
      // Set a small delay between starting reports to avoid overloading
      setTimeout(() => {
        scraperManager.startReportGeneration(report)
          .catch(error => {
            console.error(`Error resuming report ${report.id}:`, error);
          });
      }, 5000); // Start with a 5-second delay between reports
    }
  }
}

// ======================================================================
// EXISTING ELECTRON IPCMAIN HANDLERS
// ======================================================================

ipcMain.handle('add-crypto', async (_event, cryptoData) => {
  console.log('Main process received add-crypto request');
  try {
    if (!store) {
      throw new Error('Store not initialized');
    }

    const newCrypto = {
      id: Date.now().toString(),
      ...cryptoData,
      createdAt: new Date().toISOString()
    };

    const currentCryptos = store.get('cryptos') || [];
    currentCryptos.push(newCrypto);
    store.set('cryptos', currentCryptos);

    return { success: true, data: newCrypto };
  } catch (error) {
    console.error('Error in add-crypto handler:', error);
    throw error;
  }
});

ipcMain.handle('get-cryptos', () => {
  try {
    if (!store) {
      throw new Error('Store not initialized');
    }
    return store.get('cryptos') || [];
  } catch (error) {
    console.error('Error getting cryptos:', error);
    return [];
  }
});

ipcMain.handle('delete-crypto', (_event, id) => {
  try {
    if (!store) {
      throw new Error('Store not initialized');
    }
    const currentCryptos = store.get('cryptos') || [];
    const updatedCryptos = currentCryptos.filter(crypto => crypto.id !== id);
    store.set('cryptos', updatedCryptos);
    return { success: true };
  } catch (error) {
    console.error('Error deleting crypto:', error);
    throw error;
  }
});

ipcMain.handle('get-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settingsData);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

// Environment variable management
ipcMain.handle('get-env-variables', async () => {
  try {
    // Path to .env file using the helper function
    const scrapePath = getScrapePath();
    const envPath = path.join(scrapePath, '.env');
    
    console.log('Loading .env from path:', envPath);
    
    if (fs.existsSync(envPath)) {
      // Read and parse .env file
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = dotenv.parse(envContent);
      return envVars;
    }
    
    return {};
  } catch (error) {
    console.error('Error getting env variables:', error);
    throw error;
  }
});

ipcMain.handle('update-env-file', async (event, envVars) => {
  try {
    // Path to .env file using the helper function
    const scrapePath = getScrapePath();
    const envPath = path.join(scrapePath, '.env');
    
    console.log('Saving .env to path:', envPath);
    
    // Format env vars into string
    let envContent = '';
    for (const [key, value] of Object.entries(envVars)) {
      envContent += `${key}=${value}\n`;
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent);
    
    return true;
  } catch (error) {
    console.error('Error updating env file:', error);
    throw error;
  }
});

// Database auth file management
ipcMain.handle('save-db-auth-file', async (event, fileContent) => {
  try {
    // Path to db_auth.json file using the helper function
    const scrapePath = getScrapePath();
    const dbAuthPath = path.join(scrapePath, 'db_auth.json');
    
    console.log('Saving db_auth.json to path:', dbAuthPath);
    
    // Save file
    fs.writeFileSync(dbAuthPath, fileContent);
    
    return true;
  } catch (error) {
    console.error('Error saving db auth file:', error);
    throw error;
  }
});

ipcMain.handle('check-db-auth-exists', async () => {
  try {
    // Path to db_auth.json file using the helper function
    const scrapePath = getScrapePath();
    const dbAuthPath = path.join(scrapePath, 'db_auth.json');
    
    return fs.existsSync(dbAuthPath);
  } catch (error) {
    console.error('Error checking db auth file existence:', error);
    throw error;
  }
});

// Connection testing
ipcMain.handle('test-reddit-connection', async (event, credentials) => {
  return new Promise((resolve, reject) => {
    // Save credentials to a temporary env file
    const tempEnvPath = path.join(app.getPath('temp'), 'reddit-test.env');
    const envContent = `
      REDDIT_CLIENT_ID=${credentials.clientId}
      REDDIT_CLIENT_SECRET=${credentials.clientSecret}
      REDDIT_USERNAME=${credentials.username}
      REDDIT_PASSWORD=${credentials.password}
    `;
    
    fs.writeFileSync(tempEnvPath, envContent);
    
    // Run a test script that uses these credentials using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-reddit-connection.js');
    
    exec(`node ${testScript} --env-file=${tempEnvPath}`, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempEnvPath);
      } catch (e) {
        console.error('Error deleting temporary env file:', e);
      }
      
      if (error) {
        console.error(`Error testing Reddit connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('test-twitter-connection', async (event, credentials) => {
  return new Promise((resolve, reject) => {
    // Save credentials to a temporary env file
    const tempEnvPath = path.join(app.getPath('temp'), 'twitter-test.env');
    const envContent = `
      X_API_KEY=${credentials.apiKey}
      X_API_KEY_SECRET=${credentials.apiKeySecret}
      X_ACCESS_TOKEN=${credentials.accessToken}
      X_ACCESS_TOKEN_SECRET=${credentials.accessTokenSecret}
    `;
    
    fs.writeFileSync(tempEnvPath, envContent);
    
    // Run a test script that uses these credentials using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-twitter-connection.js');
    
    exec(`node ${testScript} --env-file=${tempEnvPath}`, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempEnvPath);
      } catch (e) {
        console.error('Error deleting temporary env file:', e);
      }
      
      if (error) {
        console.error(`Error testing Twitter connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('test-youtube-connection', async (event, credentials) => {
  return new Promise((resolve, reject) => {
    // Save credentials to a temporary env file
    const tempEnvPath = path.join(app.getPath('temp'), 'youtube-test.env');
    const envContent = `YT_KEY=${credentials.apiKey}`;
    
    fs.writeFileSync(tempEnvPath, envContent);
    
    // Run a test script that uses these credentials using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-youtube-connection.js');
    
    exec(`node ${testScript} --env-file=${tempEnvPath}`, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempEnvPath);
      } catch (e) {
        console.error('Error deleting temporary env file:', e);
      }
      
      if (error) {
        console.error(`Error testing YouTube connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('test-database-connection', async () => {
  return new Promise((resolve, reject) => {
    // Run a test script that uses the db_auth.json file using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-database-connection.js');
    
    exec(`node ${testScript}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error testing database connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

// ======================================================================
// NEW REPORT IPC HANDLERS
// ======================================================================

// Create a new report
ipcMain.handle('create-report', async (event, reportData) => {
  try {
    // Convert date strings to timestamps if needed
    if (typeof reportData.startDate === 'string' && !reportData.startDate.match(/^\d+$/)) {
      reportData.startDate = Math.floor(new Date(reportData.startDate).getTime() / 1000);
    }
    if (typeof reportData.endDate === 'string' && !reportData.endDate.match(/^\d+$/)) {
      reportData.endDate = Math.floor(new Date(reportData.endDate).getTime() / 1000);
    }
    
    // Create the report
    const report = reportService.createReport({
      cryptoId: reportData.cryptoId,
      cryptoName: reportData.cryptoName,
      reportName: reportData.reportName,
      startDate: reportData.startDate,
      endDate: reportData.endDate,
      platforms: reportData.platforms
    });
    
    // Start the report generation
    scraperManager.startReportGeneration(report)
      .catch(error => {
        console.error(`Error generating report ${report.id}:`, error);
      });
    
    return { success: true, reportId: report.id };
  } catch (error) {
    console.error('Error creating report:', error);
    return { success: false, error: error.message };
  }
});

// Get all reports
ipcMain.handle('get-reports', async () => {
  try {
    const reports = reportService.getAllReports();
    return { success: true, reports };
  } catch (error) {
    console.error('Error getting reports:', error);
    return { success: false, error: error.message };
  }
});

// Get report by ID
ipcMain.handle('get-report', async (event, reportId) => {
  try {
    console.log(`Loading report with ID: ${reportId}`);
    const report = reportService.getReportById(reportId);
    
    if (!report) {
      console.error(`Report not found with ID: ${reportId}`);
      return { success: false, error: 'Report not found' };
    }
    
    // Log the report object for debugging
    console.log(`Report found:`, {
      id: report.id,
      name: report.reportName,
      filePath: report.resultFilePath
    });
    
    // Check if the result file exists
    const resultFileExists = report.resultFilePath && fs.existsSync(report.resultFilePath);
    console.log(`Result file exists: ${resultFileExists}`);
    
    let resultData = null;
    
    if (resultFileExists) {
      try {
        // Read and parse the result file
        const fileContent = fs.readFileSync(report.resultFilePath, 'utf8');
        console.log(`Read file content (first 100 chars): ${fileContent.substring(0, 100)}`);
        
        resultData = JSON.parse(fileContent);
        console.log(`Parsed result data: ${resultData.length} entries`);
        
        // Validate the data structure
        if (!Array.isArray(resultData)) {
          console.error(`Invalid result data format: expected array, got ${typeof resultData}`);
          resultData = []; // Return empty array instead of null for consistent interface
        }
      } catch (error) {
        console.error(`Error reading or parsing result file for ${reportId}:`, error);
        return { 
          success: false, 
          error: `Error reading result file: ${error.message}`,
          report,
          resultFileExists
        };
      }
    } else if (report.status === ReportStatus.COMPLETED || 
               (report.status === ReportStatus.RUNNING && 
                Object.values(report.platformStatus).some(status => status === ReportStatus.COMPLETED))) {
      // If the report is marked as completed but file doesn't exist, or some platforms are completed
      // Create a file watcher instance
      const fileWatcher = new FileWatcher(reportService);
      
      // Create a new result file
      const filePath = fileWatcher.createCombinedResultFile(reportId);
      
      if (filePath) {
        console.log(`Created new result file at ${filePath}`);
        
        // Read the newly created file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        resultData = JSON.parse(fileContent);
      }
    }
    
    return { 
      success: true, 
      report,
      resultData,
      resultFileExists: resultFileExists || (resultData !== null)
    };
  } catch (error) {
    console.error('Error getting report:', error);
    return { success: false, error: error.message };
  }
});

// Cancel a report
ipcMain.handle('cancel-report', async (event, reportId) => {
  try {
    const result = scraperManager.cancelReport(reportId);
    return { success: result };
  } catch (error) {
    console.error('Error canceling report:', error);
    return { success: false, error: error.message };
  }
});

// Delete a report
ipcMain.handle('delete-report', async (event, reportId) => {
  try {
    const result = reportService.deleteReport(reportId);
    return { success: result };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, error: error.message };
  }
});

// Get log file for a report
ipcMain.handle('get-report-log', async (event, reportId) => {
  try {
    const logPath = path.join(app.getPath('userData'), 'logs', `${reportId}.log`);
    
    if (!fs.existsSync(logPath)) {
      return { success: false, error: 'Log file not found' };
    }
    
    const logContent = fs.readFileSync(logPath, 'utf8');
    return { success: true, logContent };
  } catch (error) {
    console.error('Error getting report log:', error);
    return { success: false, error: error.message };
  }
});

// ======================================================================
// EXISTING ELECTRON APP LIFECYCLE HANDLERS
// ======================================================================

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,

    minWidth: 600,
    minHeight: 447,

    show: false,
    autoHideMenuBar: true,
    center: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    ...(process.platform !== 'darwin' ? { icon } : {}),
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    titleBarOverlay: {
      color: '#100f14',
      symbolColor: '#bdbdbd',
      height: 35
    },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize store first
  const { default: ElectronStore } = await import('electron-store');
  store = new ElectronStore({
    name: 'crypto-data',
    defaults: {
      cryptos: []
    }
  });

  // Initialize report services
  await initReportServices();

  // Then continue with the rest
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Handle app exit - try to close resources properly
app.on('will-quit', () => {
  if (fileWatcher) {
    fileWatcher.stopWatching();
  }

  if (scraperManager) {
    scraperManager.cleanupAllResources();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.