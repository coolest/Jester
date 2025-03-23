import '@renderer/assets/index.css'
import React, { useState, useEffect } from 'react'
import NavBar from './header/NavBar'
import { SideBar } from './sidebar/SideBar'
import AddCrypto from './addCrypto/addCrypto'
import CryptoList from './cryptoList/cryptoList'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

// Shared interface for sidebar data
interface SidebarItem {
  id: string;
  tag: string; // Use tag to match Button component's props
  score: number;
  img?: string;
}

interface Crypto {
  id: string;
  cryptoName: string;
  videoLink: string;
  subreddit: string;
  hashtag: string;
  score: number;
  img?: string;
}

export const Main: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [sidebarData, setSidebarData] = useState<SidebarItem[]>([])
  const [currentPage, setCurrentPage] = useState<string>('dashboard')
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>('')

  const handleCryptoChange = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleNavigate = (route: string) => {
    setCurrentPage(route)
  }
  
  const handleSidebarItemClick = (cryptoId: string) => {
    setSelectedCryptoId(cryptoId)
    setCurrentPage('analytics')
  }

  // Load cryptos and format them for the sidebar
  useEffect(() => {
    const loadCryptosForSidebar = async () => {
      try {
        const loadedCryptos: Crypto[] = await window.api.getCryptos()
        
        // Format the data for the sidebar using tag instead of name
        const formattedData: SidebarItem[] = loadedCryptos.map(crypto => ({
          id: crypto.id,
          tag: crypto.cryptoName, // Use tag to match Button component's props
          score: crypto.score,
          img: crypto.img || 'null'
        }))
        
        setSidebarData(formattedData)
        
        // Set first crypto as selected if none is selected and cryptos exist
        if (formattedData.length > 0 && !selectedCryptoId) {
          setSelectedCryptoId(formattedData[0].id)
        }
      } catch (error) {
        console.error('Error loading cryptos for sidebar:', error)
      }
    }

    loadCryptosForSidebar()
  }, [refreshTrigger, selectedCryptoId])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <>
            <AddCrypto onAdd={handleCryptoChange} />
            <CryptoList key={refreshTrigger} onDelete={handleCryptoChange} />
          </>
        )
      case 'analytics':
        return <Analytics selectedCryptoId={selectedCryptoId} />
      case 'settings':
        return <Settings />
      default:
        return (
          <>
            <AddCrypto onAdd={handleCryptoChange} />
            <CryptoList key={refreshTrigger} onDelete={handleCryptoChange} />
          </>
        )
    }
  }

  return (
    <div className="Wrapper">
      <NavBar onNavigate={handleNavigate} />
      <div className="Container" style={{ marginTop: "60px" }}>
        <SideBar data={sidebarData} onItemClick={handleSidebarItemClick} />
        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}