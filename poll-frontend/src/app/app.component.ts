import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import Web3 from 'web3';
import { abi } from '../assets/contract/Poll.json';
import { AbiItem } from 'web3-utils/types'
import { ToastrService } from 'ngx-toastr';
import { Result } from './models/result.model';

// The address of your deployed contract
const contractAddress = "0x627a434221b0c504008e17E1cE55626423c72C38";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

	constructor(public toastr: ToastrService) {}

	public candidates: string[] = [];
	public pollStarted: boolean = false;
	public selectedCandidate: string;
	readonly separatorKeysCodes: number[] = [ENTER, COMMA];
	public web3: Web3;
	public web3Provider;
	public accounts;
	public pollContract;
	public loading: boolean = false;
	public creatingPoll: boolean = false;
	public results: Result[] = [];
	displayedColumns: string[] = ['name', 'votes'];

	ngOnInit(): void {
		this.initWeb3();
	}

	// for now this only works locally
	async initWeb3() {
		// if (window.ethereum) {
		// 	this.web3Provider = window.ethereum;
		// 	try {
		// 		// Request account access
		// 		await window.ethereum.request({ method: "eth_requestAccounts" });
		// 	} catch (error) {
		// 		// User denied account access...
		// 		this.toastr.error("User denied account access");
		// 	}
		// }
		// // Legacy dapp browsers...
		// else if (window.web3) {
		// 	this.web3Provider = window.web3.currentProvider;
		// }
		// // If no injected web3 instance is detected, fall back to Ganache
		// else {
		 	this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
		// }
		this.web3 = new Web3(this.web3Provider);
		this.accounts = await this.web3.eth.getAccounts();
	}

	startPoll() {
		this.results = [];
		this.candidates = [];
		this.creatingPoll = true;
		this.pollStarted = false;
	}

	async startVoting() {
		if (this.candidates.length == 0) {
			this.toastr.error("Insert at least 1 candidate!");
			return;
		}
		this.loading = true;
		this.pollContract = new this.web3.eth.Contract(abi as AbiItem[], contractAddress);
		await this.pollContract.methods.startPoll(this.candidates).send({ from: this.accounts[0], gas: '3000000'})
		.on('confirmation', () => {
			this.loading = false;
			this.creatingPoll = false;
			this.pollStarted = true;
		})
		.on('error', (error) => {
			this.toastr.error(error);
		});
	}

	async stopVoting() {
		this.loading = true;
		await this.pollContract.methods.finishPoll().send({ from: this.accounts[0], gas: '3000000'})
		.on('receipt', (receipt) => {
			receipt.events.EndPoll.returnValues[0].forEach(r => this.results.push(new Result(r.name, r.votes)));
		})
		.on('confirmation', () => {
			this.loading = false;
			this.pollStarted = false;
			this.creatingPoll = false;
		})
		.on('error', (error) => {
			this.toastr.error(error);
		});
	}

	removeCandidate(candidate) {
		this.candidates.splice(this.candidates.indexOf(candidate), 1);
		if (this.selectedCandidate == candidate) {
			this.selectedCandidate = null;
		}
	}

	addCandidate(event: MatChipInputEvent): void {
		const input = event.input;
		const value = event.value;

		if ((value || '').trim()) {
			this.candidates.push(value.trim());
		}

		if (input) {
			input.value = '';
		}
	}

	pickCandidate(candidate) {
		this.selectedCandidate = candidate;
	}

	async vote() {
		this.loading = true;
		await this.pollContract.methods.vote(this.selectedCandidate).send({ from: this.accounts[0], gas: '3000000'})
		.on('receipt', () => {
			this.toastr.success("Voted on " + this.selectedCandidate);
			this.loading = false;
		})
		.on('error', (error) => {
			this.toastr.error(error);
		});
	}
}