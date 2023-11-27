const Web3 = require('web3');



export async function connectToBrowserProvider() {
    const { ethereum } = window;
    if (ethereum) {
        if (ethereum) {
            window.web3 = new Web3(ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        }

        await confirmUserNetwork()

        let address = await getAddress()
        console.log({ address })
        return address;

    } else {
        console.log("Install browser wallet.");
    }
}
export async function loadProvider() {
    const { ethereum } = window;
    if (!ethereum) {
        console.log("Install browser wallet.");
        return;
    }
    if (ethereum) {
        window.web3 = new Web3(ethereum);
        await window.ethereum.enable();
    } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    }
    return window.web3
}
async function confirmUserNetwork() {
    const { ethereum } = window;

    if (!ethereum) {
        console.error("Not web3 Browser. Install MetaMask!");
        return;
    }
    let userChainId = await ethereum.request({ method: "eth_chainId" });
    console.log("User is connected to chain " + userChainId);

    // String, hex code of the chainId of the  network
    let ChainId = process.env.REACT_APP_CHAIN_ID || '0x38';
    let networkName = process.env.REACT_APP_NETWORK_NAME || "BSC";

    if (userChainId !== ChainId) {
        console.error("You are not connected to the " + networkName + " Network!");
        return;
    } else {
        console.log("Connected to " + networkName + " Network")
    }

}

const connectedNetworkChainId = async () => {
    const { ethereum } = window;
    if (!ethereum) {
        console.error("Browser is not Web3 enabled. Install MetaMask!");
        return;
    }
    let userChainId = await ethereum.request({ method: "eth_chainId" });
    return parseInt(userChainId, 16)
}

const getAddress = async () => {
    const accounts = await window.web3.eth.getAccounts();
    return accounts[0];
};