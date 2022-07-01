import { Component, OnInit } from '@angular/core';
import { Web3Service, Web3Status } from "./services/web3.service";
import { BalanceService } from "./services/balance.service";
import { Observable } from "rxjs";
import { IPopupViewModel, PopupService } from "./services/popup.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ethBingo';

  public currentBingoBalance$: Observable<string> = this.balanceService.balance$;
  public balanceIsUpdated$: Observable<boolean> = this.balanceService.balanceIsIsUpdated$;
  public showPopup$: Observable<boolean> = this.popupService.showPopup$;
  public popupViewModel$: Observable<IPopupViewModel> = this.popupService.popupViewModel$;
  public web3Status!: Web3Status;
  public web3StatusType = Web3Status;

  constructor(
    private web3Service: Web3Service,
    private balanceService: BalanceService,
    private popupService: PopupService,
  ) {
    this.web3Service.web3Status$.subscribe(status => this.web3Status = status);
  }

  async ngOnInit(): Promise<void> {
    await this.web3Service.initializeWeb3();
  }

  public closePopup() {
    this.popupService.closePopup();
  }

  public get isConnected(): boolean {
    return this.web3Status === Web3Status.Connected;
  }

  public signIn() {
    this.web3Service.initializeAccount();
  }

}
