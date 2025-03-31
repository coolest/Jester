import React, { useState, useEffect, useRef } from 'react';
import '../../../assets/components/main/pages/Settings.css';

interface ApiSettings {
  apiKey: string;
  refreshInterval: number;
  maxResults: number;
}

interface UiSettings {
  theme: string;
  language: string;
  compactView: boolean;
}

interface DataSourceSettings {
  enableReddit: boolean;
  enableTwitter: boolean;
  enableYoutube: boolean;
  redditPostsToAnalyze: number;
  twitterPostsToAnalyze: number;
  youtubeVideosToAnalyze: number;
}

// Authentication interfaces
interface RedditAuth {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface TwitterAuth {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

interface YoutubeAuth {
  apiKey: string;
}

const Settings: React.FC = () => {
  // API settings
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    refreshInterval: 30,
    maxResults: 100
  });
  
  // UI settings
  const [uiSettings, setUiSettings] = useState<UiSettings>({
    theme: 'light',
    language: 'en',
    compactView: false
  });
  
  // Data source settings
  const [dataSourceSettings, setDataSourceSettings] = useState<DataSourceSettings>({
    enableReddit: true,
    enableTwitter: true,
    enableYoutube: true,
    redditPostsToAnalyze: 100,
    twitterPostsToAnalyze: 200,
    youtubeVideosToAnalyze: 50
  });

  // Authentication settings
  const [redditAuth, setRedditAuth] = useState<RedditAuth>({
    clientId: '',
    clientSecret: '',
    username: '',
    password: ''
  });

  const [twitterAuth, setTwitterAuth] = useState<TwitterAuth>({
    apiKey: '',
    apiKeySecret: '',
    accessToken: '',
    accessTokenSecret: ''
  });

  const [youtubeAuth, setYoutubeAuth] = useState<YoutubeAuth>({
    apiKey: ''
  });

  const [dbAuthFile, setDbAuthFile] = useState<File | null>(null);
  const [dbAuthFileName, setDbAuthFileName] = useState<string>('');

  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [cryptoCount, setCryptoCount] = useState<number>(0);
  const [showSection, setShowSection] = useState<string>('general');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load settings and crypto count on component mount
  useEffect(() => {
    const loadSettings = async () => {
      console.log('Loading settings...');
      
      try {
        // Load crypto count
        const loadedCryptos = await window.api.getCryptos();
        setCryptoCount(loadedCryptos.length);
        
        // Load saved settings 
        const savedSettings = await window.api.getSettings();
        if (savedSettings) {
          if (savedSettings.apiSettings) setApiSettings(savedSettings.apiSettings);
          if (savedSettings.uiSettings) setUiSettings(savedSettings.uiSettings);
          if (savedSettings.dataSourceSettings) setDataSourceSettings(savedSettings.dataSourceSettings);
        }
        
        // Load environment variables through an IPC call
        const envVars = await window.api.getEnvVariables();
        
        if (envVars) {
          // Load Reddit credentials
          setRedditAuth({
            clientId: envVars.REDDIT_CLIENT_ID || '',
            clientSecret: envVars.REDDIT_CLIENT_SECRET || '',
            username: envVars.REDDIT_USERNAME || '',
            password: envVars.REDDIT_PASSWORD || ''
          });
          
          // Load Twitter credentials
          setTwitterAuth({
            apiKey: envVars.X_API_KEY || '',
            apiKeySecret: envVars.X_API_KEY_SECRET || '',
            accessToken: envVars.X_ACCESS_TOKEN || '',
            accessTokenSecret: envVars.X_ACCESS_TOKEN_SECRET || ''
          });
          
          // Load YouTube credentials
          setYoutubeAuth({
            apiKey: envVars.YT_KEY || ''
          });
        }
        
        // Check if DB auth file exists
        const dbAuthExists = await window.api.checkDbAuthExists();
        if (dbAuthExists) {
          setDbAuthFileName('db_auth.json (File Exists)');
        }
        
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Handle API settings changes
  const handleApiSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const parsedValue = type === 'number' ? parseInt(value, 10) : value;
    
    setApiSettings(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };
  
  // Handle UI settings changes
  const handleUiSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? checked : value;
    
    setUiSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Handle data source settings changes
  const handleDataSourceSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value;
    
    setDataSourceSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Handle Reddit auth changes
  const handleRedditAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRedditAuth(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Twitter auth changes
  const handleTwitterAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTwitterAuth(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle YouTube auth changes
  const handleYoutubeAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setYoutubeAuth(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle DB auth file upload
  const handleDbAuthFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setDbAuthFile(file);
        setDbAuthFileName(file.name);
      } else {
        alert('Please upload a valid JSON file.');
        e.target.value = '';
      }
    }
  };
  
  // Generate a new API key
  const handleGenerateNewApiKey = () => {
    const newKey = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    });
    
    setApiSettings(prev => ({
      ...prev,
      apiKey: newKey
    }));
    
    setShowApiKey(true);
  };
  
  // Save all settings
  const handleSaveSettings = async () => {
    // Save credentials to environment or config
    try {
      // Create an object to store environment variables
      const envVars: Record<string, string> = {};
      
      // Add debug and test mode from existing .env
      envVars['DEBUG_MODE'] = '1';
      envVars['TEST_MODE'] = 'test111111';
      
      // 1. Save Reddit credentials
      if (dataSourceSettings.enableReddit) {
        console.log('Saving Reddit credentials');
        envVars['REDDIT_CLIENT_ID'] = redditAuth.clientId;
        envVars['REDDIT_CLIENT_SECRET'] = redditAuth.clientSecret;
        envVars['REDDIT_USERNAME'] = redditAuth.username;
        envVars['REDDIT_PASSWORD'] = redditAuth.password;
      }

      // 2. Save Twitter credentials
      if (dataSourceSettings.enableTwitter) {
        console.log('Saving Twitter credentials');
        envVars['X_API_KEY'] = twitterAuth.apiKey;
        envVars['X_API_KEY_SECRET'] = twitterAuth.apiKeySecret;
        envVars['X_ACCESS_TOKEN'] = twitterAuth.accessToken;
        envVars['X_ACCESS_TOKEN_SECRET'] = twitterAuth.accessTokenSecret;
      }

      // 3. Save YouTube credentials
      if (dataSourceSettings.enableYoutube) {
        console.log('Saving YouTube credentials');
        envVars['YT_KEY'] = youtubeAuth.apiKey;
      }

      // 4. Update the .env file through the Electron main process
      // This is a custom IPC call we need to implement in preload.js and main.js
      await window.api.updateEnvFile(envVars);
      
      // 5. Save DB auth file
      if (dbAuthFile) {
        console.log('Saving DB auth file to /scrape/db_auth.json');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileContent = e.target?.result as string;
          try {
            // Validate JSON format
            JSON.parse(fileContent);
            
            // Save the file to the appropriate location
            await window.api.saveDbAuthFile(fileContent);
            console.log('DB auth file saved successfully');
          } catch (error) {
            console.error('Invalid JSON file:', error);
            setSaveStatus('Error: Invalid JSON file format');
            return;
          }
        };
        reader.readAsText(dbAuthFile);
      }

      // 6. Save general settings
      console.log('Saving general settings');
      await window.api.saveSettings({ 
        apiSettings, 
        uiSettings, 
        dataSourceSettings 
      });

      setSaveStatus('Settings saved successfully! Credentials updated in .env and db_auth.json.');
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Error saving settings. Please try again.');
    }
    
    // Clear status message after 5 seconds
    setTimeout(() => {
      setSaveStatus('');
    }, 5000);
  };
  
  // Reset settings to defaults
  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setApiSettings({
        apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        refreshInterval: 30,
        maxResults: 100
      });
      
      setUiSettings({
        theme: 'light',
        language: 'en',
        compactView: false
      });
      
      setDataSourceSettings({
        enableReddit: true,
        enableTwitter: true,
        enableYoutube: true,
        redditPostsToAnalyze: 100,
        twitterPostsToAnalyze: 200,
        youtubeVideosToAnalyze: 50
      });

      // Reset auth credentials
      setRedditAuth({
        clientId: '',
        clientSecret: '',
        username: '',
        password: ''
      });

      setTwitterAuth({
        apiKey: '',
        apiKeySecret: '',
        accessToken: '',
        accessTokenSecret: ''
      });

      setYoutubeAuth({
        apiKey: ''
      });

      setDbAuthFile(null);
      setDbAuthFileName('');
      
      setSaveStatus('Settings reset to defaults!');
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    }
  };
  
  // Clear application data
  const handleClearData = () => {
    if (confirm('Are you sure you want to delete all cryptocurrency data? This action cannot be undone.')) {
      // In a real app, you'd clear the data from your database or storage
      console.log('Clearing all crypto data...');
      
      // Display confirmation
      alert('All cryptocurrency data has been cleared.');
    }
  };

  // Test connections to APIs
  const testConnection = async (service: 'reddit' | 'twitter' | 'youtube' | 'database') => {
    setSaveStatus(`Testing connection to ${service}...`);
    
    try {
      // In a real app, this would actually test the connection
      // Example: const result = await window.api.testConnection(service, credentials);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Random success/failure for demo
      const success = Math.random() > 0.3;
      
      if (success) {
        setSaveStatus(`Successfully connected to ${service}!`);
      } else {
        setSaveStatus(`Failed to connect to ${service}. Please check your credentials.`);
      }
    } catch (error) {
      console.error(`Error testing connection to ${service}:`, error);
      setSaveStatus(`Error testing connection to ${service}.`);
    }
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setSaveStatus('');
    }, 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Application Settings</h2>
        <div className="statistics-badge">
          {cryptoCount} Cryptocurrencies Tracked
        </div>
      </div>
      
      {saveStatus && (
        <div className="save-status-message">
          {saveStatus}
        </div>
      )}

      <div className="settings-tabs">
        <button 
          className={showSection === 'general' ? 'active' : ''} 
          onClick={() => setShowSection('general')}
        >
          General Settings
        </button>
        <button 
          className={showSection === 'reddit' ? 'active' : ''} 
          onClick={() => setShowSection('reddit')}
        >
          Reddit
        </button>
        <button 
          className={showSection === 'twitter' ? 'active' : ''} 
          onClick={() => setShowSection('twitter')}
        >
          Twitter
        </button>
        <button 
          className={showSection === 'youtube' ? 'active' : ''} 
          onClick={() => setShowSection('youtube')}
        >
          YouTube
        </button>
        <button 
          className={showSection === 'database' ? 'active' : ''} 
          onClick={() => setShowSection('database')}
        >
          Database
        </button>
      </div>
      
      {/* General Settings Section */}
      {showSection === 'general' && (
        <>
          <div className="settings-section">
            <h3>API Settings</h3>
            
            <div className="setting-group">
              <label htmlFor="apiKey">API Key</label>
              <div className="api-key-display">
                <input 
                  type={showApiKey ? "text" : "password"} 
                  id="apiKey" 
                  name="apiKey"
                  value={apiSettings.apiKey} 
                  onChange={handleApiSettingChange}
                  readOnly 
                />
                <button 
                  className="toggle-visibility" 
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
              
              <button 
                className="generate-key-button" 
                onClick={handleGenerateNewApiKey}
              >
                Generate New API Key
              </button>
              <p className="setting-description">
                API key for accessing social media platforms. Generating a new key will invalidate your existing key.
              </p>
            </div>
            
            <div className="setting-group">
              <label htmlFor="refreshInterval">Data Refresh Interval (minutes)</label>
              <select 
                id="refreshInterval" 
                name="refreshInterval"
                value={apiSettings.refreshInterval} 
                onChange={handleApiSettingChange}
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="360">6 hours</option>
                <option value="720">12 hours</option>
              </select>
              <p className="setting-description">
                How often Jester should refresh sentiment data for your cryptocurrencies.
              </p>
            </div>
            
            <div className="setting-group">
              <label htmlFor="maxResults">Maximum Results Per Source</label>
              <input 
                type="number" 
                id="maxResults" 
                name="maxResults"
                min="10" 
                max="500" 
                value={apiSettings.maxResults} 
                onChange={handleApiSettingChange}
              />
              <p className="setting-description">
                The maximum number of posts, tweets, and videos to analyze per cryptocurrency.
              </p>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Data Sources</h3>
            
            <div className="setting-group checkbox">
              <input 
                type="checkbox" 
                id="enableReddit" 
                name="enableReddit"
                checked={dataSourceSettings.enableReddit} 
                onChange={handleDataSourceSettingChange}
              />
              <label htmlFor="enableReddit">Enable Reddit Analysis</label>
            </div>
            
            {dataSourceSettings.enableReddit && (
              <div className="sub-setting">
                <label htmlFor="redditPostsToAnalyze">Reddit Posts to Analyze</label>
                <input 
                  type="number" 
                  id="redditPostsToAnalyze" 
                  name="redditPostsToAnalyze"
                  min="10" 
                  max="500" 
                  value={dataSourceSettings.redditPostsToAnalyze} 
                  onChange={handleDataSourceSettingChange}
                />
              </div>
            )}
            
            <div className="setting-group checkbox">
              <input 
                type="checkbox" 
                id="enableTwitter" 
                name="enableTwitter"
                checked={dataSourceSettings.enableTwitter} 
                onChange={handleDataSourceSettingChange}
              />
              <label htmlFor="enableTwitter">Enable Twitter Analysis</label>
            </div>
            
            {dataSourceSettings.enableTwitter && (
              <div className="sub-setting">
                <label htmlFor="twitterPostsToAnalyze">Tweets to Analyze</label>
                <input 
                  type="number" 
                  id="twitterPostsToAnalyze" 
                  name="twitterPostsToAnalyze"
                  min="10" 
                  max="1000" 
                  value={dataSourceSettings.twitterPostsToAnalyze} 
                  onChange={handleDataSourceSettingChange}
                />
              </div>
            )}
            
            <div className="setting-group checkbox">
              <input 
                type="checkbox" 
                id="enableYoutube" 
                name="enableYoutube"
                checked={dataSourceSettings.enableYoutube} 
                onChange={handleDataSourceSettingChange}
              />
              <label htmlFor="enableYoutube">Enable YouTube Analysis</label>
            </div>
            
            {dataSourceSettings.enableYoutube && (
              <div className="sub-setting">
                <label htmlFor="youtubeVideosToAnalyze">YouTube Videos to Analyze</label>
                <input 
                  type="number" 
                  id="youtubeVideosToAnalyze" 
                  name="youtubeVideosToAnalyze"
                  min="5" 
                  max="200" 
                  value={dataSourceSettings.youtubeVideosToAnalyze} 
                  onChange={handleDataSourceSettingChange}
                />
              </div>
            )}
          </div>
          
          <div className="settings-section">
            <h3>UI Preferences</h3>
            
            <div className="setting-group">
              <label htmlFor="theme">Application Theme</label>
              <select 
                id="theme" 
                name="theme"
                value={uiSettings.theme} 
                onChange={handleUiSettingChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label htmlFor="language">Language</label>
              <select 
                id="language" 
                name="language"
                value={uiSettings.language} 
                onChange={handleUiSettingChange}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            
            <div className="setting-group checkbox">
              <input 
                type="checkbox" 
                id="compactView" 
                name="compactView"
                checked={uiSettings.compactView} 
                onChange={handleUiSettingChange}
              />
              <label htmlFor="compactView">Use Compact View</label>
              <p className="setting-description">
                Display more information in less space.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Reddit Auth Section */}
      {showSection === 'reddit' && (
        <div className="settings-section">
          <h3>Reddit API Authentication</h3>
          <div className="auth-description">
            <p>Configure your Reddit API credentials to enable scraping from subreddits.</p>
            <p>These credentials will be stored securely in your environment variables.</p>
            <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer">
              Get your Reddit API credentials
            </a>
          </div>

          <div className="setting-group">
            <label htmlFor="clientId">Client ID</label>
            <input 
              type="text" 
              id="clientId" 
              name="clientId"
              value={redditAuth.clientId} 
              onChange={handleRedditAuthChange}
              placeholder="Enter your Reddit Client ID" 
            />
          </div>

          <div className="setting-group">
            <label htmlFor="clientSecret">Client Secret</label>
            <div className="password-display">
              <input 
                type={showPasswords ? "text" : "password"} 
                id="clientSecret" 
                name="clientSecret"
                value={redditAuth.clientSecret} 
                onChange={handleRedditAuthChange}
                placeholder="Enter your Reddit Client Secret" 
              />
            </div>
          </div>

          <div className="setting-group">
            <label htmlFor="username">Reddit Username</label>
            <input 
              type="text" 
              id="username" 
              name="username"
              value={redditAuth.username} 
              onChange={handleRedditAuthChange}
              placeholder="Enter your Reddit Username" 
            />
          </div>

          <div className="setting-group">
            <label htmlFor="password">Reddit Password</label>
            <div className="password-display">
              <input 
                type={showPasswords ? "text" : "password"} 
                id="password" 
                name="password"
                value={redditAuth.password} 
                onChange={handleRedditAuthChange}
                placeholder="Enter your Reddit Password" 
              />
              <button 
                className="toggle-visibility" 
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? "Hide" : "Show"} Passwords
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button 
              className="test-connection-button" 
              onClick={() => testConnection('reddit')}
              disabled={!redditAuth.clientId || !redditAuth.clientSecret || !redditAuth.username || !redditAuth.password}
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Twitter Auth Section */}
      {showSection === 'twitter' && (
        <div className="settings-section">
          <h3>Twitter/X API Authentication</h3>
          <div className="auth-description">
            <p>Configure your Twitter API credentials to enable hashtag analysis.</p>
            <p>These credentials will be stored securely in your environment variables.</p>
            <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer">
              Get your Twitter/X API credentials
            </a>
          </div>

          <div className="setting-group">
            <label htmlFor="apiKey">API Key</label>
            <input 
              type="text" 
              id="apiKey" 
              name="apiKey"
              value={twitterAuth.apiKey} 
              onChange={handleTwitterAuthChange}
              placeholder="Enter your Twitter API Key" 
            />
          </div>

          <div className="setting-group">
            <label htmlFor="apiKeySecret">API Key Secret</label>
            <div className="password-display">
              <input 
                type={showPasswords ? "text" : "password"} 
                id="apiKeySecret" 
                name="apiKeySecret"
                value={twitterAuth.apiKeySecret} 
                onChange={handleTwitterAuthChange}
                placeholder="Enter your Twitter API Key Secret" 
              />
            </div>
          </div>

          <div className="setting-group">
            <label htmlFor="accessToken">Access Token</label>
            <input 
              type="text" 
              id="accessToken" 
              name="accessToken"
              value={twitterAuth.accessToken} 
              onChange={handleTwitterAuthChange}
              placeholder="Enter your Twitter Access Token" 
            />
          </div>

          <div className="setting-group">
            <label htmlFor="accessTokenSecret">Access Token Secret</label>
            <div className="password-display">
              <input 
                type={showPasswords ? "text" : "password"} 
                id="accessTokenSecret" 
                name="accessTokenSecret"
                value={twitterAuth.accessTokenSecret} 
                onChange={handleTwitterAuthChange}
                placeholder="Enter your Twitter Access Token Secret" 
              />
              <button 
                className="toggle-visibility" 
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? "Hide" : "Show"} Secrets
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button 
              className="test-connection-button" 
              onClick={() => testConnection('twitter')}
              disabled={!twitterAuth.apiKey || !twitterAuth.apiKeySecret || !twitterAuth.accessToken || !twitterAuth.accessTokenSecret}
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* YouTube Auth Section */}
      {showSection === 'youtube' && (
        <div className="settings-section">
          <h3>YouTube API Authentication</h3>
          <div className="auth-description">
            <p>Configure your YouTube API credentials to enable video and comment analysis.</p>
            <p>Your API key will be stored securely in your environment variables.</p>
            <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer">
              Get your YouTube API key
            </a>
          </div>

          <div className="setting-group">
            <label htmlFor="youtubeApiKey">API Key</label>
            <div className="password-display">
              <input 
                type={showPasswords ? "text" : "password"} 
                id="youtubeApiKey" 
                name="apiKey"
                value={youtubeAuth.apiKey} 
                onChange={handleYoutubeAuthChange}
                placeholder="Enter your YouTube API Key" 
              />
              <button 
                className="toggle-visibility" 
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button 
              className="test-connection-button" 
              onClick={() => testConnection('youtube')}
              disabled={!youtubeAuth.apiKey}
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Database Auth Section */}
      {showSection === 'database' && (
        <div className="settings-section">
          <h3>Database Authentication</h3>
          <div className="auth-description">
            <p>Upload your Firebase authentication JSON file (db_auth.json) to enable database connectivity.</p>
            <p>This file contains your service account credentials and will be stored securely in your project directory.</p>
            <a href="https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk" target="_blank" rel="noopener noreferrer">
              Get your Firebase service account key
            </a>
          </div>

          <div className="setting-group">
            <label htmlFor="dbAuthFile">Firebase Authentication File (JSON)</label>
            <div className="file-upload">
              <input 
                type="file" 
                id="dbAuthFile" 
                ref={fileInputRef}
                onChange={handleDbAuthFileChange}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button 
                className="file-select-button" 
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </button>
              <span className="selected-file">
                {dbAuthFileName || 'No file selected'}
              </span>
            </div>
            <p className="setting-description">
              This file should contain your Firebase service account credentials in JSON format.
            </p>
          </div>

          <div className="auth-actions">
            <button 
              className="test-connection-button" 
              onClick={() => testConnection('database')}
              disabled={!dbAuthFile}
            >
              Test Database Connection
            </button>
          </div>
        </div>
      )}
      
      <div className="settings-actions">
        <button className="save-button" onClick={handleSaveSettings}>
          Save All Settings
        </button>
        <button className="reset-button" onClick={handleResetSettings}>
          Reset to Default
        </button>
      </div>
      
      <div className="settings-section danger-zone">
        <h3>Danger Zone</h3>
        
        <div className="setting-group">
          <button className="danger-button" onClick={handleClearData}>
            Clear All Cryptocurrency Data
          </button>
          <p className="danger-info">
            This will permanently delete all your tracked cryptocurrencies and their associated data. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;