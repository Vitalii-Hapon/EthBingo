import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { WebsocketProvider } from "web3-core";
import { BalanceService } from "./balance.service";
import { TicketPriceService } from "./ticket-price.service";
import { PopupService, PopupTitle } from "./popup.service";

interface IWeb3Error extends Error {
  reason: string;
  receipt: any;
}

interface IWeb3Window extends Window {
  ethereum: any;
  web3: any;
}

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  private web3!: Web3;
  private contract!: Contract;
  private provider!: WebsocketProvider;
  private jsonInterfaces: AbiItem[] = [
    {
      name: "PlayerBalanceChanged",
      type: "event",
      inputs: [{
        type: 'address',
        name: 'recipient'
      }, {
        type: 'uint256',
        name: 'recipientBalance',
      }],
      outputs: [{
        type: 'uint256',
        name: 'myBalance'
      }]
    },
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
    },
    {
      name: "play",
      type: "function",
      inputs: [{
        type: 'uint8',
        name: 'ticketAmount'
      }],
      outputs: []
    },
    {
      name: "grantPromocode",
      type: "function",
      inputs: [{
        type: 'bytes32',
        name: 'promoCode'
      }],
      outputs: []
    }];

  constructor(
    private popup: PopupService,
    private balanceService: BalanceService,
    private ticketPriceService: TicketPriceService,
  ) { }

  public static convertToWei(valueInEther: string): string {
    return Web3.utils.toWei(valueInEther, 'ether');
  }

  public static convertToEther(valueInWei: string): string {
    return Web3.utils.fromWei(valueInWei, 'ether');
  }

  public static convertToBigint(valueInEther: string): BigInt {
    return BigInt(this.convertToWei(valueInEther));
  }

  public createWeb3Instances(): void {
    const web3window = <IWeb3Window><unknown>window;

    if (web3window.ethereum) {
      console.log('this account', web3window.ethereum.currentProvider)
      console.log('this window vw3', web3window)
    } else {
      window.alert('please, install MetaMask extension on your browser and then continue');
    }

    this.provider = new Web3.providers.WebsocketProvider('wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ');
    this.web3 = new Web3(this.provider);
    this.contract = new this.web3.eth.Contract(
      this.jsonInterfaces,
      '0xF7a5E70D1236C4CCdfBacdF0E13056149A5f98E8', {
        gasPrice: '40000',
        gas: 40000,
        from: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174',
      });
    this.web3.eth.handleRevert = true;
    // this.contract.options.gas = 40000;
    // this.contract.options.gasPrice = '40000';
    // this.contract.options.from = '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4';

    this.setAccountDetails();
    this.getBingoBalance();
    this.getTicketPrice();
  }

  public setAccountDetails(): void {
    this.web3.eth.defaultAccount = '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174';
    this.web3.eth.accounts.wallet.add('a824a62f62f4565271e6a0a19da3c58c73785250942c0d09aafe0fb98e94024f');
  }

  public sendPromocode(promocode: string) {
    const inHex = Web3.utils.toHex(promocode);
    this.contract.methods.grantPromocode(inHex).send()
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('error', (error: IWeb3Error) => {
        this.onErrorCallback('sending Promocode', error);
        this.getBingoBalance();
      });
  }

  public async getBingoBalance(): Promise<void> {
    const bingoBalanceInWei = await this.contract.methods.getBalance().call();
    this.handleDepositUpdate(bingoBalanceInWei);
  }

  public onBalanceEvent() {
    this.contract.events.PlayerBalanceChanged({
      filter: {recipient: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174'},
    }, (err: IWeb3Error, event: any) => {
      if (err) {
        this.onErrorCallback('getting balance update', err);
      }
      if (event) {
        this.handleDepositUpdate(event.returnValues.recipientBalance);
      }
    });
  }

  public async getTicketPrice(): Promise<void> {
    const ticketPriceInWei = await this.contract.methods.getTicketPrice().call();
    const ticketPriceInEther = Web3Service.convertToEther(ticketPriceInWei);
    this.ticketPriceService.updateTicketPrice$(ticketPriceInEther);
  }

  public async getAddressGameHistory(): Promise<string> {
    const addressGameHistory = await this.contract.methods.getAddressGameHistory().call();
    return addressGameHistory;
  }

  public play(tickets: number) {
    this.contract.methods.play(tickets).send()
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('error', (error: IWeb3Error) => {
        this.onErrorCallback('starting game', error);
        this.getBingoBalance();
      });
  }

  public async makeDeposit(valueInEther: string): Promise<void> {
    const valueInWei = Web3Service.convertToWei(valueInEther);
    this.contract.methods.deposit().send({value: valueInWei, gas: 50000, gasPrice: 50000})
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('error', (error: IWeb3Error) => {
        this.onErrorCallback('making the deposit', error);
        this.getBingoBalance();
      });
  }

  public async withdraw(): Promise<void> {
    this.contract.methods.withdraw().send()
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('error', (error: IWeb3Error) => {
        this.onErrorCallback('making the withdraw', error);
        this.getBingoBalance();
      });
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

  private handleDepositUpdate(balanceInWei: string) {
    const bingoBalanceInEther = Web3Service.convertToEther(balanceInWei);
    this.balanceService.updateBalance$(bingoBalanceInEther);
  }

  private onErrorCallback(functionName: string, error: IWeb3Error) {
    if (error.reason) {
      this.popup.setPopup(PopupTitle.Error, error.reason);
      console.warn(`We\`ve got an error, during ${functionName}.`, `Error Reason: ${error.reason}`);
    } else {
      this.popup.setPopup(PopupTitle.Error, 'Something went wrong');
      console.warn(`We\`ve got an error, during ${functionName}.`, `Error Message: ${error.message}`);
    }
  }

  private onSentTransactionCallback() {
    this.balanceService.startUpdatingBalanceProcess();
  }

  private onSentTransactionCallbackLog(event: string, data: any) {
    console.log(event, 'data', data);
  }

}
