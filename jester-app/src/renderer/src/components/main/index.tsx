import '@renderer/assets/components/Main.css'
import { NavBar } from "./header/NavBar"
import { SideBar } from "./sidebar/SideBar"

export const Main = () => {
    return (
    <div className='Container'>
      <NavBar/>
      <>
        <SideBar />
      </>
    </div>
    )
}