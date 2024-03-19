/* eslint-disable no-console, no-unused-vars, no-use-before-define */
const hre = require('hardhat');
const { ethers, upgrades } = require('hardhat');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const { defaultAbiCoder } = require('@ethersproject/abi');
const upgradeParameters = require('./upgrade_parameters.json');
const { keccak256 } = require('@ethersproject/keccak256');
const pathOutputJson = path.join(__dirname, `./upgrade_output_timeLock.json`);

async function main() {
    // Set multiplier Gas
    let currentProvider = ethers.provider;
    if (upgradeParameters.multiplierGas) {
        if (process.env.HARDHAT_NETWORK !== 'hardhat') {
            const multiplierGas = upgradeParameters.multiplierGas;
            currentProvider = new ethers.providers.JsonRpcProvider(`https://${process.env.HARDHAT_NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
            async function overrideFeeData() {
                const feedata = await ethers.provider.getFeeData();
                return {
                    maxFeePerGas: feedata.maxFeePerGas.mul(multiplierGas),
                    maxPriorityFeePerGas: feedata.maxPriorityFeePerGas.mul(multiplierGas),
                };
            }
            currentProvider.getFeeData = overrideFeeData;
        }
    }

    // Check contract name existence
    for (const upgrade of upgradeParameters.upgrades) {
        await ethers.getContractFactory(upgrade.contractName);
    }

    let deployer;
    if (upgradeParameters.deployerPvtKey) {
        deployer = new ethers.Wallet(upgradeParameters.deployerPvtKey, currentProvider);
    }else if (process.env.DEPLOYER_PRIVATE_KEY) {
        deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, currentProvider);
    } else if (process.env.MNEMONIC) {
        deployer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(currentProvider);
        console.log("using mnemonic", deployer.address)
    } else {
        [deployer] = (await ethers.getSigners());
    }
    // compìle contracts
    await hre.run('compile');

    const proxyAdmin = await upgrades.admin.getInstance();
    const output = [];

    // Upgrade cdkValidium
    for (const upgrade of upgradeParameters.upgrades) {
        const proxyPolygonAddress = upgrade.address;
        const cdkValidiumFactory = await ethers.getContractFactory(upgrade.contractName, deployer);

        let newImplPolygonAddress;

        if (upgrade.constructorArgs) {
            newImplPolygonAddress = await upgrades.prepareUpgrade(proxyPolygonAddress, cdkValidiumFactory,
                {
                    constructorArgs: upgrade.constructorArgs,
                    unsafeAllow: ['constructor', 'state-variable-immutable'],
                },
            );

            console.log({ newImplPolygonAddress });
            console.log("you can verify the new impl address with:")
            console.log(`npx hardhat verify --constructor-args upgrade/arguments.js ${newImplPolygonAddress} --network ${process.env.HARDHAT_NETWORK}\n`);
            console.log("Copy the following constructor arguments on: upgrade/arguments.js \n", upgrade.constructorArgs)
        } else {
            newImplPolygonAddress = await upgrades.prepareUpgrade(proxyPolygonAddress, cdkValidiumFactory);

            console.log({ newImplPolygonAddress });
            console.log("you can verify the new impl address with:")
            console.log(`npx hardhat verify ${newImplPolygonAddress} --network ${process.env.HARDHAT_NETWORK}`);
        }

        // Use timelock
        // const salt = upgradeParameters.timelockSalt || ethers.constants.HashZero;
        const predecesoor = ethers.constants.HashZero;
        const value = 0;
        const salt = upgradeParameters.timelockSalt || keccak256(
            defaultAbiCoder.encode(
              ['uint256', 'uint256', 'uint256'],
              [newImplPolygonAddress, value, predecesoor],
            ),
          );

        let operation;
        if (upgrade.callAfterUpgrade.functionName) {
            operation = genOperation(
                proxyAdmin.address,
                value, // value
                proxyAdmin.interface.encodeFunctionData(
                    'upgradeAndCall',
                    [
                        proxyPolygonAddress,
                        newImplPolygonAddress,
                        cdkValidiumFactory.interface.encodeFunctionData(
                            upgrade.callAfterUpgrade.functionName,
                            upgrade.callAfterUpgrade.arguments,
                        )
                    ],
                ),
                predecesoor, // predecesoor
                salt, // salt
            );


        } else {
            operation = genOperation(
                proxyAdmin.address,
                value, // value
                proxyAdmin.interface.encodeFunctionData(
                    'upgrade',
                    [proxyPolygonAddress,
                        newImplPolygonAddress],
                ),
                predecesoor, // predecesoor
                salt, // salt
            );
        }

        // Timelock operations
        const TimelockFactory = await ethers.getContractFactory('CDKValidiumTimelock', deployer);
        const minDelay = upgradeParameters.timelockMinDelay || 0;

        // Schedule operation
        const scheduleData = TimelockFactory.interface.encodeFunctionData(
            'schedule',
            [
                operation.target,
                operation.value,
                operation.data,
                operation.predecessor,
                operation.salt,
                minDelay,
            ],
        );
        // Execute operation
        const executeData = TimelockFactory.interface.encodeFunctionData(
            'execute',
            [
                operation.target,
                operation.value,
                operation.data,
                operation.predecessor,
                operation.salt,
            ],
        );
        
        output.push({
            id: operation.id,
            contractName: upgrade.contractName,
            target: proxyAdmin.address,
            newImpl: newImplPolygonAddress,
            value: 0,
            scheduleData,
            executeData,
            predecessor: predecesoor,
            salt:salt,
        })
        console.log("upgrade operation:", operation);
    }

    fs.writeFileSync(pathOutputJson, JSON.stringify(output, null, 1));
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// OZ test functions
function genOperation(target, value, data, predecessor, salt) {
    // const id = ethers.utils.solidityKeccak256([
    //     'address',
    //     'uint256',
    //     'bytes',
    //     'bytes32',
    //     'bytes32',
    // ], [
    //     target,
    //     value,
    //     data,
    //     predecessor,
    //     salt,
    // ]);
    const id = keccak256(
        defaultAbiCoder.encode(
          ['address', 'uint256', 'bytes', 'bytes32', 'bytes32'],
          [target, value, data, predecessor, salt],
        ),
      );
    return {
        id, target, value, data, predecessor, salt,
    };
}
