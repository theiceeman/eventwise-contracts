const Web3 = require('web3');
const { abi: eventWiseAbi } = require('./artifacts/contracts/EventWise.sol/EventWise.json');
require('dotenv').config()

// console.log({ xxx: process.env.SEPOLIA_RPC }); return;


const EVENTWISE_CONTRACT_ADDRESS = '0xf9A9181e145DFFaBe70B503Bd5Efd3d80A462a8D';
const USDT_CONTRACT_ADDRESS = '0x16deb4eeffda58D481F8348c63902156270eB226';


class EventWise {
    contract;

    constructor(client) {
        this.contract = new client.eth.Contract(eventWiseAbi, EVENTWISE_CONTRACT_ADDRESS.trim())
    }

    async viewPolicy(address) {
        console.log({ xxx: this.contract })
        const policy = await this.contract.methods.InsurancePolicy(address).call();
        console.log({ policy })
        // return client.utils.fromWei(balance);
    }

}

// console.log({ xxx: new Web3 }); return;
// const client = Web3(process.env.SEPOLIA_RPC);


let client = new Web3(process.env.SEPOLIA_RPC)
new EventWise(client).viewPolicy('0x10B3fA7Fc49e45CAe6d32A113731A917C4F1755a').then((viewPolicy) => {

    console.log({ viewPolicy })
});