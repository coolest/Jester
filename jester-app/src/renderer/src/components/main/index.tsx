import '@renderer/assets/index.css'
import { NavBar } from './header/NavBar'
import { SideBar } from './sidebar/SideBar'
import AddCrypto  from './addCrypto/addCrypto'
import CryptoList from './cryptoList/cryptoList'
import React, { useState } from 'react'

interface DummyProp {
  id: string
  score: number
  img?: string // Optional property
}

interface SideBarProps {
  data: DummyProp[]
}

const test: SideBarProps = {
  data: [
    {
      id: 'BTC',
      score: 50,
      img: 'null'
    },
    {
      id: 'ETH',
      score: 34,
      img: 'null'
    },
    {
      id: 'DOGE',
      score: -50,
      img: 'null'
    },
    {
      id: 'BTC',
      score: 50,
      img: 'null'
    },
    {
      id: 'ETH',
      score: 13,
      img: 'null'
    },
    {
      id: 'DOGE',
      score: -13,
      img: 'null'
    },
    {
      id: 'BTC',
      score: 50,
      img: 'null'
    },
    {
      id: 'ETH',
      score: 34,
      img: 'null'
    },
    {
      id: 'DOGE',
      score: -23,
      img: 'null'
    }
  ]
}

export const Main: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCryptoAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="Wrapper">
      <NavBar />
      <div className="Container">
        <SideBar data={test.data} />
        <div className="content">
          <AddCrypto onAdd={handleCryptoAdded} />
          <CryptoList key={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
