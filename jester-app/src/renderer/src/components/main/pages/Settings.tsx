import React, { useState, useEffect } from 'react';
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

  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [cryptoCount, setCryptoCount] = useState<number>(0);
  
  // Load settings and crypto count on component mount
  useEffect(() => {
    // In a real app, load from localStorage or API
    const loadSettings = () => {
      // Simulate loading saved settings
      // In a real app, you'd fetch from localStorage or an API
      console.log('Loading settings...');
      
      // Load crypto count
      const loadCryptoCount = async () => {
        try {
          const loadedCryptos = await window.api.getCryptos();
          setCryptoCount(loadedCryptos.length);
        } catch (error) {
          console.error('Error loading cryptos count:', error);
        }
      };
      
      loadCryptoCount();
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
  const handleSaveSettings = () => {
    // In a real app, save to localStorage or API
    console.log('Saving settings:', {
      apiSettings,
      uiSettings,
      dataSourceSettings
    });
    
    setSaveStatus('Settings saved successfully!');
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setSaveStatus('');
    }, 3000);
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
      
      <div className="settings-actions">
        <button className="save-button" onClick={handleSaveSettings}>
          Save Settings
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