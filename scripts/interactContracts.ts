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
import path from 'path';


const envOutputs = JSON.parse(fs.readFileSync('scripts/deploy_output.json', 'utf-8'));
export async function interactContracts() {
  let currentProvider = ethers.provider;
  let deployer: any;
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

  // const newTrustedSequencerURL = 'https://sequencer.optimism.io';
  // const CDKValidiumFactory = await ethers.getContractFactory('CDKValidium', deployer);
  // const CDKValidiumInstance = CDKValidiumFactory.attach(envOutputs.cdkValidiumAddress);
  // const tx = await CDKValidiumInstance.setTrustedSequencerURL(newTrustedSequencerURL);
  // console.log("hash of tx: ", tx.hash);

  // const polygonZkEVMBridgeAddress ="0x7B293DfE40CED84aeCF4cfc5b2F1791101C6510D";
  const polygonZkEVMBridgeAddress = "0x5bAC0f226fEdbC01bCAf0A9EB3da4BB555425B1d";
  const polygonZkEVMBridgeFactory = await ethers.getContractFactory('PolygonZkEVMBridge', deployer);
  const polygonZkEVMBridgeInstance = polygonZkEVMBridgeFactory.attach(polygonZkEVMBridgeAddress);
  console.log('polygonZkEVMBridgeInstance: ', polygonZkEVMBridgeInstance.address);
  console.log("polygonZkEVMaddress:", await polygonZkEVMBridgeInstance.lastUpdatedDepositCount());
  console.log("globalExitRootManager:", await polygonZkEVMBridgeInstance.globalExitRootManager());
  console.log("networkID:", await polygonZkEVMBridgeInstance.networkID());
  const tx = await polygonZkEVMBridgeInstance.bridgeAsset(
    1,
    deployer.address,
    ethers.utils.parseEther("0.001"),
    "0x0000000000000000000000000000000000000000",
    true,
    "0x00",
    {value:ethers.utils.parseEther("0.001")}
  );
  console.log("hash of tx: ", tx.hash);

}


async function main() {
  await interactContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
