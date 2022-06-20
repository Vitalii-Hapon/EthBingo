import { Injectable } from '@angular/core';
import Web3 from 'web3';
// import { Contract } from "web3-eth-contract";

// const Web3 = require('web3');
const Web3EthContract = require('web3-eth-contract');

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  public web3!: Web3;
  public contract!: any;
  private provider: any;

  constructor() { }

  public createWeb3() {
    // @ts-ignore
    // if (window.ethereum) {
    // } else {
    //   window.alert('please, install MetaMask extension on your browser and then continue');
    // }

    this.provider = new Web3.providers.WebsocketProvider('wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ');
    this.web3 = new Web3('wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ');
    this.contract = new Web3EthContract([], '0xFc4eC7908959057894A67d32aEC1123d59aE34aA', {from: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174'});
    // console.log('this this.contract', this.contract.methods)
    // this.contract.methods.getBalance().call({}, (err: Error, result: any) => {
    //   if (err) {
    //     console.log('this error', err.message)
    //   }
    //   if (result) {
    //     console.log('this result', result)
    //   }
    // }).then(res2 => console.log('this res2', res2));
    // this.web3 = new Web3(window.ethereum);
    // console.log('this.web3', this.web3);

  // @ts-ignore
  //   this.contract = new this.web3.eth.Contract([], '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4', {from: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174'});
  //   this.contract.methods.getBalance().call().then(res => console.log('this res', res)).catch(err => console.log('this error', err.message));

  }

  public runSmartContract() {
  }
}
