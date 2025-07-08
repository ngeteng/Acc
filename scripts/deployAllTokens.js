const { ethers, hre } = require("hardhat"); // Tambahkan hre untuk akses info jaringan
require("dotenv").config();
const { sendMessage } = require('./telegramReporter.js');

// Helper function untuk memotong alamat
function shortenAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    console.log(`\n=================================================`);
    console.log(`🚀 Memulai deployment EKOSISTEM MINI di ${networkName.toUpperCase()}`);
    console.log(`   - Deployer: ${deployer.address}`);
    console.log(`=================================================`);

    try {
        // =============================================================
        // LANGKAH 1: DEPLOY TOKEN ERC20
        // =============================================================
        console.log("[1/4] 📡 Mendeploy kontrak token (MyToken)...");
        const tokenSupply = ethers.parseUnits("1000000", 18); // 1 Juta token
        const MyTokenFactory = await ethers.getContractFactory("MyToken", deployer);
        const token = await MyTokenFactory.deploy("Ecosystem Token", "ECO", tokenSupply);
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();
        console.log(`✔  MyToken berhasil di-deploy ke: ${tokenAddress}`);

        // =============================================================
        // LANGKAH 2: DEPLOY KONTRAK VAULT
        // =============================================================
        console.log("\n[2/4] 🏦 Mendeploy kontrak vault (StakingVault)...");
        const StakingVaultFactory = await ethers.getContractFactory("StakingVault", deployer);
        // Berikan alamat token kita ke constructor vault
        const vault = await StakingVaultFactory.deploy(tokenAddress);
        await vault.waitForDeployment();
        const vaultAddress = await vault.getAddress();
        console.log(`✔  StakingVault berhasil di-deploy ke: ${vaultAddress}`);

        // =============================================================
        // LANGKAH 3: INTERAKSI - APPROVE
        // =============================================================
        const amountToStake = ethers.parseUnits("5000", 18); // Kita akan stake 5,000 token
        console.log(`\n[3/4] 👍 Memberi izin (approve) kepada Vault untuk memindahkan 5,000 ECO...`);
        const approveTx = await token.approve(vaultAddress, amountToStake);
        await approveTx.wait();
        console.log(`✔  Approve berhasil.`);

        // =============================================================
        // LANGKAH 4: INTERAKSI - STAKE
        // =============================================================
        console.log("\n[4/4] 🥩 Melakukan staking 5,000 ECO ke dalam Vault...");
        const stakeTx = await vault.stake(amountToStake);
        await stakeTx.wait();
        console.log("✔  Staking berhasil!");

        // =============================================================
        // LAPORAN KE TELEGRAM
        // =============================================================
        console.log("\n✅ EKOSISTEM MINI BERHASIL DIBANGUN DAN BERINTERAKSI!");
        const successMessage = `✅ Ekosistem Mini *SUKSES* di _${networkName.toUpperCase()}_\n\n*Token (ECO)*: \`${shortenAddress(tokenAddress)}\`\n*Vault*: \`${shortenAddress(vaultAddress)}\`\n\n*Aksi*: Berhasil deploy 2 kontrak & stake *5,000 ECO* ke dalam vault!`;
        await sendMessage(successMessage);

    } catch (error) {
        console.error("❌ Pembangunan Ekosistem GAGAL:", error);
        const failureMessage = `❌ Pembangunan Ekosistem *GAGAL* di _${networkName.toUpperCase()}_\n\n*Error*: \`${error.message}\``;
        await sendMessage(failureMessage);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
