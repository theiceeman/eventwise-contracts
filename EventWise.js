const Web3 = require('web3');
const { abi: eventWiseAbi } = require('./artifacts/contracts/EventWise.sol/EventWise.json');
const { abi: erc20TokenAbi } = require('./artifacts/contracts/utils/ERC20Token.sol/ERC20Token.json');
const { BigNumber, getSigners } = require('ethers');
const { parseEther } = require('ethers/lib/utils');
const hre = require("hardhat");
require('dotenv').config()


const EVENTWISE_CONTRACT_ADDRESS = '0x6d7B7DE1f0114c11b8739b779d0C1dE5aF88f482';
const WETH_CONTRACT_ADDRESS = '0xC8A71BACF28e24A274b95e785c436bb5F57043Ae';


class EventWise {
    contract;
    client;
    fromAddress;
    token;

    constructor(_client, _fromAddress, _tokenAddress) {
        this.client = _client;
        this.fromAddress = _fromAddress
        this.tokenAddress = _tokenAddress
        this.contract = new this.client.eth.Contract(eventWiseAbi, EVENTWISE_CONTRACT_ADDRESS.trim())
        this.token = new this.client.eth.Contract(erc20TokenAbi, WETH_CONTRACT_ADDRESS.trim())
    }

    async viewPolicy(address) {
        return await this.contract.methods.InsurancePolicy(address).call();
    }

    async viewUserEvents() {
        let events = [], status = true;

        for (let i = 1; status; i++) {
            let event = await this.contract.methods.Events(this.fromAddress, i).call();
            if (event.isExists == false) {
                status = false;
                break;
            }
            events.push(event)
        }

        return events;
    }

    async viewPremiumPayments(user) {
        let payments = [];
        const events = await this.contract.getPastEvents('PremiumPaid', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        events.forEach(event => {
            payments.push(event.returnValues)
        });
        return payments;
    }

    async viewClaims() {
        let claims = [];
        const events = await this.contract.getPastEvents('ClaimInitiated', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        for (const e of events) {
            let event = await this.contract.methods.Events(this.fromAddress, e.returnValues.eventId).call()
            let claim = await this.contract.methods.Claims(this.fromAddress, e.returnValues.eventId).call()
            e.returnValues.status = claim.status === 0 ? 'pending' : 'claimed';
            e.returnValues.eventDate = event.date
            e.returnValues.eventCost = event.cost
            claims.push(e.returnValues)
        };
        return claims
    }



    async createPolicy(_avgEventCost) {
        try {
            let action = await this.contract.methods.createPolicy(parseEther(_avgEventCost));
            let gas = Math.floor((await action.estimateGas({ from: this.fromAddress })) * 1.4);

            let txn = await this._sendTransaction(action, gas)
            console.log({ txn });

            return { ok: true, data: txn };
        } catch (error) {
            return { ok: false, data: error };
        }
    };

    async payPremium() {
        try {
            let policy = await this.contract.methods.InsurancePolicy(this.fromAddress).call()
            let approveAction = await this.tokenAddress.methods.approve(EVENTWISE_CONTRACT_ADDRESS, policy.premiumAmount)
            let approveGas = Math.floor((await approveAction.estimateGas({ from: this.fromAddress })) * 1.4);
            let approveTxn = await this._sendTransaction(approveGas, gas)
            console.log({ approveTxn });

            let action = await this.contract.methods.payPremium();
            let payPremiumGas = Math.floor((await action.estimateGas({ from: this.fromAddress })) * 1.4);
            let payPremiumTxn = await this._sendTransaction(action, payPremiumGas)
            console.log({ payPremiumTxn });

            return { ok: true, data: txn };
        } catch (error) {
            return { ok: false, data: error };
        }
    };

    async createEvent(name, lat, long, cost, date) {
        try {
            let _cost = parseEther(cost)
            let action = await this.contract.methods.createEvent(name, lat, long, _cost, date);
            let gas = Math.floor((await action.estimateGas({ from: this.fromAddress })) * 1.4);

            let txn = await this._sendTransaction(action, gas)
            console.log({ txn });

            return { ok: true, data: txn };
        } catch (error) {
            return { ok: false, data: error };
        }
    };

    async registerClaim(eventId, reason) {
        try {
            let action = await this.contract.methods.initiateClaim(eventId, reason);
            let gas = Math.floor((await action.estimateGas({ from: this.fromAddress })) * 1.4);

            let txn = await this._sendTransaction(action, gas)
            console.log({ txn });

            return { ok: true, data: txn };
        } catch (error) {
            return { ok: false, data: error };
        }
    };

    async completeClaim(eventId) {
        try {
            let action = await this.contract.methods.completeClaim(eventId);
            let gas = Math.floor((await action.estimateGas({ from: this.fromAddress })) * 1.4);

            let txn = await this._sendTransaction(action, gas)
            console.log({ txn });

            return { ok: true, data: txn };
        } catch (error) {
            return { ok: false, data: error };
        }
    };

    async _sendTransaction(action, gas) {
        return await this.client.eth.sendTransaction({
            from: this.fromAddress,
            to: EVENTWISE_CONTRACT_ADDRESS,
            data: action.encodeABI(),
            gas, //   300000 GAS
            gasPrice: 500000000000 //  wei
        });
    }

}

async function main() {
    const client = new Web3(process.env.SEPOLIA_RPC);
    // let client = new Web3('http://127.0.0.1:8545/')
    const [user] = await hre.ethers.getSigners();
    // console.log({user});return;

    const eventWise = new EventWise(client, '0x10B3fA7Fc49e45CAe6d32A113731A917C4F1755a')

    // await eventWise.then((viewPolicy) => { console.log({ viewPolicy }) });


    let viewUserEvents = await eventWise.viewUserEvents()
    console.log({ viewUserEvents });


    // let viewPremiumPayments = await eventWise.viewPremiumPayments()
    // console.log({ viewPremiumPayments });


    // let viewClaims = await eventWise.viewClaims()
    // console.log({ viewClaims });

    // new EventWise(client, user.address)
    //     .createPolicy('50000')
    //     .then((createEvent) => { console.log({ createEvent }) });


    // let event = {
    //     name: 'gdg devfest spring',
    //     longitude: '7.524058',
    //     latitude: '6.418484',
    //     cost: '35000',
    //     date: 1700789948
    // }
    // new EventWise(client, user.address)
    //     .createEvent(event.name, event.longitude, event.latitude, event.cost, event.date)
    //     .then((createEvent) => { console.log({ createEvent }) });

}
main()