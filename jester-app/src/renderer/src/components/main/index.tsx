import '@renderer/assets/index.css';
import { NavBar } from "./header/NavBar";
import { SideBar } from "./sidebar/SideBar";

interface DummyProp {
  id: string;
  score: number;
  img: string; // Optional property
}

const test: DummyProp[] = [
    {
      id: 'BTC-1',
      score: 50,
      img: 'null',
    },
    {
      id: 'ETH-1',
      score: 34,
      img: 'null',
    },
    {
      id: 'DOGE-1',
      score: -23,
      img: 'null',
    },
    {
      id: 'BTC-2',
      score: 50,
      img: 'null',
    },
    {
      id: 'ETH-2',
      score: 34,
      img: 'null',
    },
    {
      id: 'DOGE-2',
      score: -23,
      img: 'null',
    },
    {
      id: 'BTC-3',
      score: 50,
      img: 'null',
    },
    {
      id: 'ETH-3',
      score: 34,
      img: 'null',
    },
    {
      id: 'DOGE-3',
      score: -23,
      img: 'null',
    },
  ]

export const Main = () => {
    return (
    <div className='Wrapper'>
      <NavBar/>
      <div className='Container'>
        <SideBar data={test}/>
      </div>
    </div>
    )
}