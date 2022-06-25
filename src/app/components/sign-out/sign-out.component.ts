import { Component, OnInit } from '@angular/core';
import { Web3Service } from "../../services/web3.service";

@Component({
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent implements OnInit {

  constructor(private web3Service: Web3Service) { }

  ngOnInit(): void {
  }

  getAccount() {
    this.web3Service.getAccount();
  }
}
