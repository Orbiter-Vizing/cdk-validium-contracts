import { BigNumber, providers, Wallet } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import fs from 'fs';
import { random } from 'lodash';

const testTransactionCount: number = 10; 
const receiverAddress: string = '0xc3C7A782dda00a8E61Cb9Ba0ea8680bb3f3B9d10';
interface tpsLogStruct {
  tps: number,
  txsNumber: number,
  secondsCost: number,
  timestamp: number
}
let tpsLog: tpsLogStruct[] = [];

async function testTPS(): Promise<void> {
  let wallets: Wallet[] = [];
  wallets = wallets.concat(await generateSigners(
    process.env.MNEMONIC!,
    testTransactionCount
  ));

  console.log('we have wallets:', wallets.length);

  const airdropEnable:boolean = true;
  if(airdropEnable) {
    // const batchTransferAddress = '0x2C8889cB17e5b88bA21E92c9b4fd7950E5a1d59e';
    // const batchTransferAddress = '0xB49D68fFfE0F47493C0265F304C965742E4e0374';
    const batchTransferAddress = "0xB49D68fFfE0F47493C0265F304C965742E4e0379"
    const isdeployed: boolean = await ethers.provider.getCode(batchTransferAddress) !== '0x'? true: false;
    const batchTransferManagerFactory = await ethers.getContractFactory('BatchTransferManager');
    let batchTransferManager: any;
    if(isdeployed){
      batchTransferManager = await batchTransferManagerFactory.attach(batchTransferAddress);
    }else{
      batchTransferManager = await batchTransferManagerFactory.deploy();
      await batchTransferManager.deployed();
    }
    const batchTransferManagerBalance:BigNumber = await ethers.provider.getBalance(batchTransferManager.address);
    console.log(
      'batchTransferManager address:', batchTransferManager.address, 
      "balance:", ethers.utils.formatEther(batchTransferManagerBalance)
    );
    
    if(batchTransferManagerBalance.eq(0)) 
    {
      const signer = wallets[0];
      const amount = ethers.utils.parseEther('300');
      const tx = {
          to: batchTransferManager.address,
          value: amount,
      };
      console.log(`deposit ${ethers.utils.formatEther(amount)} to batchTransferManager`)
      await signer.sendTransaction(tx);
    }

    const batchTransfer: boolean = true;
    if(batchTransfer) {
      const addresses: string[] = [];
      for(let i = 0; i < wallets.length; i++) {
        addresses.push(wallets[i].address);
      }
      const tx2 = await batchTransferManager.batchTransfer(
        addresses
        );
      await tx2.wait(1);
      console.log("batchTransfer done!");
      console.log(`batchTransferManager balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(batchTransferManager.address))}`);
    }
  }else{
    // const batchSize = 50;
    // for (let i = 0; i < wallets.length; i += batchSize) {
    //   const batch = wallets.slice(i, i + batchSize);
    //   await Promise.all(
    //     batch.map(async (wallet) => {
    //       const balance = await ethers.provider.getBalance(wallet.address);
    //       console.log(`wallet[${wallets.indexOf(wallet)}] ${wallet.address} balance: ${ethers.utils.formatEther(balance)}`);
    //     })
    //   );
    // }
  }
  let txPerBatch = 0;
  let totalTx = 0;
  console.log(`------tps test start------`);
  txPerBatch = 10;
  totalTx = 30;
  for(let j = 1; j < 100; j++) {
    txPerBatch = 20;
    await processTransactions(wallets, txPerBatch, totalTx);
  }

  console.log(`------tps test end------`);
}

async function processTransactions(wallets: Wallet[], txPerBatch: number, totalTx: number) {
  const fileName = (Date.now()/1000).toFixed(0);
  let retry = false;
  let startIndex = 0;
  do {
      try {
          for(let i = startIndex; i < totalTx; i ++) {
              startIndex = i;
              const txNumber = txPerBatch;
              const startTime = Date.now();
              const promises = await measureTPS(wallets, txNumber);
              await Promise.all(promises);

              const endTime = Date.now();
              const timeCost = ((endTime - startTime) / 1000);
              const tps = BigNumber.from((txNumber / timeCost).toFixed(0)).toNumber();
              console.log("tps:%d (%d txs in %d seconds)", 
              tps.toFixed(2), 
              txNumber, 
              timeCost.toFixed(1));
              tpsLog.push({
                  tps: tps,
                  txsNumber: txNumber,
                  secondsCost: timeCost,
                  timestamp: BigNumber.from((Date.now()/1000).toFixed(0)).toNumber()
              });


              if((i % 2) === 0) {
                  const ratio = txPerBatch / 10;
                  await new Promise((resolve) => setTimeout(resolve, ratio*1000));
              }
          }
          console.table(tpsLog);
          retry = false;
      } catch (error) {
          console.log(error);
          console.table(tpsLog);
          retry = true;
          if(tpsLog.length > 0){
              fs.writeFileSync(`scripts/TPSLog_${fileName}.json`, JSON.stringify(tpsLog, null, 2));
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
      }
  } while (retry);
}


const measureTPS = async (wallets: Wallet[], txNumber:number) => {
  const promises: Promise<providers.TransactionResponse>[] = [];
  const tx = {
    to: receiverAddress,
    value: ethers.utils.parseEther('0.0001'),
    gasPrice: ethers.utils.parseUnits('60', 'gwei'),
    gasLimit: 22000,
  };
  // const startIndex = random(wallets.length - txNumber*2);
  const startIndex = 0;
  for (let i = startIndex; i < startIndex + txNumber; i++) {
    const promise: Promise<providers.TransactionResponse> = wallets[i].sendTransaction(tx);
    promises.push(promise);
  }
  return promises;
};


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



testTPS().catch(console.error);