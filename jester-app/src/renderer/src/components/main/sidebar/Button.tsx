import '@renderer/assets/components/main/sidebar/Button.css';

interface ButtonProp {
    tag: string;
    score: number;
    img: string; // Optional property
  }

  
export const Button: React.FC<ButtonProp> = ({ tag, score, img }) => {
  return (
    <button className="Button">
      {tag} {score} {img}
    </button>
  )
}
