const Web3 = require('web3');
const { abi: eventWiseAbi } = require('./artifacts/contracts/EventWise.sol/EventWise.json');
const { BigNumber, getSigners } = require('ethers');
const { parseEther } = require('ethers/lib/utils');
const hre = require("hardhat");
require('dotenv').config()


const EVENTWISE_CONTRACT_ADDRESS = '0xDeee23398Bb90727a2122b4EcB61d55aD6467B33';
const USDT_CONTRACT_ADDRESS = '0xE1C82c45bD7faBA5960c2e6C134eb9425b88d160';


class EventWise {
    contract;
    client;
    fromAddress;

    constructor(_client, _fromAddress) {
        this.client = _client;
        this.fromAddress = _fromAddress
        this.contract = new this.client.eth.Contract(eventWiseAbi, EVENTWISE_CONTRACT_ADDRESS.trim())
    }

    async viewPolicy(address) {
        return await this.contract.methods.InsurancePolicy(address).call();
    }

    async viewUserEvents(user) {
        let events = [], status = true;
        for (let i = 1; status; i++) {
            let event = await this.contract.methods.Events(user, i).call();
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

    async viewClaims(user) {
        let claims = [];
        const events = await this.contract.getPastEvents('ClaimInitiated', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        for (const e of events) {
            let event = await this.contract.methods.Events(user, e.returnValues.eventId).call()
            let claim = await this.contract.methods.Claims(user, e.returnValues.eventId).call()
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
            let action = await this.contract.methods.payPremium();
            let gas = Math.floor((await action.estimateGas({ from: this.fromAddress })) * 1.4);

            let txn = await this._sendTransaction(action, gas)
            console.log({ txn });

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

    // new EventWise(client).viewPolicy('0x99713faE9B01E427F6f64dcebE50209B9a717977')
    //     .then((viewPolicy) => { console.log({ viewPolicy }) });


    // new EventWise(client).viewUserEvents('0x99713faE9B01E427F6f64dcebE50209B9a717977')
    //     .then((viewUserEvents) => { console.log({ viewUserEvents }) });


    // new EventWise(client).viewPremiumPayments('0x99713faE9B01E427F6f64dcebE50209B9a717977')
    //     .then((viewPremiumPayments) => { console.log({ viewPremiumPayments }) });


    // new EventWise(client).viewClaims('0x99713faE9B01E427F6f64dcebE50209B9a717977')
    //     .then((viewClaims) => { console.log({ viewClaims }) });

    new EventWise(client, user.address)
        .createPolicy('50000')
        .then((createEvent) => { console.log({ createEvent }) });


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