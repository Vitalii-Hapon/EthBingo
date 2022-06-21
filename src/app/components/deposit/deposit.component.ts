import { Component, OnInit } from '@angular/core';
import { Web3Service } from "../../services/web3.service";

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css']
})
export class DepositComponent implements OnInit {

  constructor(private web3Service: Web3Service) { }

  ngOnInit(): void {
  }

  makeDeposit() {
    this.web3Service.makeDeposit();
  }
}
