import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

const BALANCE_UPDATING_PHRASE = 'ticket price is updating...';

@Injectable({
  providedIn: 'root'
})
export class TicketPriceService {
  private ticketPrice: BehaviorSubject<string> = new BehaviorSubject<string>(BALANCE_UPDATING_PHRASE);
  private ticketPriceIsUpdated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  public get ticketPrice$(): Observable<string> {
    return this.ticketPrice.asObservable();
  }

  public get ticketPriceIsUpdated$(): Observable<boolean> {
    return this.ticketPriceIsUpdated.asObservable();
  }

  public get ticketPriceValue(): string {
    return this.ticketPrice.getValue();
  }

  public updateTicketPrice$(newPrice: string) {
    this.ticketPrice.next(newPrice);
    this.ticketPriceIsUpdated.next(true);
  }

  public startUpdatingTicketPriceProcess(): void {
    this.ticketPrice.next(BALANCE_UPDATING_PHRASE);
  }
}
