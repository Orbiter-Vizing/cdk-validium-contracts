/* eslint-disable prettier/prettier */
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { BigNumber, BigNumberish, constants, utils, providers } from 'ethers';
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
import axios from 'axios';


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

  // check zkfair
  // const address = '0xbEcB16D2EE559f3b8c1f6F981e74C6455e206728';
  // continuousSearch(address);

  // cadona 
  // const addressHash = '0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582';
  // for(let block = 0; block < 10; block++) {
  //   const balance = await currentProvider.getBalance(addressHash, block);
  //   console.log(`bridge balance in block ${block}: `, balance.toString());
  // }

  // Polygon zkEVM
  const polygonBridgeAddr = "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe";
  await getBridgeBalances(currentProvider, polygonBridgeAddr, 0, 10, "bridge");
  const sequnencerAddr = "0x1DBA1131000664b884A1Ba238464159892252D3a";
  await getBridgeBalances(currentProvider, sequnencerAddr, 0, 10, "sequencer");


}
async function getBridgeBalances(provider: providers.Provider, address: string, startBlk: number, endBlk: number, addressTag: string) {
  for(let block = startBlk; block < endBlk; block++) {
    const balance = await provider.getBalance(address, block);
    console.log(`${addressTag} balance in block ${block}: `, balance.toString());
  }
}




async function getTransactionList(addressHash: string): Promise<any> {
  const baseUrl = 'https://explorer-ui.zkevm-testnet.com/api';
  const module = 'account';
  const action = 'txlist';

  const url = `${baseUrl}?module=${module}&action=${action}&address=${addressHash}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function continuousSearch(address: string) {
  let nextPageParams = {
    block_number: Infinity,
    items_count: 50
  };

  while (nextPageParams.block_number > 0) {
    const data = await getCoinBalanceHistory(address, nextPageParams);
    console.log(data);

    if (data && data.next_page_params) {
      nextPageParams = data.next_page_params;
    } else {
      break;
    }
  }
}

// API call
// curl -X 'GET' \
//   'https://scan.zkfair.io/api/v2/addresses/0xbEcB16D2EE559f3b8c1f6F981e74C6455e206728/coin-balance-history' \
//   -H 'accept: application/json'

async function getCoinBalanceHistory(address: string, nextPageParams?: { block_number: number, items_count: number }): Promise<any> {
  let url = `https://scan.zkfair.io/api/v2/addresses/${address}/coin-balance-history`;

  if (nextPageParams) {
    const { block_number, items_count } = nextPageParams;
    url += `?block_number=${block_number}&items_count=${items_count}`;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function main() {
  await interactContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
