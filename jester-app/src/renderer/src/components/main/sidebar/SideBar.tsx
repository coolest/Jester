import '@renderer/assets/components/main/sidebar/SideBar.css'
import React from 'react'
import { Button } from './Button'

interface DummyProp {
  id: string
  score: number
  img?: string // Optional property
}

interface SideBarProps {
  data: DummyProp[]
}

export const SideBar: React.FC<SideBarProps> = ({ data }) => {
  return (
    <aside className="SideBar">
      {data.map((dummyProp, index) => (
        <Button key={index} tag={dummyProp.id} score={dummyProp.score} img={dummyProp.img} />
      ))}
    </aside>
  )
}
