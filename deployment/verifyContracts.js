/* eslint-disable import/no-dynamic-require, no-await-in-loop, no-restricted-syntax, guard-for-in */
require('dotenv').config();
const path = require('path');
const hre = require('hardhat');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const pathDeployOutputParameters = path.join(__dirname, './deploy_output.json');
const pathDeployParameters = path.join(__dirname, './deploy_parameters.json');
const deployOutputParameters = require(pathDeployOutputParameters);
const deployParameters = require(pathDeployParameters);

async function main() {
    // load deployer account
    if (typeof process.env.ETHERSCAN_API_KEY === 'undefined') {
        throw new Error('Etherscan API KEY has not been defined');
    }

    // verify maticToken
    const maticTokenName = 'Vizing Aggregator Token';
    const maticTokenSymbol = 'VAT';
    const maticTokenInitialBalance = ethers.utils.parseEther('21000000');
    try {
        // verify governance
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.maticTokenAddress,
                constructorArguments: [
                    maticTokenName,
                    maticTokenSymbol,
                    deployOutputParameters.deployerAddress,
                    maticTokenInitialBalance,
                ],
            },
        );
    } catch (error) {
        // expect(error.message.toLowerCase().includes('already verified')).to.be.equal(true);
    }

    // verify verifier
    try {
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.verifierAddress,
            },
        );
    } catch (error) {
        // expect(error.message.toLowerCase().includes('already verified')).to.be.equal(true);
    }

    const { minDelayTimelock } = deployParameters;
    const { timelockAddress } = deployParameters;
    try {
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.timelockContractAddress,
                constructorArguments: [
                    minDelayTimelock,
                    [timelockAddress],
                    [timelockAddress],
                    timelockAddress,
                    deployOutputParameters.cdkValidiumAddress,
                ],
            },
        );
    } catch (error) {
        // expect(error.message.toLowerCase().includes('already verified')).to.be.equal(true);
    }

    // verify proxy admin
    try {
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.proxyAdminAddress,
            },
        );
    } catch (error) {
        // expect(error.message.toLowerCase().includes('already verified')).to.be.equal(true);
    }


    // verify cdkValidium address
    try {
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.cdkValidiumAddress,
                constructorArguments: [
                    deployOutputParameters.polygonZkEVMGlobalExitRootAddress,
                    deployOutputParameters.maticTokenAddress,
                    deployOutputParameters.verifierAddress,
                    deployOutputParameters.polygonZkEVMBridgeAddress,
                    deployOutputParameters.cdkDataCommitteeContract,
                    deployOutputParameters.chainID,
                    deployOutputParameters.forkID,
                ],
            },
        );
    } catch (error) {
        console.log(error)
    }

    // verify global exit root address
    try {
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.polygonZkEVMGlobalExitRootAddress,
                constructorArguments: [
                    deployOutputParameters.cdkValidiumAddress,
                    deployOutputParameters.polygonZkEVMBridgeAddress,
                ],
            },
        );
    } catch (error) {
        console.log(error)
    }

    try {
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.PolygonZkEVMBridgeAddress,
            },
        );
    } catch (error) {
        expect(error.message.toLowerCase().includes('proxyadmin')).to.be.equal(true);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
