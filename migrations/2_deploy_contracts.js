let my_contract = artifacts.require("Firmas");

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

module.exports = async function (deployer, network) {
    try {
        await deployer.deploy(my_contract, [process.env.ADDRESS_1, process.env.ADDRESS_2, process.env.ADDRESS_3], 2);
    } catch (e) {
        console.log(`Error in migration: ${e.message}`);
    }
}