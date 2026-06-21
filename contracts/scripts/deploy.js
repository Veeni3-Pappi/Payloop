/**
 * PayLoop — Contract Deployment Script (Hardhat 3)
 *
 * Deploys all 4 contracts to the configured network:
 *   1. LoopToken (ERC-20)
 *   2. CreditScore
 *   3. CircleVault
 *   4. LendingPool (receives CircleVault address)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network amoy
 */

import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // Connect to the configured network
  const connection = await hre.network.connect();
  const provider = new ethers.BrowserProvider(connection.provider);
  const deployer = await provider.getSigner();
  const deployerAddress = await deployer.getAddress();

  console.log("Deploying contracts with account:", deployerAddress);

  const balance = await provider.getBalance(deployerAddress);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    console.error("ERROR: Deployer wallet has no balance. Get testnet MATIC first.");
    process.exit(1);
  }

  // Helper: read compiled artifact and deploy
  async function deployContract(name, constructorArgs = []) {
    console.log(`\n--- Deploying ${name} ---`);
    const artifact = await hre.artifacts.readArtifact(name);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    const contract = await factory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`${name} deployed to:`, address);
    return { contract, address };
  }

  // 1. Deploy LoopToken
  const loopToken = await deployContract("LoopToken", [deployerAddress]);

  // 2. Deploy CreditScore
  const creditScore = await deployContract("CreditScore", [deployerAddress]);

  // 3. Deploy CircleVault
  const circleVault = await deployContract("CircleVault", [deployerAddress]);

  // 4. Deploy LendingPool (needs vault address)
  const lendingPool = await deployContract("LendingPool", [deployerAddress, circleVault.address]);

  // Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("  PayLoop Contract Addresses");
  console.log("═══════════════════════════════════════════");
  console.log(`  LoopToken:    ${loopToken.address}`);
  console.log(`  CreditScore:  ${creditScore.address}`);
  console.log(`  CircleVault:  ${circleVault.address}`);
  console.log(`  LendingPool:  ${lendingPool.address}`);
  console.log("═══════════════════════════════════════════");
  console.log("\nCopy these addresses into your .env files!");
  console.log("\n# For backend/.env:");
  console.log(`CIRCLE_VAULT_ADDRESS=${circleVault.address}`);
  console.log(`LENDING_POOL_ADDRESS=${lendingPool.address}`);
  console.log(`CREDIT_SCORE_ADDRESS=${creditScore.address}`);
  console.log(`LOOP_TOKEN_ADDRESS=${loopToken.address}`);
  console.log("\n# For web/.env.local:");
  console.log(`NEXT_PUBLIC_CIRCLE_VAULT_ADDRESS=${circleVault.address}`);
  console.log(`NEXT_PUBLIC_LENDING_POOL_ADDRESS=${lendingPool.address}`);
  console.log(`NEXT_PUBLIC_CREDIT_SCORE_ADDRESS=${creditScore.address}`);
  console.log(`NEXT_PUBLIC_LOOP_TOKEN_ADDRESS=${loopToken.address}`);

  // Close the network connection
  await connection.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
