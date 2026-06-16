import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy LoopToken
  console.log("\n--- Deploying LoopToken ---");
  const LoopToken = await hre.ethers.getContractFactory("LoopToken");
  const loopToken = await LoopToken.deploy(deployer.address);
  await loopToken.waitForDeployment();
  const loopTokenAddress = await loopToken.getAddress();
  console.log("LoopToken deployed to:", loopTokenAddress);

  // 2. Deploy CreditScore
  console.log("\n--- Deploying CreditScore ---");
  const CreditScore = await hre.ethers.getContractFactory("CreditScore");
  const creditScore = await CreditScore.deploy(deployer.address);
  await creditScore.waitForDeployment();
  const creditScoreAddress = await creditScore.getAddress();
  console.log("CreditScore deployed to:", creditScoreAddress);

  // 3. Deploy CircleVault
  console.log("\n--- Deploying CircleVault ---");
  const CircleVault = await hre.ethers.getContractFactory("CircleVault");
  const circleVault = await CircleVault.deploy(deployer.address);
  await circleVault.waitForDeployment();
  const circleVaultAddress = await circleVault.getAddress();
  console.log("CircleVault deployed to:", circleVaultAddress);

  // 4. Deploy LendingPool (needs vault address)
  console.log("\n--- Deploying LendingPool ---");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(deployer.address, circleVaultAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", lendingPoolAddress);

  // Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("  PayLoop Contract Addresses");
  console.log("═══════════════════════════════════════════");
  console.log(`  LoopToken:    ${loopTokenAddress}`);
  console.log(`  CreditScore:  ${creditScoreAddress}`);
  console.log(`  CircleVault:  ${circleVaultAddress}`);
  console.log(`  LendingPool:  ${lendingPoolAddress}`);
  console.log("═══════════════════════════════════════════");
  console.log("\nCopy these addresses into your .env files!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
