import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

const BALANCE_UPDATING_PHRASE = 'balance is updating...';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private balance: BehaviorSubject<string> = new BehaviorSubject<string>('BALANCE_UPDATING_PHRASE');

  constructor() { }

  public get balance$(): Observable<string> {
    return this.balance.asObservable();
  }

  public updateBalance$(newBalance: string) {
    this.balance.next(newBalance);
  }

  public startUpdatingBalanceProcess(): void {
    this.balance.next(BALANCE_UPDATING_PHRASE);
  }
}
