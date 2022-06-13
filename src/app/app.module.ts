import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RoomComponent } from './components/room/room.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignOutComponent } from './components/sign-out/sign-out.component';
import { DepositComponent } from './components/deposit/deposit.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { AppRouting } from "./app-routing.module";
import { MatCardModule } from "@angular/material/card";

@NgModule({
  declarations: [
    AppComponent,
    RoomComponent,
    SignInComponent,
    SignOutComponent,
    DepositComponent,
    MainPageComponent
  ],
  imports: [
    AppRouting,
    BrowserModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
