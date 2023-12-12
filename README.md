## EventWise Contracts

## Inspiration
We all know what it feels like to cancel an event due to bad weather conditions.
Imagine the losses incurred by the actual event planners in situations like this.
I had a personal experience of these sorts that inspired this idea and i believe its a valid one that can be handled seamlessly on the blockchain.

## What it does
EventWise is an insurance platform designed to provide coverage to event-planners for their events.
This helps them minimize losses if the events are impacted negatively due to climate conditions.


## How we built it
- We built a NextJS client that interacts with our smart contracts, deployed on the sepolia ethereum testnet.
- Our smart contracts handle the insurance and claim settlements in a decentralized and trustless process.
- Its completely decentralized, so no centralized servers involved.

## Features
- Register insurance
- Paying  premium at intervals
- Registering events as they are booked.
- Register an insurance claim when your event incurs a loss.
- Verify the claim for settlement.
- Pay the event planner.

## Challenges we ran into
- Integrating chainlink AnyApi
- The AnyApi oracle on sepolia wasnt working, we had to use oracle from linkwell team(thanks guys🤍)

## Accomplishments that we're proud of
- Completing a working demo was really a proud moment for us.
- Building the client to be completely serverless and still working seamlessly.
- Integrating with AnyApi was a proud moment.

## What we learned
- Creating a functional DApp without any centralized servers.
- Interacting with chainlink oracles.


## What's next for Eventwise
- We plan to build a more robust system to handle claims and settlements.
- Also partner with event planning businesses to introduce our project.
- Work with insurance companies for payments.
