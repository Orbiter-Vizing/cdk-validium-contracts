/* eslint-disable prettier/prettier */
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { assert, expect } from 'chai';
import { BigNumber, BigNumberish, constants, utils } from 'ethers';
import { keccak256 } from '@ethersproject/keccak256';
import {
  BytesLike,
  arrayify,
  defaultAbiCoder,
  solidityPack,
} from 'ethers/lib/utils';
import fs from 'fs';
import { env } from 'process';

const envOutputs = JSON.parse(fs.readFileSync('scripts/deploy_output.json', 'utf-8'));

export async function readContracts() {
  let currentProvider = ethers.provider;
  let deployer;
  if (process.env.ROBOT_MNEMONIC) {
      deployer = ethers.Wallet.fromMnemonic(process.env.ROBOT_MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(currentProvider);
      console.log('Using ROBOT_MNEMONIC deployer with address: ', deployer.address);
  } else {
      [deployer] = (await ethers.getSigners());
      console.log('Using ENV deployer with address: ', deployer.address);
  }
  const CDKValidiumDeployerFactory = await ethers.getContractFactory('CDKValidiumDeployer', deployer);
  const cdkValidiumDeployerContract = CDKValidiumDeployerFactory.attach(envOutputs.cdkValidiumDeployerContract);
  await cdkValidiumDeployerContract.owner().then((owner:any) => {
    console.log('owner: ', owner);
  });

  const PolygonZkEVMGlobalExitRootL2Address = "0xa40d5f56745a118d0906a34e69aec8c0db1cb8fa";
  const PolygonZkEVMGlobalExitRootL2Factory = await ethers.getContractFactory('PolygonZkEVMGlobalExitRootL2', deployer);
  const PolygonZkEVMGlobalExitRootL2Contract = PolygonZkEVMGlobalExitRootL2Factory.attach(PolygonZkEVMGlobalExitRootL2Address);
  console.log('brigdeAddress: ', await PolygonZkEVMGlobalExitRootL2Contract.bridgeAddress());
  console.log('lastRollupExitRoot: ', await PolygonZkEVMGlobalExitRootL2Contract.lastRollupExitRoot());
}


async function main() {
  await readContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
