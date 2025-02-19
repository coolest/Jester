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
    <div>
      <h2>Add Cryptocurrency</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={cryptoData.cryptoName}
          onChange={(e) => setCryptoData({ ...cryptoData, cryptoName: e.target.value })}
          placeholder="Crypto ID (e.g., BTC)"
        />
        <input
          type="text"
          value={cryptoData.videoLink}
          onChange={(e) => setCryptoData({ ...cryptoData, videoLink: e.target.value })}
          placeholder="Youtube Video Link"
        />
        <input
          type="text"
          value={cryptoData.subreddit}
          onChange={(e) => setCryptoData({ ...cryptoData, subreddit: e.target.value })}
          placeholder="Subreddit"
        />
        <input
          type="text"
          value={cryptoData.hashtag}
          onChange={(e) => setCryptoData({ ...cryptoData, hashtag: e.target.value })}
          placeholder="Twitter(X) Hashtag"
        />
        <button type="submit">Add</button>
      </form>
    </div>
  )
}

export default AddCrypto