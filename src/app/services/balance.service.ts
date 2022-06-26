import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

const BALANCE_UPDATING_PHRASE = 'balance is updating...';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private balance: BehaviorSubject<string> = new BehaviorSubject<string>(BALANCE_UPDATING_PHRASE);
  private balanceIsUpdated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  public get balance$(): Observable<string> {
    return this.balance.asObservable();
  }

  public get balanceIsIsUpdated$(): Observable<boolean> {
    return this.balanceIsUpdated.asObservable();
  }

  public updateBalance$(newBalance: string) {
    this.balance.next(newBalance);
    this.balanceIsUpdated.next(true);
  }

  public startUpdatingBalanceProcess(): void {
    this.balanceIsUpdated.next(false);
    this.balance.next(BALANCE_UPDATING_PHRASE);
  }
}
