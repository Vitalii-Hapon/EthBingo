import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AbiItem } from "web3-utils";

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
    // this.contract = new Web3EthContract([], '0xFc4eC7908959057894A67d32aEC1123d59aE34aA', {from: '0xaC043baaE3055E8397Fd0B6B820262EAAfc6B174'});
    // console.log('this this.contract', this.contract.methods)
    // this.contract.methods.getBalance().call().then(res2 => console.log('this res2', res2));
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

    // const jsonInterface = this.web3.eth.abi.encodeFunctionSignature({
    //   name: 'getBalance',
    //   type: 'function',
    //   outputs: [{
    //     type: 'uint256',
    //     name: 'myBalance'
    //   }]
    // });
    const jsonInterface: AbiItem[] = [{
      name: "getBalance",
      inputs: [{
        type: 'uint256',
        name: 'myBalance'
      }],
      outputs: [{
        type: 'uint256',
        name: 'myBalance'
      }],
      type: "function"
    },
      {
        name: "getTicketPrice",
        inputs: [],
        outputs: [{
          type: 'uint256',
          name: 'ticketPrice'
        }],
        type: "function"
      }];
    // gwei; wie efir;
    this.contract = new this.web3.eth.Contract(jsonInterface, '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4');
    // this.contract = new this.web3.eth.Contract(jsonInterface, '0xFF0AED2b68aABC2fEF9c7342AA78c4ee7602A1b4', {gas: Web3.utils.toBN('900000000000000000').toNumber()});
    this.contract.methods.getBalance().call().then((res: any) => console.log('this res', res)).catch((err: Error) => console.log('this error', err.message));
  }

  public runSmartContract() {
  }
}
