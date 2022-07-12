import { Inject, Injectable, InjectionToken } from '@angular/core';
import Web3 from 'web3';
import { AbiItem } from "web3-utils";
import { Contract, EventData } from "web3-eth-contract";
import { WebsocketProvider } from "web3-core";
import { BalanceService } from "./balance.service";
import { TicketPriceService } from "./ticket-price.service";
import { PopupService, PopupTitle } from "./popup.service";
import { BehaviorSubject, Observable } from "rxjs";
import { PlayService } from "./play.service";
import { distinctUntilChanged } from "rxjs/operators";

interface IWeb3Error extends Error {
  reason: string;
  receipt: any;
  code: number
}

interface IWeb3Window extends Window {
  ethereum: any;
  web3: any;
}

export enum Web3Status {
  MetamaskIsNotDefined,
  MetamaskDefined,
  AccountRejected,
  Connected,
  Disconnected,
}

const WebSocketHost = new InjectionToken<string>(
  'WebSocketHost',
  {providedIn: "root", factory: () => 'wss://eth-goerli.alchemyapi.io/v2/wi9aNLc5ianem3nYTGf-G_wBzuM76DPZ'}
);

const ContractAddress = new InjectionToken<string>(
  'ContractAddress',
  {providedIn: "root", factory: () => '0x2Dc21F40228FFc99f361A5f2f0CF71BDef6Bede6'}
);

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  public web3Status: BehaviorSubject<Web3Status> = new BehaviorSubject<Web3Status>(Web3Status.Disconnected);
  private metamaskProvider: any;
  private web3window = <IWeb3Window><unknown>window;
  private account!: string;
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
      outputs: []
    }, {
      name: "PlayerErrorOccured",
      type: "event",
      inputs: [{
        type: 'address',
        name: 'recipient'
      }, {
        type: 'string',
        name: 'reason',
      }],
      outputs: []
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
      name: "withdrawCopy",
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
    @Inject(ContractAddress) private contractAddress: string,
    @Inject(WebSocketHost) private webSocketHost: string,
    private playService: PlayService,
  ) { }

  public get web3Status$(): Observable<Web3Status> {
    return this.web3Status.asObservable();
  }

  public get defaultTransParams() {
    return {
      from: this.account,
      to: this.contractAddress,
    };
  }

  public static convertToWei(valueInEther: string): string {
    return Web3.utils.toWei(valueInEther, 'ether');
  }

  public static convertToEther(valueInWei: string): string {
    return Web3.utils.fromWei(valueInWei, 'ether');
  }

  public static convertToBigint(valueInEther: string): bigint {
    return BigInt(this.convertToWei(valueInEther));
  }

  public static getMultipleEtherValue(argInEther: string, multiplier: number): string {
    const valueInBigInt: string = (Web3Service.convertToBigint(argInEther) * BigInt(multiplier)).toString();
    return Web3Service.convertToEther(valueInBigInt);
  }

  public async initializeWeb3(): Promise<void> {
    if (!this.web3window.ethereum && !this.web3window.web3) {
      this.web3Status.next(Web3Status.MetamaskIsNotDefined);
      return;
    }
    this.setMetamaskProvider();
    this.setConnectionHandler();
    this.web3Status$
      .pipe(distinctUntilChanged())
      .subscribe(status => {
      console.log('status', status)
      switch (status) {
        case Web3Status.MetamaskDefined: {
          this.initializeAccount();
          break;
        }
        case Web3Status.Connected: {
          this.setWeb3Details();
          this.getAppData();
          break;
        }
        case Web3Status.Disconnected: {
          window.location.reload();
        }
      }
    })
  }

  public setWeb3Details(): void {
    this.provider = new Web3.providers.WebsocketProvider(this.webSocketHost);
    this.web3 = new Web3(this.provider);
    this.web3.eth.handleRevert = true;
    this.contract = new this.web3.eth.Contract(
      this.jsonInterfaces,
      this.contractAddress, {
        gasPrice: '40000',
        gas: 40000,
        from: this.account,
      });
    this.web3.eth.defaultAccount = this.account;
  }

  public sendPromocode(promocode: string) {
    const inHex = Web3.utils.toHex(promocode);

    const transactionParameter = {
      ...this.defaultTransParams,
      gasPrice: Web3.utils.toHex(50000),
      data: this.contract.methods.grantPromocode(inHex).encodeABI(),
    };
    this.metamaskProvider.request({method: 'eth_sendTransaction', params: [transactionParameter]})
      .then((transHash: any) => {
        this.onSentTransactionCallback(transHash);
      })
      .catch((error: IWeb3Error) => this.onErrorCallbackForTransaction('sending the promocode', error))
  }

  public async getBingoBalance(): Promise<void> {
    const bingoBalanceInWei = await this.contract.methods.getBalance().call();
    console.log('this balance', bingoBalanceInWei);
    this.handleBalanceUpdate(bingoBalanceInWei)
  }

  public onBalanceEvent() {
    this.contract.events.PlayerBalanceChanged({
      filter: {recipient: this.account},
    }, (err: IWeb3Error, event: any) => {
      if (err) {
        this.onErrorCallbackForTransaction('getting balance update', err);
      }
      if (event) {
        this.handleBalanceUpdate(event.returnValues.recipientBalance);
      }
    });
  }

  private onError() {
    this.contract.once('PlayerErrorOccured',{
      filter: {recipient: this.account},
    }, (err: Error, event: any) => {
      if (err) {
        this.onErrorCallbackForTransaction('getting error update', <IWeb3Error>err);
      }
      if (event) {
        this.onErrorCallbackForTransaction(
          'sending a transaction', {reason: event.returnValues.reason, message: event.returnValues.reason});
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
    this.balanceService.freezeBalanceForGame();
    const transactionParameter = {
      ...this.defaultTransParams,
      gasPrice: Web3.utils.toHex(50000),
      data: this.contract.methods.play(tickets).encodeABI(),
    };
    this.metamaskProvider.request({method: 'eth_sendTransaction', params: [transactionParameter]})
      .then((transHash: any) => {
        this.onSentTransactionCallback(transHash);
        this.playService.startGame();
      })
      .catch((error: IWeb3Error) => {
        this.playService.rejectGame();
        this.balanceService.updateBalanceAfterFreeze();
        this.onErrorCallbackForTransaction('starting the game', error);
      })
  }

  public async makeDeposit(valueInEther: string): Promise<void> {
    const valueInWei = Web3Service.convertToWei(valueInEther);

    const transactionParameter = {
      ...this.defaultTransParams,
      value: Web3.utils.toHex(valueInWei),
      gasPrice: Web3.utils.toHex(50000),
      data: this.contract.methods.deposit().encodeABI(),
    };
    this.metamaskProvider.request({method: 'eth_sendTransaction', params: [transactionParameter]})
      .then((transHash: any) => {
        this.onSentTransactionCallback(transHash);
      })
      .catch((error: IWeb3Error) => this.onErrorCallbackForTransaction('making the deposit', error))
  }

  public async withdraw(): Promise<void> {
    const transactionParameter = {
      ...this.defaultTransParams,
      gasPrice: Web3.utils.toHex(50000),
      data: this.contract.methods.withdraw().encodeABI(),
    };
    this.metamaskProvider.request({method: 'eth_sendTransaction', params: [transactionParameter]})
      .then((transHash: any) => {
        this.onSentTransactionCallback(transHash);
      })
      .catch((error: IWeb3Error) => this.onErrorCallbackForTransaction('making the withdraw', error));
  }

  public async initializeAccount() {
    await this.metamaskProvider.request({method: 'eth_requestAccounts'})
      .then((array: string[]) => {
        this.account = array[0];
        this.web3Status.next(Web3Status.Connected);
      })
      .catch((error: IWeb3Error) => {
        if (error.code === 4001) {
          console.warn(`We\`ve got an error, during the authentication request`, `Error Message: ${error.message}`);
        } else {
          this.popup.setPopup(PopupTitle.Error, 'Something went wrong');
          console.warn(`We\`ve got an error, during the authentication request`, `Error Message: ${error.message}`);
        }
        this.web3Status.next(Web3Status.AccountRejected);
      });
  }

  private setConnectionHandler(): void {
    this.metamaskProvider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.web3Status.next(Web3Status.Disconnected);
      }
    });
  }

  private setMetamaskProvider() {
    this.web3Status.next(Web3Status.MetamaskDefined)
    if (this.web3window.ethereum) {
      this.metamaskProvider = this.web3window.ethereum;
      return;
    }
    if (this.web3window.web3) {
      this.metamaskProvider = this.web3window.web3;
    }
  }

  private getAppData(): void {
    console.log('get data');
    this.getTicketPrice();
    this.getBingoBalance();
    this.onBalanceEvent();
  }

  private handleBalanceUpdate(balanceInWei: string) {
    const bingoBalanceInEther = Web3Service.convertToEther(balanceInWei);
    this.balanceService.updateBalance(bingoBalanceInEther);
  }

  private onErrorCallbackForTransaction(functionName: string, error: IWeb3Error | {reason: string, message: string}) {
    if (error.reason) {
      this.popup.setPopup(PopupTitle.Error, error.reason);
      console.warn(`We\`ve got an error, during ${functionName}.`, `Error Reason: ${error.reason}`);
    } else {
      if (error.message !== 'MetaMask Tx Signature: User denied transaction signature.') {
        this.popup.setPopup(PopupTitle.Error, 'Something went wrong');
      }
      console.warn(`We\`ve got an error, during ${functionName}.`, `Error Message: ${error.message}`);
    }
    this.getBingoBalance();
  }

  private onSentTransactionCallback(hash: string) {
    // this.web3.eth.getTransaction(hash).then(res => {}).catch(err => console.log(`We\`ve got an error, during get transaction.`, `Error Message: ${err.message}`));

    const subs = this.web3.eth.subscribe('logs', {address: this.contractAddress}, (err, result) => {
      if (err) {
        console.log(`We\`ve got an error, during subscriptions on logs`, `Error Message: ${err.message}`);
      }
      if (result?.transactionHash === hash) {
        this.web3.eth.getTransactionReceipt(hash)
          .then(receipt => {
            // console.log('receipt', receipt);
            subs.unsubscribe();
          })
          .catch(err => { console.log(`We\`ve got an error, during get transaction receipt`, `Error Message: ${err.message}`); subs.unsubscribe()});
      }
    })
    this.onError()

    this.balanceService.startUpdatingBalanceProcess();
  }

  private onSentTransactionCallbackLog(event: string, data: any) {
    console.log(event, 'data', data);
  }

}
