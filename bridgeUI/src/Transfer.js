import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import erc677Abi from "./abi/PermittableToken.json";
import config from "./config.json";

const Transfer = () => {
  const [transferButtonText, setTransferButtonText] = useState('transfer');
  const transferHandler = async () => {
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;
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
    const result = await contract.transfer(
      to,
      ethers.utils.parseEther(amount),
    );
  }
  return(
    <div className='Transfer'>
    <h3> {"Transfer"} </h3>
    <label for="to">To: </label>
    <input type="text" id="to" name="to" value="0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73" size="43"></input><br></br>
    <label for="amount">Amount(Ether): </label>
    <input type="text" id="amount" name="amount"></input><br></br>
    <button onClick={transferHandler}>{transferButtonText}</button>
    </div>
  )
}
export default Transfer;
