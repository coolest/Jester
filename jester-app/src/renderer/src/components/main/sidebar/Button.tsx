import '@renderer/assets/components/main/sidebar/Button.css'
import { useState } from 'react'

interface ButtonProp {
  tag: string
  score: number
  img?: string // Optional property
}

interface Color {
  r: number
  g: number
  b: number
}

export const Button: React.FC<ButtonProp> = ({ tag, score, img }) => {
  // Skip rendering the button if the score is out of bounds
  if (score > 50 || score < -50) return null

  const [isHovered, setIsHovered] = useState(false)

  // Function to calculate text color based on score
  const getTextColor = (score: number): string => {
    if (score <= -15) return 'var(--red)'
    else if (-15 < score && score <= 25) return 'var(--orange)'
    else return 'var(--green)'
  }

  const color = getTextColor(score)

  // Handle hover effect
  return (
    <button
      className="Button"
      onMouseEnter={() => setIsHovered(true)} // Call handleHover on hover
      onMouseLeave={() => setIsHovered(false)} // Reset on hover end // Apply dynamic text color
    >
      {/* <img src={img || 'default-image.png'} /> // Provide alt text for accessibility */}
      <div>{tag}</div>
      <div
        className="Score"
        style={{
          color: isHovered ? color : 'var(--white-soft)', // Apply dynamic color on hover
          transition: 'color 0.5s ease' // Smooth transition
        }}
      >
        {score}
      </div>
    </button>
  )
}
