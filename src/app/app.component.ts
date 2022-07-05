import { Component, OnInit } from '@angular/core';
import { Web3Service, Web3Status } from "./services/web3.service";
import { BalanceService } from "./services/balance.service";
import { Observable } from "rxjs";
import { IPopupViewModel, PopupService } from "./services/popup.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ethBingo';

  public initialized = false;

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
    private router: Router,
  ) {
    this.web3Service.web3Status$.subscribe(status => this.web3Status = status);
  }

  public ngOnInit(): void {
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

  public async initClick(): Promise<void> {
    this.initialized = true;
    await this.web3Service.initializeWeb3();
    this.router.navigate(['']);
  }

}
