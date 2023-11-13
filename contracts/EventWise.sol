//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EventWise {
    using SafeERC20 for IERC20;

    enum Status {
        PENDING,
        CLAIMED
    }

    struct Policy {
        uint256 avgEventCost;
        uint256 premiumAmount;
    }
    struct Event {
        string name;
        uint256 latitude;
        uint256 longitude;
        uint256 cost;
        uint256 date;
    }
    struct EventDetail {
        string name;
        uint256 latitude;
        uint256 longitude;
        uint256 cost;
        uint256 date;
        Status status;
    }

    uint256 constant PREMIUM_PERCENTAGE = 0.002; // 2%

    IERC20 public token;
    mapping(address => Policy) public InsurancePolicy;
    mapping(address => uint256) public latestEventId;
    mapping(address => mapping(uint256 => EventDetail)) public Events;

    event PolicyCreated(
        address indexed user,
        uint256 avgEventCost,
        uint256 premium,
        uint256 date
    );
    event PremiumPaid(address indexed user, uint256 amount, uint256 date);
    event EventCreated(address indexed user, uint256 eventId);
    event InsuranceClaimed();

    constructor(address _token) {
        token = IERC20(_token);
    }

    function createPolicy(uint256 _avgEventCost) external {
        require(_avgEventCost > 0, "zero amount");

        uint256 premium = _avgEventCost * PREMIUM_PERCENTAGE;
        InsurancePolicy[msg.sender] = Policy(_avgEventCost, premium);

        emit PolicyCreated(msg.sender, _avgEventCost, premium, block.timestamp);
    }

    function payPremium() external {
        uint256 amount = InsurancePolicy[msg.sender].premiumAmount;
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit PremiumPaid(msg.sender, amount, block.timestamp);
    }

    function createEvent(Event memory newEvent) external {
        string memory name = newEvent.name;
        uint256 latitude = newEvent.latitude;
        uint256 longitude = newEvent.longitude;
        uint256 cost = newEvent.cost;
        uint256 date = newEvent.date;

        _storeEvent(
            msg.sender,
            name,
            latitude,
            longitude,
            cost,
            date,
            Status.PENDING
        );
        emit EventCreated(msg.sender, latestEventId[msg.sender]);
    }
    

    /////////////////////////////////
    ////    Internal functions   ////
    /////////////////////////////////

    function _storeEvent(
        address _address,
        string memory _name,
        uint256 _latitude,
        uint256 _longitude,
        uint256 _cost,
        uint256 _date,
        Status status
    ) internal {
        uint256 eventId = latestEventId[_address] + 1;
        Events[_address][eventId] = EventDetail(
            _name,
            _latitude,
            _latitude,
            _cost,
            _date,
            status
        );
        latestEventId[_address] = eventId;
    }
}
