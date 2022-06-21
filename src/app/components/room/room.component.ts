import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GameTime } from "../../models/models";
import { interval, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { Web3Service } from "../../services/web3.service";

const LimitForCountDown = 10;

const Boards = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9}, {id: 10}];
const calledBalls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})

export class RoomComponent implements OnInit, OnDestroy {
  public timeToStart!: number;
  public calledBalls: number[] = [];
  public boards = Boards;
  public boughTickets = 1;
  private currentGameTime!: GameTime;
  private stopCountDown$!: Subject<any>;
  private stopPlayTime$!: Subject<any>;
  public ticket = [Array.from({length: 9}, () => Math.floor(Math.random() * 40)), Array.from({length: 9}, () => Math.floor(Math.random() * 40)), Array.from({length: 9}, () => Math.floor(Math.random() * 40))];


  public ticketPrice!: string;
  constructor(
    private web3Service: Web3Service,
  ) { }

  public get isWonTime(): boolean {
    return this.currentGameTime === GameTime.Won
  }

  public get isPlayTime(): boolean {
    return this.currentGameTime === GameTime.PLay
  }

  public get isCountDownTime(): boolean {
    return this.currentGameTime === GameTime.Countdown
  }

  public get isBuyTime(): boolean {
    return this.currentGameTime === GameTime.BuyTime
  }

  public ngOnInit(): void {
    this.initialize();
  }

  public startGame(): void {
    this.currentGameTime = GameTime.Countdown;
    this.startCountDown();
  }

  public ngOnDestroy(): void {
    this.finishGame();
  }

  public startNewGame() {
    this.finishGame();
    this.initialize();
  }

  private async getTicketPrice(): Promise<void> {
    this.ticketPrice = await this.web3Service.getTicketPrice();
  }

  private initialize(): void {
    this.getTicketPrice();
    this.currentGameTime = GameTime.BuyTime;
    this.stopPlayTime$ = new Subject();
    this.stopCountDown$ = new Subject();
    this.timeToStart = LimitForCountDown;
  }

  private startCountDown(): void {
    interval(1000)
      .pipe(takeUntil(this.stopCountDown$))
      .subscribe(_ => {
        this.timeToStart = this.timeToStart - 1;
        if (this.timeToStart === 0) {
          this.stopCountDown()
          this.currentGameTime = GameTime.PLay;
          this.startPlayTime();
        }
      });
  }

  private startPlayTime(): void {
    this.startCallingBalls();
  }

  private startCallingBalls(): void {
    interval(1000).pipe(
      takeUntil(this.stopPlayTime$),
      map(i => {
        if (i === calledBalls.length) {
          this.currentGameTime = GameTime.Won;
          this.stopPlayTime();
        }
          this.calledBalls.unshift(calledBalls[i]);
      })
    ).subscribe();
  }

  private finishGame(): void {
    this.calledBalls = [];
    this.stopCountDown();
    this.stopPlayTime();
  }

  private stopCountDown(): void {
    this.stopCountDown$.next();
    this.stopCountDown$.complete();
  }

  private stopPlayTime(): void {
    this.stopPlayTime$.next();
    this.stopPlayTime$.complete();
  }

  public ballIsCalled(number: number): boolean {
    return this.calledBalls.includes(number);
  }

  public trackByNumber(number: number): number {
    return number;
  }
}
