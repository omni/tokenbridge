import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import erc20Abi from "./abi/ERC20Custom.abi.json"
import foreignMediatorAbi from "./abi/HomeAmbE2e.abi.json";
import config from "./config.json";

const SellGX = () => {
  const [sellButtonText, setSellButtonText] = useState('send');
  // const [errorMessage, setErrorMessage] = useState(null);
  // const [myOutput, setMyOutput] = useState(null);
  const sellGXHandler = async () => {
    console.log('bridging');
    // get signer
    const sellNGX = document.getElementById("sellNGX").value;
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const erc20Contract = new ethers.Contract(
      config.erc20,
      erc20Abi,
      signer
    );
    const foreignMediatorContract = new ethers.Contract(
      config.foreignMediator,
      foreignMediatorAbi,
      signer
    );
    // prepare parameters for contract method
    // const myAddr = await signer.getAddress();
    // call contract method
    const approved = await erc20Contract.approve(
      config.foreignMediator,
      ethers.utils.parseEther(sellNGX),
    );
    const relayed = await foreignMediatorContract.relayTokens(
      signer.getAddress(),
      ethers.utils.parseEther(sellNGX),
    );

    if(approved && relayed){
      console.log(approved['hash']);
      console.log(relayed['hash']);
      setSellButtonText('bridged');
    }
    // setMyOutput('done');
  }
  return(
    <div className='sellGX'>
    <h3> {"GX to wGX(sign twice)"} </h3>
    <input type="text" id="sellNGX"></input>
    <button onClick={sellGXHandler}>{sellButtonText}</button>
    </div>
  )
}

export default SellGX;
