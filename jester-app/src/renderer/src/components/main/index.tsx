import '@renderer/assets/index.css'
import { NavBar } from './header/NavBar'
import { SideBar } from './sidebar/SideBar'
import React from 'react'

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

export const Main : React.FC = () => {
  return (
    <div className="Wrapper">
      <NavBar />
      <div className="Container">
        <SideBar data={test.data} />
      </div>
    </div>
  )
}
