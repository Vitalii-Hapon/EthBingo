import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PlayService {
  private gameCanBeStarted = new BehaviorSubject(false);
  private gameRejected = new BehaviorSubject(false);

  constructor() { }

  public get gameCanBeStarted$() {
    return this.gameCanBeStarted.asObservable();
  }

  public get gameRejected$() {
    return this.gameRejected.asObservable();
  }

  public startGame() {
    this.gameCanBeStarted.next(true);
  }

  public gameFinished() {
    this.gameCanBeStarted.next(false);
  }

  public rejectGame() {
    this.gameRejected.next(true);
  }

  public resetGameReject() {
    this.gameRejected.next(false);
  }
}
