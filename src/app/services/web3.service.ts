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
  code: number
}

interface IWeb3Window extends Window {
  ethereum: any;
  web3: any;
}

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private metamaskWeb3!: Web3;
  private metamaskProvider: any;
  private web3window = <IWeb3Window><unknown>window;
  private account!: string;
  private privateKey!: string;

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

  public async connectMetamask(): Promise<void> {
    if (!this.web3window.ethereum && !this.web3window.web3) {
      this.popup.setPopup(PopupTitle.Error, 'Please, install MetaMask extension on your browser and then continue');
      return;
    }
    this.setMetamask();
    await this.initializeAccount();
    this.initializeWeb3();
    // if (this.account) {
    //   await this.getEncryptedPrivateKey();
    // }
    // if (this.privateKey) {
    // }
  }

  private setMetamask() {
    if (this.web3window.ethereum) {
      this.metamaskProvider = this.web3window.ethereum;
      this.metamaskWeb3 = new Web3(this.metamaskProvider);
      return;
    }
    // this.metamaskProvider = this.web3window.web3;
    // this.metamaskWeb3 = new Web3(this.metamaskProvider);
  }

  public initializeWeb3(): void {
    this.provider = new Web3.providers.WebsocketProvider('wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ');
    this.web3 = new Web3(this.provider);
    this.web3.eth.handleRevert = true;

    this.setAccountDetails();
    this.getBingoBalance();
    this.getTicketPrice();
    this.onBalanceEvent();
  }

  public setAccountDetails(): void {
    this.contract = new this.web3.eth.Contract(
      this.jsonInterfaces,
      '0x9122Cad82131A8B4254E4442d701d69303d92C06', {
        gasPrice: '40000',
        gas: 40000,
        from: this.account,
      });
    this.web3.eth.defaultAccount = this.account;
    // this.web3.eth.accounts.wallet.add('0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1');
    // console.log('this wallet', this.web3.eth.accounts.wallet);
    // this.web3.eth.accounts.wallet.decrypt(this/);
  }

  public sendPromocode(promocode: string) {
    const inHex = Web3.utils.toHex(promocode);
    this.contract.methods.grantPromocode(inHex).send()
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('error', (error: IWeb3Error) => {
        this.onErrorCallbackForTransaction('sending Promocode', error);
        this.getBingoBalance();
      });
  }

  public async getBingoBalance(): Promise<void> {
    const bingoBalanceInWei = await this.contract.methods.getBalance().call();
    this.handleDepositUpdate(bingoBalanceInWei);
  }

  public onBalanceEvent() {
    this.contract.events.PlayerBalanceChanged({
      filter: {recipient: this.account},
    }, (err: IWeb3Error, event: any) => {
      if (err) {
        this.onErrorCallbackForTransaction('getting balance update', err);
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
        this.onErrorCallbackForTransaction('starting game', error);
        this.getBingoBalance();
      });
  }

  public async makeDeposit(valueInEther: string): Promise<void> {
    const valueInWei = Web3Service.convertToWei(valueInEther);
    // console.log('this hex', Web3.utils.toHex('50000'))
    // this.contract.methods.deposit().send({value: valueInWei, gas: 50000, gasPrice: 50000})
    //   .on('sent', (_: any) => this.onSentTransactionCallback())
    //   .on('error', (error: IWeb3Error) => {
    //     this.onErrorCallbackForTransaction('making the deposit', error);
    //     this.getBingoBalance();
    //   });


    const transactionParameter = {
      from: this.account,
      to: "0x9122Cad82131A8B4254E4442d701d69303d92C06",
      value: Web3.utils.toHex(valueInWei),
      gasPrice: Web3.utils.toHex(50000),
      // gas: Web3.utils.toHex(gasEstimate),
      data: this.contract.methods.deposit().encodeABI(),
    };
    this.metamaskProvider.request({method: 'eth_sendTransaction', params: [transactionParameter]})
      .then((transHash: any) => console.log('data', data))
      .catch((err: IWeb3Error) => console.log(err.code, err.messsage))
      // .on('sent', (data: any) => this.onSentTransactionCallbackLog('trans', data))
      // .on('confirmation', (data: any) => this.onSentTransactionCallbackLog('trans', data))
      // .on('error', (error: IWeb3Error) => {
      //   this.onErrorCallbackForTransaction('making the deposit', error);
      //   this.getBingoBalance();
      // });
  }

  public async withdraw(): Promise<void> {
    this.contract.methods.withdraw().send()
      .on('sent', (_: any) => this.onSentTransactionCallback())
      .on('error', (error: IWeb3Error) => {
        this.onErrorCallbackForTransaction('making the withdraw', error);
        this.getBingoBalance();
      });
  }

  public async initializeAccount() {
    this.account = await this.metamaskProvider.request({method: 'eth_requestAccounts'})
      .then((array: string[], err: any) => array[0])
      .catch((error: IWeb3Error) => {
        if (error.code === 4001) {
          this.popup.setPopup(PopupTitle.Error, 'User denied the authentication request');
          console.warn(`We\`ve got an error, during the authentication request`, `Error Message: ${error.message}`);
        } else {
          this.popup.setPopup(PopupTitle.Error, 'Something went wrong');
          console.warn(`We\`ve got an error, during the authentication request`, `Error Message: ${error.message}`);
        }
      });
    console.log('acc', this.account);
  }

  private async getEncryptedPrivateKey(): Promise<void> {
    console.log('this key', this.privateKey);
    this.privateKey = await this.metamaskProvider.request({
      method: 'eth_getEncryptionPublicKey',
      params: [this.account],
    }).catch((error: IWeb3Error) => {
        if (error.code === 4001) {
          this.popup.setPopup(PopupTitle.Error, 'User denied access to EncryptionPublicKey');
          console.warn(`We\`ve got an error, during getting EncryptionPublicKey`, `Error Message: ${error.message}`);
        } else {
          this.popup.setPopup(PopupTitle.Error, 'Something went wrong');
          console.warn(`We\`ve got an error, during getting EncryptionPublicKey`, `Error Message: ${error.message}`);
        }
      });
    // console.log('this key', const privKey = Buffer.from(this.privateKey));
    // this.metamaskProvider.request({
    //   method: 'eth_decrypt',
    //   params: [this.privateKey, this.account],
    // }).then((res: any) => console.log('this res', res));
  }

  private handleDepositUpdate(balanceInWei: string) {
    const bingoBalanceInEther = Web3Service.convertToEther(balanceInWei);
    this.balanceService.updateBalance$(bingoBalanceInEther);
  }

  private onErrorCallbackForTransaction(functionName: string, error: IWeb3Error) {
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
