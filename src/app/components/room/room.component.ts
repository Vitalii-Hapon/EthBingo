import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GameTime } from "../../models/models";
import { interval, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { Web3Service } from "../../services/web3.service";
import { BalanceService } from "../../services/balance.service";
import { TicketPriceService } from "../../services/ticket-price.service";
import { SwiperOptions } from "swiper";

const LimitForCountDown = 3;
const BoardsLength = 5;
const BoardSize = 25;
const CallSequenceLength = 75;

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})

export class RoomComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('swiperContainer', { static: true }) swiperContainer!: ElementRef;
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
  private callSequence!: number[];
  // public boughTickets = 1;
  private currentGameTime!: GameTime;
  private stopCountDown$!: Subject<any>;
  private stopPlayTime$!: Subject<any>;

  public showStartNewGame!: boolean;

  constructor(
    private web3Service: Web3Service,
    private balanceService: BalanceService,
    private ticketPriceService: TicketPriceService,
    private el: ElementRef,
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

  public balanceValueIsEnough(balanceInEther: string = '0,00108', ticketPriceInEther: string = '0,00108'): boolean {
    const balanceAsBigint = Web3Service.convertToBigint(balanceInEther);
    const ticketPriceAsBigint = Web3Service.convertToBigint(ticketPriceInEther);
    return balanceAsBigint >= ticketPriceAsBigint;
  }

  public ngOnInit(): void {
    this.initialize();
  }

  public startGame(): void {
    this.web3Service.play(50);
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

  public ballIsCalled(number: number): boolean {
    return this.calledBalls.includes(number);
  }

  public trackByNumber(number: number): number {
    return number;
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
        if (i === this.callSequence.length || this.winnerExist) {
          this.currentGameTime = GameTime.Won;
          this.stopPlayTime();
        }
        this.calledBalls.unshift(this.callSequence[i]);
      })
    ).subscribe();
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

  ngAfterViewInit(): void {
    if (this.el.nativeElement?.offsetHeight) {
      this.boardsSwiperConfig.slidesPerView = this.el.nativeElement.offsetHeight / 270;
    }
  }

  public closeWin(): void {
    this.currentGameTime = GameTime.PLay
    this.showStartNewGame = true;
  }
}
