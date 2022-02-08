# Multi-Sig Wallet

## Dependencies

* Ganache CLI v6.12.2
* Truffle v5.1.55 
* ethers v5.5.3

## Resources

* [Solidity-example](https://solidity-by-example.org/)
* [Chain Link docs](https://docs.chain.link/)

## Multi signature

* The contract receives the owners addresses inside the constructor function, also receives the confirmations number when it is deployed.

* For every transaction within the contract, a minimum of confirmations must be achieved by the owners within a certain ETH price range in usd.
