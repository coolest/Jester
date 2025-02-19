import React, { useEffect, useState } from 'react'
import '@renderer/assets/components/main/cryptoList/cryptoList.css'


interface Crypto {
  id: string
  cryptoName: string
  videoLink: string
  subreddit: string
  hashtag: string
}

const CryptoList: React.FC = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([])

  const loadCryptos = async () => {
    try {
      const loadedCryptos = await window.api.getCryptos()
      setCryptos(loadedCryptos)
    } catch (error) {
      console.error('Error loading cryptos:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await window.api.deleteCrypto(id)
      await loadCryptos()
    } catch (error) {
      console.error('Error deleting crypto:', error)
    }
  }

  useEffect(() => {
    loadCryptos()
  }, [])

  return (
    <div className="crypto-list">
      <h2>Stored Cryptocurrencies ({cryptos.length})</h2>
      {cryptos.map((crypto) => (
        <div key={crypto.id} className="crypto-item">
          <h3>{crypto.cryptoName}</h3>
          <p>Subreddit: r/{crypto.subreddit}</p>
          <p>Twitter Hashtag: {crypto.hashtag}</p>
          <p>YouTube Link: {crypto.videoLink}</p>
          <button onClick={() => handleDelete(crypto.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}

export default CryptoList