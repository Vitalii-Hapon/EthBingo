import { NgModule } from '@angular/core';
import { RouterModule, Routes } from "@angular/router";
import { MainPageComponent } from "./components/main-page/main-page.component";
import { RoomComponent } from "./components/room/room.component";
import { WalletComponent } from "./components/wallet/wallet.component";
import { SignOutComponent } from "./components/sign-out/sign-out.component";

const routes: Routes = [
  {path: '', redirectTo: 'main-page', pathMatch: 'full'},
  {path: 'main-page', component: MainPageComponent},
  {path: 'room', component: RoomComponent},
  {path: 'wallet', component: WalletComponent},
  {path: 'sing-out', component: SignOutComponent},
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule,
  ],
})
export class AppRouting { }
