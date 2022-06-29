import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

export interface IPopupViewModel {
  title: PopupTitle;
  content: string;
}

export enum PopupTitle {
  Error = 'Oops, we have an error',
  None = ''
}

const EmptyPopupViewModel = {title: PopupTitle.None, content: ''};

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  private popupViewModel: BehaviorSubject<IPopupViewModel> = new BehaviorSubject<IPopupViewModel>(EmptyPopupViewModel);
  private showPopup: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  public setPopup(title: PopupTitle, content: string): void {
    this.popupViewModel.next({title, content});
    this.showPopup.next(true);
  }

  public closePopup(): void {
    this.showPopup.next(false);
    this.popupViewModel.next(EmptyPopupViewModel);
  }

  public get popupViewModel$(): Observable<IPopupViewModel> {
    return this.popupViewModel.asObservable();
  }

  public get showPopup$(): Observable<boolean> {
    return this.showPopup.asObservable();
  }

}
