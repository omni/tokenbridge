import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from 'ethers';
import erc677Abi from "./abi/PermittableToken.json";
import erc20Abi from "./abi/ERC20Custom.abi.json"
import config from "./config.json";

const WalletCard = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null);
  const [userGXBalance, setUserGXBalance] = useState(null);
  const [userWGXBalance, setUserWGXBalance] = useState(null);
  const [connButtonText, setConnButtonText] = useState('Connect Wallet');

  const connectWalletHandler = () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      console.log('MetaMask Here!');

      window.ethereum.request({ method: 'eth_requestAccounts'})
        .then(result => {
          accountChangedHandler(result[0]);
          setConnButtonText('Wallet Connected');
          getAccountBalance(result[0]);
        })
        .catch(error => {
          setErrorMessage(error.message);

        });

    } else {
      console.log('Need to install MetaMask');
      setErrorMessage('Please install MetaMask browser extension to interact');
    }
  }

  // update account, will cause component re-render
  const accountChangedHandler = (newAccount) => {
    setDefaultAccount(newAccount);
    getAccountBalance(newAccount.toString());
  }

  const getAccountBalance = async (account) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // // init contract
    const erc677Contract = new ethers.Contract(
      config.erc677,
      erc677Abi,
      signer
    );
    const erc20Contract = new ethers.Contract(
      config.erc20,
      erc20Abi,
      signer
    );
    erc677Contract.balanceOf(signer.getAddress())
      .then(balance => {
        setUserWGXBalance(ethers.utils.formatEther(balance));
      }).catch(error => {
        // setErrorMessage(error.message);
        setErrorMessage("On GXC");
    });
    erc20Contract.balanceOf(signer.getAddress())
      .then(balance => {
        setUserGXBalance(ethers.utils.formatEther(balance));
      }).catch(error => {
        // setErrorMessage(error.message);
        setErrorMessage("On Polygon");
      });
  };

  const chainChangedHandler = () => {
    // reload the page to avoid any errors with chain change mid use of application
    // window.location.reload();
    window.ethereum.request({ method: 'eth_requestAccounts'})
      .then(result => {
        accountChangedHandler(result[0]);
        getAccountBalance(result[0]);
      })
      .catch(error => {
        setErrorMessage(error.message);

      });
  }



  // listen for account changes
  window.ethereum.on('accountsChanged', accountChangedHandler);

  // window.ethereum.on('chainChanged', chainChangedHandler);
  window.ethereum.on('chainChanged', chainChangedHandler);


  return(
    <div className='walletCard'>
    <h3> {"Account Balance"} </h3>
    <button onClick={connectWalletHandler}>{connButtonText}</button>
    <div className='accountDisplay'>
    <h4>Address: {defaultAccount}</h4>
    </div>
    <div className='balanceDisplay'>
    <h5>wGX Balance: {userWGXBalance}</h5>
    <h5>GX Balance: {userGXBalance}</h5>
    </div>
    {errorMessage}
    </div>
  )
}
export default WalletCard;
