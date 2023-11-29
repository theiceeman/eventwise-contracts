//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract EventWise is Ownable, ChainlinkClient {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Chainlink for Chainlink.Request;

    enum Status {
        PENDING,
        CLAIMED
    }

    struct Policy {
        uint256 avgEventCost;
        uint256 premiumAmount;
        bool isExists;
    }
    struct EventDetail {
        string name;
        string latitude;
        string longitude;
        uint256 cost;
        uint256 date;
        bool isExists;
    }
    struct RequestDetail {
        address user;
        uint256 eventId;
    }
    struct ClaimDetail {
        Status status;
        uint256 weatherCondition;
        bool isExists;
    }

    // open weather
    string constant OPEN_WEATHER_URL =
        "https://api.openweathermap.org/data/2.5/weather?";
    string constant OPEN_WEATHER_KEY = "3994cbbbeb0ce566ecf3d0d58d57ccc6";
    string constant OPEN_WEATHER_PATH = "weather,0,id";
    uint256 constant PREMIUM_PERCENTAGE = 2; // 2%

    // chainlink
    bytes32 private jobId;
    uint256 private fee;

    // eventwise
    IERC20 public token;
    mapping(address => Policy) public InsurancePolicy;
    mapping(address => uint256) public latestEventId;
    mapping(bytes32 => RequestDetail) public Requests; //  requestId -> eventId
    mapping(address => mapping(uint256 => EventDetail)) public Events; //  user -> eventId
    mapping(address => mapping(uint256 => ClaimDetail)) public Claims; //  user -> eventId

    event PolicyCreated(address indexed user, uint256 premium, uint256 date);
    event PremiumPaid(address indexed user, uint256 amount, uint256 date);
    event EventCreated(address indexed user, uint256 indexed eventId);
    event ClaimInitiated(
        address indexed user,
        uint256 indexed eventId,
        uint256 date,
        bytes32 requestId,
        string reason
    );
    event ClaimFulfilled(
        address indexed user,
        uint256 indexed eventId,
        uint256 date
    );
    event ClaimCompleted(
        address indexed user,
        uint256 indexed eventId,
        uint256 date
    );

    constructor(address _token) {
        token = IERC20(_token);
        setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        setChainlinkOracle(0x0FaCf846af22BCE1C7f88D1d55A038F27747eD2B);
        setJobId("a8356f48569c434eaa4ac5fcb4db5cc0");
        setFeeInHundredthsOfLink(0); // 0 LINK
    }

    function createPolicy(uint256 _avgEventCost) external {
        require(_avgEventCost > 0, "zero amount!");

        uint256 premium = _avgEventCost.mul(PREMIUM_PERCENTAGE) / 100;
        InsurancePolicy[msg.sender] = Policy(_avgEventCost, premium, true);

        emit PolicyCreated(msg.sender, premium, block.timestamp);
    }

    function payPremium() external {
        uint256 amount = InsurancePolicy[msg.sender].premiumAmount;
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit PremiumPaid(msg.sender, amount, block.timestamp);
    }

    function createEvent(
        string memory name,
        string memory latitude,
        string memory longitude,
        uint256 cost,
        uint256 date
    ) external {
        _storeEvent(msg.sender, name, latitude, longitude, cost, date);

        emit EventCreated(msg.sender, latestEventId[msg.sender]);
    }

    function initiateClaim(uint256 eventId, string memory reason) external {
        require(!Claims[msg.sender][eventId].isExists, "claim exists!");

        Claims[msg.sender][eventId] = ClaimDetail(Status.PENDING, 0, true);
        EventDetail memory _event = Events[msg.sender][eventId];
        bytes32 requestId = _request(_event.latitude, _event.longitude);
        Requests[requestId] = RequestDetail(msg.sender, eventId);

        emit ClaimInitiated(
            msg.sender,
            eventId,
            block.timestamp,
            requestId,
            reason
        );
    }

    function fulfill(
        bytes32 _requestId,
        uint256 _rainfall
    ) external recordChainlinkFulfillment(_requestId) {
        RequestDetail memory request = Requests[_requestId];
        Claims[request.user][request.eventId].weatherCondition = _rainfall;

        emit ClaimFulfilled(request.user, request.eventId, block.timestamp);
    }

    function completeClaim(uint256 eventId) external {
        EventDetail memory _event = Events[msg.sender][eventId];
        require(
            token.balanceOf(address(this)) > _event.cost,
            "insufficient funds!"
        );

        ClaimDetail storage claim = Claims[msg.sender][eventId];
        require(claim.status != Status.CLAIMED, "already claimed!");

        if (claim.weatherCondition >= 200 && claim.weatherCondition < 800) {
            claim.status = Status.CLAIMED;
            token.safeTransfer(msg.sender, _event.cost);

            emit ClaimCompleted(msg.sender, eventId, block.timestamp);
        } else {
            return;
        }
    }

    /////////////////////////////////
    ////    Internal functions   ////
    /////////////////////////////////

    function _request(
        string memory _lat,
        string memory _lon
    ) internal returns (bytes32 requestId) {
        Chainlink.Request memory req = buildOperatorRequest(
            jobId,
            this.fulfill.selector
        );
        string memory url = string(
            abi.encodePacked(
                OPEN_WEATHER_URL,
                "lat=",
                _lat,
                "&lon=",
                _lon,
                "&appid=",
                OPEN_WEATHER_KEY
            )
        );

        req.add("method", "GET");
        req.add("url", url);
        req.add(
            "headers",
            '["content-type", "application/json", "set-cookie", "sid=14A52"]'
        );
        req.add("body", "");
        req.add("contact", "derek_linkwellnodes.io");
        req.add("path", OPEN_WEATHER_PATH);
        req.addInt("multiplier", 10 ** 18);

        return sendOperatorRequest(req, fee);
    }

    function _storeEvent(
        address _address,
        string memory _name,
        string memory _latitude,
        string memory _longitude,
        uint256 _cost,
        uint256 _date
    ) internal {
        uint256 eventId = latestEventId[_address] + 1;
        Events[_address][eventId] = EventDetail(
            _name,
            _latitude,
            _longitude,
            _cost,
            _date,
            true
        );
        latestEventId[_address] = eventId;
    }

    function setJobId(string memory _jobId) public onlyOwner {
        jobId = bytes32(bytes(_jobId));
    }

    function setFeeInJuels(uint256 _feeInJuels) public onlyOwner {
        fee = _feeInJuels;
    }

    function setFeeInHundredthsOfLink(
        uint256 _feeInHundredthsOfLink
    ) public onlyOwner {
        setFeeInJuels((_feeInHundredthsOfLink * LINK_DIVISIBILITY) / 100);
    }
}

// https://www.google.ng/maps/place/Enugu
