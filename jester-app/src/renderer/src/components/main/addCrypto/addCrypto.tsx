import '@renderer/assets/components/main/addCrypto/addCrypto.css'
import React, { useState } from 'react'

interface CryptoData {
  cryptoName: string
  videoLink: string
  subreddit: string
  hashtag: string
  score: number
  img?: string
}

interface AddCryptoProps {
  onAdd?: () => void
}

const AddCrypto: React.FC<AddCryptoProps> = ({ onAdd }) => {
  console.log('Window API available:', window.api)
  const [cryptoData, setCryptoData] = useState<CryptoData>({
    cryptoName: '',
    videoLink: '',
    subreddit: '',
    hashtag: '',
    score: 0,
    img: 'null'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit button clicked')
    console.log('Current crypto data:', cryptoData)
    
    try {
      console.log('Attempting to call window.api.addCrypto')
      const result = await window.api.addCrypto(cryptoData)
      console.log('Result from addCrypto:', result)
      
      // Clear form
      setCryptoData({
        cryptoName: '',
        videoLink: '',
        subreddit: '',
        hashtag: '',
        score: 0,
        img: 'null'
      })
      console.log('Form cleared')
 
      // Call onAdd if it exists
      if (onAdd) {
        console.log('Calling onAdd callback')
        onAdd()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      console.error('Full error details:', error)
    }
  }

  return (
    <div className="content-wrapper">
      <div className="add-crypto-container">
        <h2 className="add-crypto-title">Add Cryptocurrency</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cryptoName">Cryptocurrency ID</label>
            <input
              id="cryptoName"
              type="text"
              value={cryptoData.cryptoName}
              onChange={(e) => setCryptoData({ ...cryptoData, cryptoName: e.target.value })}
              placeholder="Crypto ID (e.g., BTC)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="videoLink">YouTube Video Link</label>
            <input
              id="videoLink"
              type="text"
              value={cryptoData.videoLink}
              onChange={(e) => setCryptoData({ ...cryptoData, videoLink: e.target.value })}
              placeholder="Youtube Video Link"
            />
          </div>
          <div className="form-group">
            <label htmlFor="subreddit">Subreddit</label>
            <input
              id="subreddit"
              type="text"
              value={cryptoData.subreddit}
              onChange={(e) => setCryptoData({ ...cryptoData, subreddit: e.target.value })}
              placeholder="Subreddit"
            />
          </div>
          <div className="form-group">
            <label htmlFor="hashtag">Twitter(X) Hashtag</label>
            <input
              id="hashtag"
              type="text"
              value={cryptoData.hashtag}
              onChange={(e) => setCryptoData({ ...cryptoData, hashtag: e.target.value })}
              placeholder="Twitter(X) Hashtag"
            />
          </div>
          <button type="submit" className="submit-button">Add Cryptocurrency</button>
        </form>
      </div>
    </div>
  )
}

export default AddCrypto