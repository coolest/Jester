import React, { useState, useEffect } from 'react';
import '../../../assets/components/main/pages/Dashboard.css';

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
}

const Dashboard: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate fetching data
    const fetchData = () => {
      setIsLoading(true);
      
      // Mockup data - in a real app, this would come from an API
      setTimeout(() => {
        const mockData: CryptoData[] = [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 65432.10, change24h: 2.34 },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: -1.23 },
          { id: 'solana', name: 'Solana', symbol: 'SOL', price: 138.42, change24h: 5.67 },
          { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.48, change24h: -0.89 },
          { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 6.32, change24h: 1.45 },
        ];
        
        setCryptoData(mockData);
        setIsLoading(false);
      }, 800);
    };

    fetchData();
  }, []);

  const formatPrice = (price: number): string => {
    return price < 1 
      ? `$${price.toFixed(4)}` 
      : `$${price.toFixed(2)}`;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Crypto Dashboard</h2>
        <button className="refresh-button">Refresh Data</button>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Portfolio Value</h3>
          <p className="summary-value">$12,345.67</p>
          <p className="summary-change positive">+5.43% today</p>
        </div>
        <div className="summary-card">
          <h3>24h Volume</h3>
          <p className="summary-value">$987.65</p>
        </div>
        <div className="summary-card">
          <h3>Assets</h3>
          <p className="summary-value">5</p>
        </div>
      </div>

      <div className="crypto-list">
        <h3>Your Assets</h3>
        {isLoading ? (
          <div className="loading">Loading assets...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Symbol</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cryptoData.map((crypto) => (
                <tr key={crypto.id}>
                  <td>{crypto.name}</td>
                  <td>{crypto.symbol}</td>
                  <td>{formatPrice(crypto.price)}</td>
                  <td className={crypto.change24h >= 0 ? 'positive' : 'negative'}>
                    {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h}%
                  </td>
                  <td>
                    <button className="action-button">Trade</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;