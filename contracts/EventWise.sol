//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventWise {
    event PolicyCreated(
        address indexed userId,
        uint256 indexed avgEventCost,
        address indexed premiumAmount,
        uint256 dateCreated
    );


    event PremiumPaid();
    event EventCreated();
    event InsuranceClaimed();



    function createPolicy() external {}
}
