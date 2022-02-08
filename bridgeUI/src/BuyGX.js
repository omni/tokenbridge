import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import erc677Abi from "./abi/PermittableToken.json";
import config from "./config.json";

const BuyGX = () => {
  const [buyButtonText, setBuyButtonText] = useState('send');
  // const [errorMessage, setErrorMessage] = useState(null);
  // const [myOutput, setMyOutput] = useState(null);
  const buyGXHandler = async () => {
    console.log('bridging');
    // get signer
    const buyNGX = document.getElementById("buyNGX").value;
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.erc677,
      erc677Abi,
      signer
    );
    // prepare parameters for contract method
    // const myAddr = await signer.getAddress();
    // call contract method
    const result = await contract.transferAndCall(
      config.homeMediator,
      ethers.utils.parseEther(buyNGX),
      "0x"
    );
    console.log(result['hash']);
    if(result){
      setBuyButtonText('bridged');
    }
    // setMyOutput('done');
  }
  return(
    <div className='buyGX'>
    <h3> {"wGX to GX(sign once)"} </h3>
    <input type="text" id="buyNGX"></input>
    <button onClick={buyGXHandler}>{buyButtonText}</button>
    </div>
  )
}

export default BuyGX;
