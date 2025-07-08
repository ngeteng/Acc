const { ethers, config } = require("hardhat");
require("dotenv").config();
const { sendMessage } = require('./telegramReporter.js');

// =============================================================
// KONFIGURASI
// =============================================================
const targetNetworks = ["Pharos", "Somnia", "OG"];

// =============================================================
// FUNGSI HELPER
// =============================================================
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shortenAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
}

// =============================================================
// SCRIPT UTAMA
// =============================================================
async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) { throw new Error("⛔ PRIVATE_KEY tidak ditemukan di file .env"); }

  const deploymentResults = [];
  const startTime = new Date();
  
  console.log(`\n🚀 Memulai deployment massal ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    console.log(`\n=================================================`);
    console.log(`- Memproses jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(privateKey, provider);
      
      // ---- GENERATE PARAMETER ACAK ----
      const randomName = `Token ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(3).toUpperCase();
      const randomSupply = generateRandomNumber(500000, 2000000);
      const randomSupplyInSmallestUnit = ethers.parseUnits(randomSupply.toString(), 18);
      console.log(`   - Token Dibuat: ${randomName} (${randomSymbol})`);
      // ---------------------------------

      // 1. DEPLOY TOKEN DENGAN PARAMETER ACAK
      console.log("   - [1/4] Mendeploy MyToken...");
      const tokenFactory = await ethers.getContractFactory("MyToken", signer);
      const token = await tokenFactory.deploy(randomName, randomSymbol, randomSupplyInSmallestUnit);
      await token.waitForDeployment();
      const tokenAddress = await token.getAddress();
      console.log(`✔  MyToken ter-deploy di: ${tokenAddress}`);

      // 2. DEPLOY VAULT
      console.log("   - [2/4] Mendeploy StakingVault...");
      const vaultFactory = await ethers.getContractFactory("StakingVault", signer);
      const vault = await vaultFactory.deploy(tokenAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  StakingVault ter-deploy di: ${vaultAddress}`);

      // 3. & 4. INTERAKSI (APPROVE & STAKE)
      const amountToStake = ethers.parseUnits("5000", 18);
      console.log("   - [3/4] Melakukan Approve...");
      await token.approve(vaultAddress, amountToStake);
      console.log("   - [4/4] Melakukan Stake...");
      await vault.stake(amountToStake);
      
      console.log(`✔  Proses di jaringan ${networkName.toUpperCase()} SUKSES.`);
      deploymentResults.push(`✅ *${networkName.toUpperCase()}*: SUKSES!\n   - Token: *${randomName}*\n   - Alamat: \`${shortenAddress(tokenAddress)}\``);

    } catch (error) {
      console.error(`❌ Proses GAGAL di jaringan ${networkName.toUpperCase()}:`, error.message);
      deploymentResults.push(`❌ *${networkName.toUpperCase()}*: GAGAL!\n   - Error: \`${error.message.substring(0, 50)}...\``);
    }
  }

  // MEMBUAT & MENGIRIM LAPORAN RANGKUMAN
  console.log("\n=================================================");
  console.log("🏁 Semua proses selesai. Membuat laporan rangkuman...");
  const endTime = new Date();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  let summaryMessage = `*Laporan Rangkuman Deployment Bot*\n\n`;
  summaryMessage += `*Durasi Total*: ${duration} detik\n\n`;
  summaryMessage += `*Hasil Per Jaringan:*\n`;
  summaryMessage += deploymentResults.join('\n\n');

  await sendMessage(summaryMessage);
  console.log("Laporan rangkuman akhir telah dikirim ke Telegram.");
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal pada skrip utama:", error);
    process.exit(1);
});
