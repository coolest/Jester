import React, { useEffect, useState } from 'react';
import '@renderer/assets/components/main/cryptoList/cryptoList.css';

interface Crypto {
  id: string;
  cryptoName: string;
  videoLink: string;
  subreddit: string;
  hashtag: string;
  score: number;
  img?: string;
}

const CryptoList: React.FC = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [editingCrypto, setEditingCrypto] = useState<Crypto | null>(null);
  const [formData, setFormData] = useState<Omit<Crypto, 'id'>>({
    cryptoName: '',
    videoLink: '',
    subreddit: '',
    hashtag: '',
    score: 0,
    img: 'null'
  });

  const loadCryptos = async () => {
    try {
      const loadedCryptos = await window.api.getCryptos();
      setCryptos(loadedCryptos);
    } catch (error) {
      console.error('Error loading cryptos:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.api.deleteCrypto(id);
      await loadCryptos();
    } catch (error) {
      console.error('Error deleting crypto:', error);
    }
  };

  const handleEdit = (crypto: Crypto) => {
    setEditingCrypto(crypto);
    setFormData({
      cryptoName: crypto.cryptoName,
      videoLink: crypto.videoLink,
      subreddit: crypto.subreddit,
      hashtag: crypto.hashtag,
      score: crypto.score || 0,
      img: crypto.img || 'null'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCrypto) return;
    
    try {
      // First delete the old entry, then add the updated one
      await window.api.deleteCrypto(editingCrypto.id);
      await window.api.addCrypto({
        ...formData,
        id: editingCrypto.id // Preserve the original ID
      });
      
      await loadCryptos();
      setEditingCrypto(null);
      setFormData({
        cryptoName: '',
        videoLink: '',
        subreddit: '',
        hashtag: '',
        score: 0,
        img: 'null'
      });
    } catch (error) {
      console.error('Error updating crypto:', error);
    }
  };

  const handleCancel = () => {
    setEditingCrypto(null);
    setFormData({
      cryptoName: '',
      videoLink: '',
      subreddit: '',
      hashtag: '',
      score: 0,
      img: 'null'
    });
  };

  useEffect(() => {
    loadCryptos();
  }, []);

  return (
    <div className="crypto-list">
      <h2>Stored Cryptocurrencies ({cryptos.length})</h2>
      
      {editingCrypto && (
        <div className="edit-form">
          <h3>Edit {editingCrypto.cryptoName}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cryptoName">Name:</label>
              <input
                type="text"
                id="cryptoName"
                name="cryptoName"
                value={formData.cryptoName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="subreddit">Subreddit:</label>
              <input
                type="text"
                id="subreddit"
                name="subreddit"
                value={formData.subreddit}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="hashtag">Twitter Hashtag:</label>
              <input
                type="text"
                id="hashtag"
                name="hashtag"
                value={formData.hashtag}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="videoLink">YouTube Link:</label>
              <input
                type="text"
                id="videoLink"
                name="videoLink"
                value={formData.videoLink}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="button-group">
              <button type="submit">Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      {cryptos.map((crypto) => (
        <div key={crypto.id} className="crypto-item">
          <h3>{crypto.cryptoName}</h3>
          <p>Subreddit: r/{crypto.subreddit}</p>
          <p>Twitter Hashtag: {crypto.hashtag}</p>
          <p>YouTube Link: {crypto.videoLink}</p>
          {/* Only show action buttons if no crypto is being edited or if this crypto is not the one being edited */}
          {!editingCrypto || editingCrypto.id !== crypto.id ? (
            <div className="crypto-actions">
              <button onClick={() => handleEdit(crypto)} className="edit-button">Edit</button>
              <button onClick={() => handleDelete(crypto.id)} className="delete-button">Delete</button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default CryptoList;