import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GameTime } from "../../models/models";
import { interval, Observable, Subject, Subscription } from "rxjs";
import { filter, first, map, takeUntil } from "rxjs/operators";
import { Web3Service } from "../../services/web3.service";
import { BalanceService } from "../../services/balance.service";
import { TicketPriceService } from "../../services/ticket-price.service";
import { SwiperOptions } from "swiper";
import { PlayService } from "../../services/play.service";

const LimitForCountDown = 3;
const BoardsLength = 5;
const BoardSize = 25;
const CallSequenceLength = 75;
const TicketsToStart = 5;

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})

export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('swiperContainer', {static: true}) swiperContainer!: ElementRef;
  public timeToStart!: number;
  public calledBalls: number[] = [];
  public boards!: number[][][];
  public ticketPrice$: Observable<string> = this.ticketPriceService.ticketPrice$;
  public balanceIsUpdated$: Observable<boolean> = this.balanceService.balanceIsIsUpdated$;
  public ticketIsUpdated$: Observable<boolean> = this.ticketPriceService.ticketPriceIsUpdated$;
  public balance$: Observable<string> = this.balanceService.balance$;
  public callsSwiperConfig: SwiperOptions = {
    slidesPerView: 10,
    spaceBetween: 8,
    direction: "horizontal",
  };
  public boardsSwiperConfig: SwiperOptions = {
    slidesPerView: "auto",
    spaceBetween: 25,
    direction: "vertical",
  };
  public showStartNewGame!: boolean;
  public gameRejected!: boolean;
  private callSequence!: number[];
  // public boughTickets = 1;
  private currentGameTime!: GameTime;
  private stopCountDown$!: Subject<any>;
  private stopPlayTime$!: Subject<any>;
  private playSubscription!: Subscription;
  private rejectGameSubscription!: Subscription;

  constructor(
    private web3Service: Web3Service,
    private balanceService: BalanceService,
    private ticketPriceService: TicketPriceService,
    private el: ElementRef,
    private playService: PlayService,
  ) {
  }

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

  public get winnerExist(): boolean {
    let winner = false;
    for (const board of this.boards) {
      for (const row of board) {
        if (row.every(ball => this.calledBalls.includes(ball))) {
          winner = true;
          break;
        }
      }
    }
    return winner;
  }

  public balanceValueIsEnough(balanceInEther: string, ticketPriceInEther: string): boolean {
    const balanceAsBigint = Web3Service.convertToBigint(balanceInEther);
    const valueToStartAsBigint = Web3Service.convertToBigint(Web3Service.getMultipleEtherValue(ticketPriceInEther, TicketsToStart));
    return balanceAsBigint >= valueToStartAsBigint;
  }

  public valueToStart(ticketPriceInEther: string): string {
    return Web3Service.getMultipleEtherValue(ticketPriceInEther, TicketsToStart);
  }

  public ngOnInit(): void {
    this.initialize();
  }

  public startGame(): void {
    this.gameRejected = false;
    this.web3Service.play(5);
    this.currentGameTime = GameTime.Countdown;
    this.playSubscription = this.playService.gameCanBeStarted$
      .pipe(
        filter(canStarted => canStarted),
        first())
      .subscribe(canStarted => {
        if (canStarted) {
          if (this.el.nativeElement?.offsetHeight) {
            this.boardsSwiperConfig.slidesPerView = this.el.nativeElement.offsetHeight / 270;
          }
          this.startPlayTime();
          this.rejectGameSubscription?.unsubscribe();
        }
      })

    this.rejectGameSubscription = this.playService.gameRejected$
      .pipe(
        filter(rejected => rejected),
        first())
      .subscribe(gameRejected => {
        this.gameRejected = gameRejected;
        this.playSubscription?.unsubscribe();
      })

    // this.startCountDown();
  }

  public restartGame(): void {
    this.playService.resetGameReject();
    this.startGame();
  }

  public quit() {
    this.playService.resetGameReject()
    this.finishGame();
  }

  public ngOnDestroy(): void {
    this.finishGame();
  }

  public startNewGame() {
    this.finishGame();
    this.initialize();
  }

  public ballIsCalled(number: number): boolean {
    return this.calledBalls.includes(number);
  }

  public trackByNumber(number: number): number {
    return number;
  }

  public startPlayTime(): void {
    this.currentGameTime = GameTime.PLay;
    this.startCallingBalls();
  }

  public closeWin(): void {
    this.currentGameTime = GameTime.PLay
    this.showStartNewGame = true;
  }

  private initialize(): void {
    this.showStartNewGame = false;
    this.currentGameTime = GameTime.BuyTime;
    this.stopPlayTime$ = new Subject();
    this.stopCountDown$ = new Subject();
    this.timeToStart = LimitForCountDown;
    this.createCallSequence();
    this.createBoards();
  }

  private createCallSequence() {
    const nums: Set<number> = new Set();
    while (nums.size !== CallSequenceLength) {
      nums.add(Math.floor(Math.random() * 100) + 1);
    }
    this.callSequence = [...nums];
  }

  private createBoards() {
    this.boards = [];

    function chunkArray(myArray: number[], chunk_size: number): number[][] {
      let index = 0;
      const arrayLength = myArray.length;
      const tempArray = [];

      for (index = 0; index < arrayLength; index += chunk_size) {
        const myChunk = myArray.slice(index, index + chunk_size);
        tempArray.push(myChunk);
      }

      return tempArray;
    }

    for (let i = 0; i < BoardsLength; i++) {
      const nums: Set<number> = new Set();
      while (nums.size !== BoardSize) {
        nums.add(Math.floor(Math.random() * 100) + 1);
      }
      const board = chunkArray([...nums], 5);
      this.boards.push(board);
    }
  }

  private startCountDown(): void {
    interval(1000)
      .pipe(takeUntil(this.stopCountDown$))
      .subscribe(_ => {
        this.timeToStart = this.timeToStart - 1;
        if (this.timeToStart === 0) {
          this.stopCountDown()
          if (this.el.nativeElement?.offsetHeight) {
            this.boardsSwiperConfig.slidesPerView = this.el.nativeElement.offsetHeight / 270;
          }
          this.startPlayTime();
        }
      });
  }

  private startCallingBalls(): void {
    interval(1000).pipe(
      takeUntil(this.stopPlayTime$),
      map(i => {
        if (i === this.callSequence.length || this.winnerExist) {
          this.balanceService.updateBalanceAfterFreeze();
          this.currentGameTime = GameTime.Won;
          this.stopPlayTime();
        }
        this.calledBalls.unshift(this.callSequence[i]);
      })
    ).subscribe();
  }

  private finishGame(): void {
    this.playSubscription?.unsubscribe();
    this.rejectGameSubscription?.unsubscribe();
    this.playService.gameFinished();
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
}
