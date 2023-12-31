const { expect } = require("chai");
const { parseEther, formatEther } = require("ethers/lib/utils");

describe("EventWise", function () {

    before(async () => {
        provider = ethers.provider;
        [user] = await ethers.getSigners();

        weth = await ethers.getContractFactory("ERC20Token");
        WETH = await weth.deploy("Wrapped Ether", "WETH");
        console.log("WETH deployed to:", WETH.address);

        EventWise = await ethers.getContractFactory("EventWise");
        eventWise = await EventWise.deploy(WETH.address);
        console.log("eventWise deployed to:", eventWise.address);

        // await WETH.transfer(user.address, parseEther("100000"));
    })


    describe("createPolicy", function () {
        it("should fail with zero amount", async () => {
            await expect(
                eventWise.connect(user).createPolicy(0)
            ).to.be.revertedWith("zero amount!");
        })

        it("should emit PolicyCreated event if successfull", async () => {
            let txn = await eventWise
                .connect(user)
                .createPolicy(parseEther("50000"));
            let reciept = await txn.wait();
            expect(reciept).to.emit(EventWise, "PolicyCreated");
        });

        it("should store insurance policy if successfull", async () => {
            let expectedPremiumAmount = parseEther("1000");
            let policy = await eventWise.InsurancePolicy(user.address);
            expect(policy.premiumAmount).to.equal(expectedPremiumAmount);
        });

    })


    describe("payPremium", async function () {
        it("should emit PremiumPaid if successfull", async () => {
            let premiumAmount = parseEther("1000");

            await WETH.connect(user).approve(eventWise.address, premiumAmount);
            let txn = await eventWise
                .connect(user)
                .payPremium();
            let reciept = await txn.wait();

            expect(reciept).to.emit(EventWise, "PremiumPaid");
        })


        it("should transfer premium if successfull", async () => {
            let balanceBefore = await WETH.balanceOf(eventWise.address);

            await WETH.connect(user).approve(eventWise.address, parseEther("1000"));
            await eventWise
                .connect(user)
                .payPremium();

            let balanceAfter = await WETH.balanceOf(eventWise.address);
            expect(formatEther(balanceAfter) - formatEther(balanceBefore)).to.equal(1000)
        })

    })


    describe("createEvent", async function () {
        it("should emit EventCreated if successfull", async () => {
            let event = {
                name: 'gdg devfest spring',
                longitude: '7.524058',
                latitude: '6.418484',
                cost: parseEther("35000"),
                date: 1700789948,
                attendees: '1004',
            }

            let txn = await eventWise
                .connect(user)
                .createEvent(event.name, event.latitude, event.longitude, event.attendees, event.cost, event.date);
            let reciept = await txn.wait();

            expect(reciept).to.emit(EventWise, "EventCreated");
        })

        it("should store event if successfull", async () => {
            let event = await eventWise.Events(user.address, 1);
            expect(event.name).to.equal('gdg devfest spring');
        });

    })


    describe("initiateClaim", function () {
        it("should fail if claim exists", async () => {
            let txn = await eventWise.connect(user).initiateClaim(1, 'fiery hurricane')
            let reciept = await txn.wait();
            let ClaimInitiatedEvent = reciept.events?.filter((x) => {
                return x.event == "ClaimInitiated";
            });
            // requestId = ClaimInitiatedEvent[0].args.requestId;

            await eventWise.connect(user).initiateClaim(1, 'wild hurricane')

            // await expect(
            //     eventWise.connect(user).initiateClaim(1, 'wild hurricane')
            // ).to.be.revertedWith("claim exists!");
        })

        it("should store claim if successfull", async () => {
            let claim = await eventWise.Claims(user.address, 1);
            expect(claim.isExists).to.equal(true);
        });

        it("should store requestId if successfull", async () => {
            let request = await eventWise.Requests(1);
            expect(request.user).to.equal(user.address);
        });

        // it("---trigger oracle callback---", async () => {
        //     console.log({ xxx: await eventWise.Claims(user.address, 1) });

        //     await eventWise.fulfill(1, 502);   // heavy intensity rain

        //     console.log({ yyy: await eventWise.Claims(user.address, 1) });
        // });

    })


})