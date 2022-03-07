

const the_contract = artifacts.require("Firmas");

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const { CONTRACT_ABI } = require("../src/abi");
//const { CONTRACT_BYTECODE } = require("../src/bytecode");

const { providers, Wallet, Contract, ContractFactory, ethers } = require("ethers");


//     Contract functions
//###################################################################################################################

async function contract_deposit(_contract_address, _signer, amount_in_eth) {
  const contract = new Contract(_contract_address, CONTRACT_ABI, _signer);
  return await contract.deposit({value: ethers.utils.parseEther(amount_in_eth.toString()) , gasPrice: 100000000000, gasLimit: 800000})
}

// ######   Decision making
async function contract_submit_transaction(_contract_address, _signer, address_to, value, price_down, price_up, data) {
  const contract = new Contract(_contract_address, CONTRACT_ABI, _signer);
  return await contract.submit_transaction(address_to,  
                                           ethers.utils.parseEther(value.toString()), 
                                           ethers.utils.parseUnits(price_down.toString(), 8), 
                                           ethers.utils.parseUnits(price_up.toString(), 8), 
                                           data, 
                                           {gasPrice: 75000000000, gasLimit: 800000});
}
async function contract_confirm_transaction(_contract_address, _signer, index) {
  const contract = new Contract(_contract_address, CONTRACT_ABI, _signer);
  return await contract.confirm_transaction(index, {gasPrice: 75000000000, gasLimit: 800000})
}
async function contract_cancel_confirmation(_contract_address, _signer, index) {
  const contract = new Contract(_contract_address, CONTRACT_ABI, _signer);
  return await contract.cancel_confirmation(index, {gasPrice: 75000000000, gasLimit: 800000})
}
async function contract_execute_transaction(_contract_address, _signer, index) {
  const contract = new Contract(_contract_address, CONTRACT_ABI, _signer);
  return await contract.execute_transaction(index, {gasPrice: 75000000000, gasLimit: 800000})
}

async function contract_get_price(_contract_address, _provider, index) {
  const contract = new Contract(_contract_address, CONTRACT_ABI, _provider);
  return await contract.getLatestPrice();         // The price has 8 decimals
}

//     Usefull variables
//###################################################################################################################
//      PROVIDER
const provider = new providers.StaticJsonRpcProvider('http://localhost:8545');

//      SIGNER
const signer_1 = new Wallet(process.env.PRIVATE_KEY_1, provider);
const signer_2 = new Wallet(process.env.PRIVATE_KEY_2, provider);
const signer_3 = new Wallet(process.env.PRIVATE_KEY_3, provider);
const signer_5 = new Wallet(process.env.PRIVATE_KEY_5, provider);


// ###################################################################################      Testing
contract('Multisignature contract.', () => {
    //it('Testting', async () => {
    //    console.log('----------It separation ----------------------------------------------------------------------------------------------');
    //});

    it('Simulating txs with multisignature: ', async () => {

      console.log("Simulating Txs");
      console.log('-----------------------------------------------------------------------------------------------------------');

      // Declare variables
      
      const address_1 = await signer_1.getAddress();
      const address_2 = await signer_2.getAddress();
      const address_3 = await signer_3.getAddress();
      const address_5 = await signer_5.getAddress();
      const address_10 = process.env.ADDRESS_10;

      var account_bal_1, account_bal_2, account_bal_3, account_bal_5, account_bal_10, contract_bal;

      // Deploy contracts
      const contract = await the_contract.new([address_1, address_2, address_3], 2);

      console.log('-----------------------------------------------------------');
      console.log('Contract address: ', contract.address);

      console.log('-----------------------------------------------------------');
      console.log('First Balance Check');

      // Balances:
      account_bal_1 = await provider.getBalance(address_1);
      account_bal_2 = await provider.getBalance(address_2);
      account_bal_3 = await provider.getBalance(address_3);
      account_bal_5 = await provider.getBalance(address_5);
      account_bal_10 = await provider.getBalance(address_10); 
      contract_bal = await provider.getBalance(contract.address);

      console.log(" ");
      console.log('Accounts: ');
      console.log(`${address_1} balance in ETH :${ethers.utils.formatEther(account_bal_1)}`);
      console.log(`${address_2} balance in ETH :${ethers.utils.formatEther(account_bal_2)}`);
      console.log(`${address_3} balance in ETH :${ethers.utils.formatEther(account_bal_3)}`);
      console.log(`${address_5} balance in ETH :${ethers.utils.formatEther(account_bal_5)}`);
      console.log(`${address_10} balance in ETH :${ethers.utils.formatEther(account_bal_10)}`);
      console.log(" ");
      console.log('Contract: ');
      console.log(`Contract balance in ETH :${ethers.utils.formatEther(contract_bal)}`);
      console.log(" ");
      

      console.log('-----------------------------------------------------------');
      console.log('Deposits to the Multisignature contract: ');

      const amount_1 = 5;
      const amount_2 = 3.55;
      const amount_3 = 10;

      const deposit_1 = await contract_deposit(contract.address, signer_1, amount_1);
      const deposit_2 = await contract_deposit(contract.address, signer_2, amount_2);
      const deposit_3 = await contract_deposit(contract.address, signer_5, amount_3);

      console.log(" ");
      console.log(`Deposit hash: ${deposit_1.hash}`);
      console.log(`Deposit of: ${amount_1} ETH`);
      console.log(`Deposit hash: ${deposit_2.hash}`);
      console.log(`Deposit of: ${amount_2} ETH`);
      console.log(`Deposit hash: ${deposit_3.hash}`);
      console.log(`Deposit of: ${amount_3} ETH`);

      console.log('-----------------------------------------------------------');
      console.log('Second Balance Check');

      // Balances:
      account_bal_1 = await provider.getBalance(address_1);
      account_bal_2 = await provider.getBalance(address_2);
      account_bal_3 = await provider.getBalance(address_3);
      account_bal_5 = await provider.getBalance(address_5);
      account_bal_10 = await provider.getBalance(address_10); 
      contract_bal = await provider.getBalance(contract.address);

      console.log(" ");
      console.log('Accounts: ');
      console.log(`${address_1} balance in ETH :${ethers.utils.formatEther(account_bal_1)}`);
      console.log(`${address_2} balance in ETH :${ethers.utils.formatEther(account_bal_2)}`);
      console.log(`${address_3} balance in ETH :${ethers.utils.formatEther(account_bal_3)}`);
      console.log(`${address_5} balance in ETH :${ethers.utils.formatEther(account_bal_5)}`);
      console.log(`${address_10} balance in ETH :${ethers.utils.formatEther(account_bal_10)}`);
      console.log(" ");
      console.log('Contract: ');
      console.log(`Contract balance in ETH :${ethers.utils.formatEther(contract_bal)}`);
      console.log(" ");


      console.log('-----------------------------------------------------------');
      console.log('Submit a proposal & First confirmation');

      const proposal = await contract_submit_transaction(contract.address, signer_2, address_10, 10, 2400, 2600, 0x00);
      console.log(" ");
      console.log(`Submit hash: ${proposal.hash}`);
      
      const proposal_confirm1 = await contract_confirm_transaction(contract.address, signer_2, 0);
      console.log(" ");
      console.log(`Confirm hash: ${proposal_confirm1.hash}`);
      console.log(" ");

      console.log('-----------------------------------------------------------');
      console.log('Second confirmation');
      
      const proposal_confirm2 = await contract_confirm_transaction(contract.address, signer_3, 0);
      console.log(" ");
      console.log(`Confirm hash: ${proposal_confirm2.hash}`);
      console.log(" ");

      console.log('-----------------------------------------------------------');
      console.log('Get ETH price in USD: ');

      const price = await contract_get_price(contract.address, provider);
      console.log(`ETH price in usd: ${ethers.utils.formatUnits(price, 8)}`);   

      console.log('-----------------------------------------------------------');
      console.log('Execution of the proposal');
      
      const proposal_execution = await contract_execute_transaction(contract.address, signer_1, 0);
      console.log(" ");
      console.log(`Execute hash: ${proposal_execution.hash}`);
      console.log(" ");

      console.log('-----------------------------------------------------------');
      console.log('Third Balance Check');

      // Balances:
      account_bal_1 = await provider.getBalance(address_1);
      account_bal_2 = await provider.getBalance(address_2);
      account_bal_3 = await provider.getBalance(address_3);
      account_bal_5 = await provider.getBalance(address_5);
      account_bal_10 = await provider.getBalance(address_10); 
      contract_bal = await provider.getBalance(contract.address);

      console.log(" ");
      console.log('Accounts: ');
      console.log(`${address_1} balance in ETH :${ethers.utils.formatEther(account_bal_1)}`);
      console.log(`${address_2} balance in ETH :${ethers.utils.formatEther(account_bal_2)}`);
      console.log(`${address_3} balance in ETH :${ethers.utils.formatEther(account_bal_3)}`);
      console.log(`${address_5} balance in ETH :${ethers.utils.formatEther(account_bal_5)}`);
      console.log(`${address_10} balance in ETH :${ethers.utils.formatEther(account_bal_10)}`);
      console.log(" ");
      console.log('Contract: ');
      console.log(`Contract balance in ETH :${ethers.utils.formatEther(contract_bal)}`);
      console.log(" ");

      


      console.log('------------   END   ----------------------------------------------------------------------------------------------');
    });  


});