import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

export interface GameData {
  sequence: string[];
  boards: string[][];
}

@Injectable({
  providedIn: 'root'
})
export class PlayService {
  private gameCanBeStarted = new BehaviorSubject(false);
  private gameRejected = new BehaviorSubject(false);
  public gameData: GameData | null = null;
  private gameIsGenerated = new BehaviorSubject(false);
  public winningAmount = '';
  private winningAmountUpdated = new BehaviorSubject(false);

  constructor() { }

  public get gameCanBeStarted$() {
    return this.gameCanBeStarted.asObservable();
  }

  public get gameRejected$() {
    return this.gameRejected.asObservable();
  }

  public startGame(gameDate: GameData) {
    this.gameData = gameDate;
    this.gameCanBeStarted.next(true);
    this.winningAmount = '';
    this.winningAmountUpdated.next(false);
  }

  public gameFinished() {
    this.gameIsGenerated.next(false);
    this.gameData = null;
    this.gameCanBeStarted.next(false);
  }

  public rejectGame() {
    this.gameIsGenerated.next(false);
    this.gameData = null;
    this.gameRejected.next(true);
  }

  public resetGameReject() {
    this.gameIsGenerated.next(false);
    this.gameData = null;
    this.gameRejected.next(false);
  }

  public get gameIsGenerated$(): Observable<boolean> {
    this.winningAmount = '';
    return this.gameIsGenerated.asObservable();
  }

  public startGenerateGame(): void {
    this.gameIsGenerated.next(true);
  }

  public get winningAmountUpdated$(): Observable<boolean> {
    return this.winningAmountUpdated.asObservable();
  }

  public updateWinningAmount(amount: string) {
    this.winningAmount = amount;
    this.winningAmountUpdated.next(true);
  }
}
