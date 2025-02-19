import '@renderer/assets/components/main/header/NavBar.css'
import icon from '@renderer/assets/images/magnifying-glass.png'

export const SearchBar: React.FC = () => {
  return (
    <div className="SearchBar">
      <img className="SearchImage" src={icon} />
      <p> search </p>
    </div>
  )
}
