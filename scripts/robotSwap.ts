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
import { random } from 'lodash';



export async function robotswap() {
  let currentProvider = ethers.provider;
  let deployer;
  if (process.env.ROBOT_MNEMONIC) {
    deployer = ethers.Wallet.fromMnemonic(process.env.ROBOT_MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(currentProvider);
    console.log('Using ROBOT_MNEMONIC deployer with address: ', deployer.address);
} else {
    [deployer] = (await ethers.getSigners());
    console.log('Using ENV deployer with address: ', deployer.address);
}

  const first10signers = await ethers.getSigners();
  const signers = first10signers.slice(0, 10);
  console.log("total using signers:", signers.length);
  let nonce: number[] = [];

  // check balance
  console.log("check balance for signer");
  for(let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    nonce[i] = await signer.getTransactionCount();
    console.log(`signer ${i} address ${signer.address} balance:${ethers.utils.formatEther(await signer.getBalance())}, nonce:${nonce[i]}` );
  }

  if((await signers[1].getBalance()).eq(0)) {
  // if(true) {
    console.log("airdrop from signer 0");
    const signer0Balance = await signers[0].getBalance();
    console.log("signer 0 balance:", ethers.utils.formatEther(signer0Balance));
    for(let i = 1; i < signers.length; i++) {
      const signer = signers[0];
      const target = signers[i];
      const amount = ethers.utils.parseEther('1');
      console.log(`from: ${signer.address} to: ${target.address} amount: ${ethers.utils.formatEther(amount)} nonce:${nonce[0]}`)
      const tx = {
          to: target.address,
          value: amount,
          nonce: nonce[0]++
      };
      await signer.sendTransaction(tx);
    }
  }
  let signer = signers[1];
  while(true) {
      const balance = await signer.getBalance();
      const swapAmount = BigNumber.from(balance).div(2);
      const formattAmount = (ethers.utils.formatEther(swapAmount));
      const randomAmount = random(formattAmount);
      const amount = ethers.utils.parseEther(randomAmount.toString());

      const target = signers[Math.floor(Math.random() * signers.length)];
      const index = signers.indexOf(signer);
      console.log(`from: ${signer.address} to: ${target.address} amount: ${ethers.utils.formatEther(amount)} nonce:${nonce[index]}`)
      
      const tx = {
          to: target.address,
          value: amount,
          nonce: nonce[index]++
      };

      await signer.sendTransaction(tx);
      signer = target;
  }
}




async function main() {
  await robotswap();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
