import logo from './logo.svg';
import './App.css';
import WalletCard from './WalletCard';
import SellGX from './SellGX'
import BuyGX from './BuyGX';
// import Transfer from './Transfer';

function App() {
  return (
    <div className="App">
    <WalletCard/>
    <BuyGX/>
    <SellGX/>
    </div>
  );
}

export default App;
