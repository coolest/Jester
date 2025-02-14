import '@renderer/assets/components/main/header/NavBar.css'
import logo from '@renderer/assets/images/icon.png'
export const NavBar: React.FC = () => {
  return (
    <header className="NavBar">
      <img src={logo} className="Image" />
    </header>
  )
}
