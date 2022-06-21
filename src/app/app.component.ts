import { Component, OnInit } from '@angular/core';
import { Web3Service } from "./services/web3.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'ethBingo';

  public currentBingoBalance!: string;

  constructor(private web3Service: Web3Service) {

  }

  async ngOnInit(): Promise<void> {
    this.web3Service.createWeb3Instances();
    this.currentBingoBalance = await this.web3Service.getBingoBalance();
  }


}
