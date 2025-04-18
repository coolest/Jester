import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface SentimentDataPoint {
  timestamp: number;
  reddit: number | null;
  twitter: number | null;
  youtube: number | null;
  average?: number;
}

interface SentimentChartsProps {
  data: SentimentDataPoint[];
  platforms: {
    reddit: boolean;
    twitter: boolean;
    youtube: boolean;
  };
  cryptoName: string;
}

const SentimentCharts: React.FC<SentimentChartsProps> = ({ data, platforms, cryptoName }) => {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'distribution'>('line');
  
  // Pre-process data for charts
  const chartData = data.map(point => {
    // Calculate average for each point
    const values: number[] = [];
    if (platforms.reddit && point.reddit !== null) values.push(point.reddit);
    if (platforms.twitter && point.twitter !== null) values.push(point.twitter);
    if (platforms.youtube && point.youtube !== null) values.push(point.youtube);
    
    const average = values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : null;
    
    // Format the date for display
    const date = new Date(point.timestamp * 1000);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
    
    return {
      ...point,
      formattedDate,
      average
    };
  });

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

  // Categorize sentiments for pie chart
  const sentimentCategories = {
    veryPositive: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    veryNegative: 0
  };

  // Count sentiments across all data points
  chartData.forEach(point => {
    const platforms = ['reddit', 'twitter', 'youtube'];
    platforms.forEach(platform => {
      const value = point[platform];
      if (value !== null) {
        if (value >= 80) sentimentCategories.veryPositive++;
        else if (value >= 60) sentimentCategories.positive++;
        else if (value >= 40) sentimentCategories.neutral++;
        else if (value >= 20) sentimentCategories.negative++;
        else sentimentCategories.veryNegative++;
      }
    });
  });

  // Prepare data for pie chart
  const pieData = [
    { name: 'Very Positive', value: sentimentCategories.veryPositive, color: '#4CAF50' },
    { name: 'Positive', value: sentimentCategories.positive, color: '#8BC34A' },
    { name: 'Neutral', value: sentimentCategories.neutral, color: '#FFEB3B' },
    { name: 'Negative', value: sentimentCategories.negative, color: '#FF9800' },
    { name: 'Very Negative', value: sentimentCategories.veryNegative, color: '#F44336' },
  ].filter(item => item.value > 0); // Only include categories with data

  // Calculate volatility (standard deviation) for each platform
  const calculateVolatility = (platform: 'reddit' | 'twitter' | 'youtube' | 'average') => {
    const values = chartData
      .map(point => point[platform])
      .filter(value => value !== null) as number[];
    
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  };

  // Create radar chart data
  const radarData = [
    {
      subject: 'Avg. Sentiment',
      reddit: chartData.reduce((sum, pt) => sum + (pt.reddit || 0), 0) / chartData.filter(pt => pt.reddit !== null).length || 0,
      twitter: chartData.reduce((sum, pt) => sum + (pt.twitter || 0), 0) / chartData.filter(pt => pt.twitter !== null).length || 0,
      youtube: chartData.reduce((sum, pt) => sum + (pt.youtube || 0), 0) / chartData.filter(pt => pt.youtube !== null).length || 0,
    },
    {
      subject: 'Volatility',
      reddit: calculateVolatility('reddit'),
      twitter: calculateVolatility('twitter'),
      youtube: calculateVolatility('youtube'),
    },
    {
      subject: 'Data Points',
      reddit: chartData.filter(pt => pt.reddit !== null).length,
      twitter: chartData.filter(pt => pt.twitter !== null).length,
      youtube: chartData.filter(pt => pt.youtube !== null).length,
    }
  ];

  // Distribution data for sentiment ranges
  const getDistributionData = () => {
    const ranges = [
      { range: '0-20', label: 'Very Negative' },
      { range: '21-40', label: 'Negative' },
      { range: '41-60', label: 'Neutral' },
      { range: '61-80', label: 'Positive' },
      { range: '81-100', label: 'Very Positive' }
    ];

    return ranges.map(range => {
      const redditCount = chartData.filter(pt => 
        pt.reddit !== null && 
        (range.range === '0-20' ? pt.reddit >= 0 && pt.reddit <= 20 :
         range.range === '21-40' ? pt.reddit > 20 && pt.reddit <= 40 :
         range.range === '41-60' ? pt.reddit > 40 && pt.reddit <= 60 :
         range.range === '61-80' ? pt.reddit > 60 && pt.reddit <= 80 :
         pt.reddit > 80 && pt.reddit <= 100)
      ).length;

      const twitterCount = chartData.filter(pt => 
        pt.twitter !== null && 
        (range.range === '0-20' ? pt.twitter >= 0 && pt.twitter <= 20 :
         range.range === '21-40' ? pt.twitter > 20 && pt.twitter <= 40 :
         range.range === '41-60' ? pt.twitter > 40 && pt.twitter <= 60 :
         range.range === '61-80' ? pt.twitter > 60 && pt.twitter <= 80 :
         pt.twitter > 80 && pt.twitter <= 100)
      ).length;

      const youtubeCount = chartData.filter(pt => 
        pt.youtube !== null && 
        (range.range === '0-20' ? pt.youtube >= 0 && pt.youtube <= 20 :
         range.range === '21-40' ? pt.youtube > 20 && pt.youtube <= 40 :
         range.range === '41-60' ? pt.youtube > 40 && pt.youtube <= 60 :
         range.range === '61-80' ? pt.youtube > 60 && pt.youtube <= 80 :
         pt.youtube > 80 && pt.youtube <= 100)
      ).length;

      return {
        name: range.label,
        reddit: redditCount,
        twitter: twitterCount,
        youtube: youtubeCount
      };
    });
  };

  return (
    <div className="enhanced-sentiment-charts">
      <div className="chart-type-selector">
        <h3>Visualization Type</h3>
        <div className="chart-buttons">
          <button 
            className={chartType === 'line' ? 'active' : ''} 
            onClick={() => setChartType('line')}
          >
            Line Chart
          </button>
          <button 
            className={chartType === 'area' ? 'active' : ''} 
            onClick={() => setChartType('area')}
          >
            Area Chart
          </button>
          <button 
            className={chartType === 'bar' ? 'active' : ''} 
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
          <button 
            className={chartType === 'distribution' ? 'active' : ''} 
            onClick={() => setChartType('distribution')}
          >
            Distribution
          </button>
        </div>
      </div>

      <div className="chart-container main-chart">
        <h3>{cryptoName} Sentiment Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any) => [value ? value.toFixed(1) : 'N/A', '']}
                labelFormatter={(label: string) => `Date: ${label}`}
              />
              <Legend />
              
              {platforms.reddit && (
                <Line
                  type="monotone"
                  dataKey="reddit"
                  name="Reddit"
                  stroke={getStrokeColor('reddit')}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4 }}
                  connectNulls
                />
              )}
              
              {platforms.twitter && (
                <Line
                  type="monotone"
                  dataKey="twitter"
                  name="Twitter"
                  stroke={getStrokeColor('twitter')}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4 }}
                  connectNulls
                />
              )}
              
              {platforms.youtube && (
                <Line
                  type="monotone"
                  dataKey="youtube"
                  name="YouTube"
                  stroke={getStrokeColor('youtube')}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4 }}
                  connectNulls
                />
              )}
              
              <Line
                type="monotone"
                dataKey="average"
                name="Average"
                stroke={getStrokeColor('average')}
                strokeWidth={2}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any) => [value ? value.toFixed(1) : 'N/A', '']}
                labelFormatter={(label: string) => `Date: ${label}`}
              />
              <Legend />
              
              {platforms.reddit && (
                <Area
                  type="monotone"
                  dataKey="reddit"
                  name="Reddit"
                  stroke={getStrokeColor('reddit')}
                  fill={getStrokeColor('reddit')}
                  fillOpacity={0.3}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              )}
              
              {platforms.twitter && (
                <Area
                  type="monotone"
                  dataKey="twitter"
                  name="Twitter"
                  stroke={getStrokeColor('twitter')}
                  fill={getStrokeColor('twitter')}
                  fillOpacity={0.3}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              )}
              
              {platforms.youtube && (
                <Area
                  type="monotone"
                  dataKey="youtube"
                  name="YouTube"
                  stroke={getStrokeColor('youtube')}
                  fill={getStrokeColor('youtube')}
                  fillOpacity={0.3}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              )}
              
              <Area
                type="monotone"
                dataKey="average"
                name="Average"
                stroke={getStrokeColor('average')}
                fill={getStrokeColor('average')}
                fillOpacity={0.3}
                strokeWidth={2}
                activeDot={{ r: 8 }}
                connectNulls
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any) => [value ? value.toFixed(1) : 'N/A', '']}
                labelFormatter={(label: string) => `Date: ${label}`}
              />
              <Legend />
              
              {platforms.reddit && (
                <Bar 
                  dataKey="reddit" 
                  name="Reddit" 
                  fill={getStrokeColor('reddit')} 
                />
              )}
              
              {platforms.twitter && (
                <Bar 
                  dataKey="twitter" 
                  name="Twitter" 
                  fill={getStrokeColor('twitter')} 
                />
              )}
              
              {platforms.youtube && (
                <Bar 
                  dataKey="youtube" 
                  name="YouTube" 
                  fill={getStrokeColor('youtube')} 
                />
              )}
              
              <Bar 
                dataKey="average" 
                name="Average" 
                fill={getStrokeColor('average')} 
              />
            </BarChart>
          ) : (
            <BarChart
              data={getDistributionData()}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {platforms.reddit && (
                <Bar 
                  dataKey="reddit" 
                  name="Reddit" 
                  fill={getStrokeColor('reddit')} 
                />
              )}
              
              {platforms.twitter && (
                <Bar 
                  dataKey="twitter" 
                  name="Twitter" 
                  fill={getStrokeColor('twitter')} 
                />
              )}
              
              {platforms.youtube && (
                <Bar 
                  dataKey="youtube" 
                  name="YouTube" 
                  fill={getStrokeColor('youtube')} 
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="chart-grid">
        <div className="chart-container">
          <h3>Overall Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} data points`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Platform Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              {platforms.reddit && (
                <Radar name="Reddit" dataKey="reddit" stroke={getStrokeColor('reddit')} fill={getStrokeColor('reddit')} fillOpacity={0.6} />
              )}
              {platforms.twitter && (
                <Radar name="Twitter" dataKey="twitter" stroke={getStrokeColor('twitter')} fill={getStrokeColor('twitter')} fillOpacity={0.6} />
              )}
              {platforms.youtube && (
                <Radar name="YouTube" dataKey="youtube" stroke={getStrokeColor('youtube')} fill={getStrokeColor('youtube')} fillOpacity={0.6} />
              )}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sentiment-summary">
        <h3>Sentiment Analysis Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <h4>Overall Average</h4>
            <div className="summary-value">
              {chartData.reduce((total, item) => {
                let count = 0;
                let sum = 0;
                if (platforms.reddit && item.reddit !== null) { sum += item.reddit; count++; }
                if (platforms.twitter && item.twitter !== null) { sum += item.twitter; count++; }
                if (platforms.youtube && item.youtube !== null) { sum += item.youtube; count++; }
                return total + (count > 0 ? sum / count : 0);
              }, 0) / chartData.length}
            </div>
          </div>
          
          {platforms.reddit && (
            <div className="summary-item">
              <h4>Reddit Average</h4>
              <div className="summary-value">
                {(chartData.reduce((sum, item) => sum + (item.reddit || 0), 0) / 
                 chartData.filter(item => item.reddit !== null).length).toFixed(1)}
              </div>
            </div>
          )}
          
          {platforms.twitter && (
            <div className="summary-item">
              <h4>Twitter Average</h4>
              <div className="summary-value">
                {(chartData.reduce((sum, item) => sum + (item.twitter || 0), 0) / 
                 chartData.filter(item => item.twitter !== null).length).toFixed(1)}
              </div>
            </div>
          )}
          
          {platforms.youtube && (
            <div className="summary-item">
              <h4>YouTube Average</h4>
              <div className="summary-value">
                {(chartData.reduce((sum, item) => sum + (item.youtube || 0), 0) / 
                 chartData.filter(item => item.youtube !== null).length).toFixed(1)}
              </div>
            </div>
          )}
          
          {platforms.reddit && (
            <div className="summary-item">
              <h4>Reddit Volatility</h4>
              <div className="summary-value">
                {calculateVolatility('reddit').toFixed(1)}
              </div>
            </div>
          )}
          
          {platforms.twitter && (
            <div className="summary-item">
              <h4>Twitter Volatility</h4>
              <div className="summary-value">
                {calculateVolatility('twitter').toFixed(1)}
              </div>
            </div>
          )}
          
          {platforms.youtube && (
            <div className="summary-item">
              <h4>YouTube Volatility</h4>
              <div className="summary-value">
                {calculateVolatility('youtube').toFixed(1)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentCharts;