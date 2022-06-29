import { Component, OnInit } from '@angular/core';
import { Web3Service } from "./services/web3.service";
import { BalanceService } from "./services/balance.service";
import { Observable } from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'ethBingo';

  public currentBingoBalance$: Observable<string> = this.balanceService.balance$;

  constructor(
    private web3Service: Web3Service,
    private balanceService: BalanceService,

    ) {

  }

  async ngOnInit(): Promise<void> {
    this.web3Service.createWeb3Instances();
    this.web3Service.onBalanceEvent();
  }

}
