import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { WebsocketProvider } from "web3-core";

const convert = require('ether-converter');

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  private web3!: Web3;
  private contract!: Contract;
  private provider!: WebsocketProvider;
  private jsonInterfaces: AbiItem[] = [
    {
      name: "getBalance",
      type: "function",
      inputs: [],
      outputs: [{
        type: 'uint256',
        name: 'myBalance'
      }]
    },
    {
      name: "getTicketPrice",
      type: "function",
      inputs: [],
      outputs: [{
        type: 'uint256',
        name: 'ticketPrice'
      }]
    },
    {
      name: "getAddressGameHistory",
      type: "function",
      inputs: [],
      outputs: [{
        type: 'uint8[][]',
        name: 'history'
      }]
    },
    {
      name: "deposit",
      type: "function",
      inputs: [],
      outputs: [{
        type: 'uint256',
        name: 'myBalance'
      }]
    }];

  constructor() { }

  public createWeb3Instances(): void {
    // @ts-ignore
    // if (window.ethereum) {
    // } else {
    //   window.alert('please, install MetaMask extension on your browser and then continue');
    // }

    this.provider = new Web3.providers.WebsocketProvider('wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ');
    this.web3 = new Web3(this.provider);
    this.contract = new this.web3.eth.Contract(this.jsonInterfaces, '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4');


    this.contract.defaultAccount = '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174';

  }

  public async getBingoBalance(): Promise<string> {
    const bingoBalanceInWei = await this.contract.methods.getBalance().call();
    const bingoBalanceInEther = convert(bingoBalanceInWei, 'wei', 'ether');
    console.log('this', bingoBalanceInEther);
    return bingoBalanceInEther;
  }

  public async getTicketPrice(): Promise<string> {
    const ticketPriceInWei = await this.contract.methods.getTicketPrice().call();
    const ticketPriceInEther = convert(ticketPriceInWei, 'wei', 'ether');
    return ticketPriceInEther;
  }

  public async getAddressGameHistory(): Promise<string> {
    const addressGameHistory = await this.contract.methods.getAddressGameHistory().call();
    return addressGameHistory;
  }

  public async makeDeposit(): Promise<void> {
    const ticketPriceInEther = await this.getTicketPrice();
    const ticketPriceInWei = convert(ticketPriceInEther, 'ether', 'gwei');
    console.log('this ticket privce', ticketPriceInWei);
    const newBalanceInWei = await this.contract.methods.deposit().call({gasPrice: ticketPriceInWei});
    const newBalanceInEther = convert(newBalanceInWei, 'wei', 'ether');
    console.log('this', newBalanceInEther);
    return newBalanceInEther;
  }

}
