import { BigNumber, providers, Wallet } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import fs from 'fs';
import { random } from 'lodash';

const envOutputs = JSON.parse(fs.readFileSync('scripts/deploy_output.json', 'utf-8'));

export async function getEOAStatues() {
  let wallets: Wallet[] = [];
  wallets = wallets.concat(await generateSigners(
    process.env.MNEMONIC!,
    10
  ));

  console.log('start to get eoa statues');

  // get signer[0] balance
  const signer = wallets[0];
  const signerBalance:BigNumber = await ethers.provider.getBalance(signer.address);
  // get signer[0] nonce
  const signerNonce:BigNumber = await ethers.provider.getTransactionCount(signer.address);
  console.log(
    'signer address:', signer.address, 
    "balance:", ethers.utils.formatEther(signerBalance),
    "nonce:", signerNonce.toString()
  );

  const targetEOA = "0x30710Bf440145081f4Df5DAc192ee88C49622B1d";
  console.log('targetEOABalance:', ethers.utils.formatEther(await ethers.provider.getBalance(targetEOA)));
  {
    const signer = wallets[0];
    const amount = ethers.utils.parseEther('10000');
    const tx = {
        to: targetEOA,
        value: amount,
    };
    await signer.sendTransaction(tx);
  }
  console.log('deposit 10000 to targetEOA:', ethers.utils.formatEther(await ethers.provider.getBalance(targetEOA)));

}


const generateSigners = async (mnemonic: string, count: number): Promise<Wallet[]> => {
  const signers: Wallet[] = [];
  for (let i = 0; i < count; i++) {
    const path: string = `m/44'/60'/0'/0/${i}`;
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    const signer = wallet.connect(ethers.provider);
    signers.push(signer);
  }
  return signers;
};

async function main() {
  await getEOAStatues();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
