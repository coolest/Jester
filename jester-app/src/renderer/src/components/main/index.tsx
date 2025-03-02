import '@renderer/assets/index.css'
import { NavBar } from './header/NavBar'
import { SideBar } from './sidebar/SideBar'
import AddCrypto from './addCrypto/addCrypto'
import CryptoList from './cryptoList/cryptoList'
import React, { useState, useEffect } from 'react'

interface DummyProp {
  id: string
  score: number
  img?: string // Optional property
}

interface Crypto {
  id: string
  cryptoName: string
  videoLink: string
  subreddit: string
  hashtag: string
  score: number
  img?: string
}

interface SideBarProps {
  data: DummyProp[]
}

export const Main: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [sidebarData, setSidebarData] = useState<DummyProp[]>([])

  const handleCryptoChange = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Load cryptos and format them for the sidebar
  useEffect(() => {
    const loadCryptosForSidebar = async () => {
      try {
        const loadedCryptos: Crypto[] = await window.api.getCryptos()
        
        // Format the data for the sidebar
        const formattedData: DummyProp[] = loadedCryptos.map(crypto => ({
          id: crypto.cryptoName,
          score: crypto.score,
          img: crypto.img || 'null'
        }))
        
        setSidebarData(formattedData)
      } catch (error) {
        console.error('Error loading cryptos for sidebar:', error)
      }
    }

    loadCryptosForSidebar()
  }, [refreshTrigger])

  return (
    <div className="Wrapper">
      <NavBar />
      <div className="Container">
        <SideBar data={sidebarData} />
        <div className="content">
          <AddCrypto onAdd={handleCryptoChange} />
          <CryptoList key={refreshTrigger} onDelete={handleCryptoChange} />
        </div>
      </div>
    </div>
  )
}