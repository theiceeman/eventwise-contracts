const Web3 = require('web3');
const { abi: eventWiseAbi } = require('./artifacts/contracts/EventWise.sol/EventWise.json');
require('dotenv').config()


const EVENTWISE_CONTRACT_ADDRESS = '0x3217DbEc365736148f8d7DFBCFD865e90DaB4B79';
const USDT_CONTRACT_ADDRESS = '0x6d7B7DE1f0114c11b8739b779d0C1dE5aF88f482';


class EventWise {
    contract;
    client;
    fromAddress;

    constructor(_client, _fromAddress) {
        this.client = _client;
        this.contract = new client.eth.Contract(eventWiseAbi, EVENTWISE_CONTRACT_ADDRESS.trim())
        this.fromAddress = _fromAddress
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
            let action = await this.contract.methods.createPolicy(_avgEventCost);
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
            let action = await this.contract.methods.createEvent(name, lat, long, cost, date);
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

// const client = Web3(process.env.SEPOLIA_RPC);
let client = new Web3('http://127.0.0.1:8545/')

// new EventWise(client).viewPolicy('0x99713faE9B01E427F6f64dcebE50209B9a717977')
//     .then((viewPolicy) => { console.log({ viewPolicy }) });


// new EventWise(client).viewUserEvents('0x99713faE9B01E427F6f64dcebE50209B9a717977')
//     .then((viewUserEvents) => { console.log({ viewUserEvents }) });


// new EventWise(client).viewPremiumPayments('0x99713faE9B01E427F6f64dcebE50209B9a717977')
//     .then((viewPremiumPayments) => { console.log({ viewPremiumPayments }) });


new EventWise(client).viewClaims('0x99713faE9B01E427F6f64dcebE50209B9a717977')
    .then((viewClaims) => { console.log({ viewClaims }) });