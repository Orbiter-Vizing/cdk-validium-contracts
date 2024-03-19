import { ethers , upgrades} from "hardhat";
import fs from "fs";
import path from "path";
import { Signer, Wallet } from "ethers";
const pathDeployOutput = path.join(__dirname, "../deployment/deploy_output.json");

const CANCELLER_ROLE = "0xfd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783";
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const EXECUTOR_ROLE = "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63";
const PROPOSER_ROLE = "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
const TIMELOCK_ADMIN_ROLE = "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5";

async function main() {
  let currentProvider = ethers.provider;
  const deployParameters = JSON.parse(fs.readFileSync(pathDeployOutput, "utf-8"));

  if (await currentProvider.getCode(deployParameters.cdkValidiumAddress) === '0x') {
    throw new Error('CDKValidiumTimelockFactory contract is not deployed');
  }
  let implAddress = await upgrades.erc1967.getImplementationAddress(
    deployParameters.cdkValidiumAddress
  );

  const upgradeParams = fetchTimeLockUpgradeParams()[0];

  if(implAddress !== upgradeParams.newImpl) {
    throw new Error('upgrade not done, current implementation address is: ' + implAddress);
  }else{
    console.log("contract upgrade success");
  }
}

export function fetchTimeLockUpgradeParams() {
  const pathUpgradeParams = path.join(__dirname, "./upgrade_output_timeLock.json");
  return JSON.parse(fs.readFileSync(pathUpgradeParams, "utf-8"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
