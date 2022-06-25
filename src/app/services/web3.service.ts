import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { WebsocketProvider } from "web3-core";
import { BalanceService } from "./balance.service";

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
    },
    {
      name: "withdraw",
      type: "function",
      inputs: [],
      outputs: [{
        type: 'bool',
        name: 'isWithdrawSuccess'
      }]
    }];

  constructor(
    private balanceService: BalanceService,
  ) { }

  public createWeb3Instances(): void {
    // @ts-ignore
    if (window.ethereum) {
      // @ts-ignore
      console.log('this account', window.ethereum.currentProvider)
      // @ts-ignore
      console.log('this window vw3', window.web3)
    } else {
      window.alert('please, install MetaMask extension on your browser and then continue');
    }

    this.provider = new Web3.providers.WebsocketProvider('wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ');
    this.web3 = new Web3(this.provider);
    this.contract = new this.web3.eth.Contract(
      this.jsonInterfaces,
      '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4', {
        gasPrice: '40000',
        gas: 40000
      });

    this.setAccountDetails();
    this.getBingoBalance();
  }

  public setAccountDetails(): void {
    this.web3.eth.defaultAccount = '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174';
    this.web3.eth.accounts.wallet.add('a824a62f62f4565271e6a0a19da3c58c73785250942c0d09aafe0fb98e94024f');
  }

  public async getBingoBalance(): Promise<void> {
    const bingoBalanceInWei = await this.contract.methods.getBalance().call();
    const bingoBalanceInEther = convert(bingoBalanceInWei, 'wei', 'ether');
    this.balanceService.updateBalance$(bingoBalanceInEther);
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

  private onErrorCallback(functionName: string, error: Error) {
    console.warn(`We\`ve got an error, while making ${functionName}:`, error.name, error.message);
  }

  private onSentTransactionCallback() {
    this.balanceService.startUpdatingBalanceProcess();
  }

  public async makeDeposit(value: string): Promise<void> {
    // this.contract.methods.withdraw().send({from: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174', gasPrice: 40000, gas: 40000})
    this.contract.methods.deposit().send({value: value})
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('receipt', (receipt: any) => {
        console.log('this receipt', receipt);
        this.getBingoBalance();
      })
      .on('error', (error: Error) => this.onErrorCallback('makeDeposit', error));
    // const ticketPriceInEther = await this.getTicketPrice();
    // const ticketPriceInWei = convert(ticketPriceInEther, 'ether', 'wei');
    // console.time('start transaction')
    // console.log('this ticket privce', ticketPriceInWei, typeof ticketPriceInWei);
    // // const newBalanceInWei = await this.web3.eth.sendTransaction({
    // this.web3.eth.sendTransaction({
    //   from: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174',
    //   to: '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4',
    //   value: this.web3.utils.toWei('0.005', 'ether'),
    //   gasPrice: 40000,
    //   gas: 40000,
    // }).on('transactionHash', (hash: any) => {
    //   console.log('this transactionHash', hash);
    //   console.timeLog('start transaction');
    // })
    //   .on('confirmation', (confirmationNumber: any, receipt: any) => {
    //     console.log('this confirmation', confirmationNumber, receipt);
    //     console.timeLog('start transaction');
    //   })
    //   .on('receipt', (receipt: any) => {
    //     console.log('this receipt', receipt);
    //     console.timeLog('start transaction');
    //   })
    //   .on('error', (error: any) => {
    //     console.log('this error', error);
    //     console.timeLog('start transaction');
    //   });
    // const newBalanceInWei = await this.contract.methods.deposit().send({gasPrice: ticketPriceInWei, from: this.contract.defaultAccount});
    // console.log('this newBalanceInWei', newBalanceInWei, JSON.stringify(newBalanceInWei));
    // this.contract.methods.deposit()
    //   .send({gasPrice: ticketPriceInWei, from: this.contract.defaultAccount})
    //   .on('transactionHash', (hash: any) => {
    //     console.log('this transactionHash', hash);
    //   })
    //   .on('confirmation', (confirmationNumber: any, receipt: any) => {
    //     console.log('this confirmation', confirmationNumber, receipt);
    //   })
    //   .on('receipt', (receipt: any) => {
    //     console.log('this receipt', receipt);
    //   })
    //   .on('error', (error: any) => {
    //     console.log('this error', error);
    //   });
    // const newBalanceInEther = convert(newBalanceInWei, 'wei', 'ether');
    // console.log('this', newBalanceInEther);
    // return newBalanceInEther;
  }


  public async withdraw(): Promise<void> {
    this.contract.methods.withdraw().send()
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('receipt', (_: any) => this.getBingoBalance())
      .on('error', (error: Error) => this.onErrorCallback('withdraw', error));
  }

  public getAccount() {
    // @ts-ignore
    if (window.ethereum) {
      // @ts-ignore
      // const metamaskProvide = window.ethereum;
      // const metamaskWeb3 = new Web3(metamaskProvide);
      // const account = metamaskWeb3.defaultAccount;
      // const accounts = metamaskWeb3.eth.accounts;
      // console.log('this accaount', account);
      // console.log('this accaounts', accounts);
      // metamaskWeb3.eth.getAccounts().then(acc => console.log('this acc', acc));
      // metamaskWeb3.eth.requestAccounts().then(res =>console.log('this request', res));
      this.web3.eth.requestAccounts().then(res => console.log('this request', res))

      // @ts-ignore
      window.ethereum.request({method: eth_requestAccounts}).then(res => console.log('this acc', res));
    }
  }

}
