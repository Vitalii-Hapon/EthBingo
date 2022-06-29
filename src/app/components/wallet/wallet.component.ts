import { Component, OnDestroy, OnInit } from '@angular/core';
import { Web3Service } from "../../services/web3.service";
import { TicketPriceService } from "../../services/ticket-price.service";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { BalanceService } from "../../services/balance.service";

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, OnDestroy {
  public ticketPrice!: string;
  public ticketPriceAsBigInt!: BigInt;
  public ticketPriceIsGot: boolean = false;
  public balance$: Observable<string> = this.balanceService.balance$;
  public promocode: boolean = false;
  public promocodeValue: string = '';

  private ngUnsubscribe: Subject<any> = new Subject<any>();

  constructor(
    private web3Service: Web3Service,
    private balanceService: BalanceService,
    private ticketPriceService: TicketPriceService,
  ) { }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public ngOnInit(): void {
    this.ticketPriceService.ticketPriceIsUpdated$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(ticketPriceIsUpdated => {
      if (ticketPriceIsUpdated) {
        this.ticketPrice = this.ticketPriceService.ticketPriceValue;
        this.ticketPriceAsBigInt = Web3Service.convertToBigint(this.ticketPrice);
        this.ticketPriceIsGot = true;
      } else {
        this.ticketPrice = this.ticketPriceService.ticketPriceValue;
        this.ticketPriceIsGot = false;
        this.ticketPriceAsBigInt = BigInt(0);
      }
    })
  }

  public makeDeposit(value: string): void {
    this.web3Service.makeDeposit(value);
  }

  public getDepositPrice(multiplier: number): string {
    const depositValue = this.ticketPriceIsGot ? this.getDepositValue(multiplier) : this.ticketPrice;
    return `Make deposit - ${depositValue}`;
  }

  public getDepositValue(multiplier: number): string {
    const depositValueInBigInt: string = (<bigint>this.ticketPriceAsBigInt * BigInt(multiplier)).toString();
    return Web3Service.convertToEther(depositValueInBigInt);
  }

  public withdrawMoney(): void {
    this.web3Service.withdraw();
  }

  public balanceIsNegative(balance: string): boolean {
    return !Number(balance);
  }

  public depositIsDisable(balance: string, ticketPriceAsBigInt: BigInt): boolean {
    return !(ticketPriceAsBigInt && Number(balance));
  }

  public usePromocode(): void {
    this.promocode = true;
  }

  public sendPromocode(): void {
    this.web3Service.sendPromocode(this.promocodeValue);
    this.closePromocode();
  }

  public closePromocode(): void {
    this.promocode = false;
  }
}
