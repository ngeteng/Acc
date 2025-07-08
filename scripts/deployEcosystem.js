const { ethers, config } = require("hardhat");
require("dotenv").config();
const { sendMessage } = require('./telegramReporter.js');

// =============================================================
// PUSAT KONTROL: TENTUKAN SEMUA JARINGAN TARGET DI SINI
// =============================================================
const targetNetworks = ["Pharos", "Somnia", "OG"];

// =============================================================
// FUNGSI HELPER
// =============================================================
function shortenAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
}

// =============================================================
// SCRIPT UTAMA
// =============================================================
async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("⛔ PRIVATE_KEY tidak ditemukan di file .env");
  }

  // Loop utama untuk setiap jaringan target
  for (const networkName of targetNetworks) {
    console.log(`\n\n=================================================`);
    console.log(`🚀 Memulai proses di jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      // 1. SETUP KONEKSI UNTUK JARINGAN SAAT INI
      const networkConfig = config.networks[networkName];
      if (!networkConfig) {
        console.warn(`⚠️  Konfigurasi untuk jaringan '${networkName}' tidak ditemukan. Melewati...`);
        continue;
      }
      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      const signer = new ethers.Wallet(privateKey, provider);

      console.log(`   - Menggunakan wallet: ${signer.address}`);

      // 2. DEPLOY TOKEN
      console.log("[1/4] 📡 Mendeploy kontrak token (MyToken)...");
      const tokenFactory = await ethers.getContractFactory("MyToken", signer);
      const token = await tokenFactory.deploy("Ecosystem Token", "ECO", ethers.parseUnits("1000000", 18));
      await token.waitForDeployment();
      const tokenAddress = await token.getAddress();
      console.log(`✔  MyToken berhasil di-deploy ke: ${tokenAddress}`);

      // 3. DEPLOY VAULT
      console.log("\n[2/4] 🏦 Mendeploy kontrak vault (StakingVault)...");
      const vaultFactory = await ethers.getContractFactory("StakingVault", signer);
      const vault = await vaultFactory.deploy(tokenAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  StakingVault berhasil di-deploy ke: ${vaultAddress}`);

      // 4. LAKUKAN INTERAKSI
      const amountToStake = ethers.parseUnits("5000", 18);
      console.log(`\n[3/4] 👍 Memberi izin (approve) kepada Vault...`);
      const approveTx = await token.approve(vaultAddress, amountToStake);
      await approveTx.wait();
      console.log(`✔  Approve berhasil.`);

      console.log("\n[4/4] 🥩 Melakukan staking ke Vault...");
      const stakeTx = await vault.stake(amountToStake);
      await stakeTx.wait();
      console.log("✔  Staking berhasil!");

      // Kirim laporan sukses ke Telegram
      const successMessage = `✅ Ekosistem Mini *SUKSES* di _${networkName.toUpperCase()}_\n\n*Token (ECO)*: \`${shortenAddress(tokenAddress)}\`\n*Vault*: \`${shortenAddress(vaultAddress)}\`\n\n*Aksi*: Deploy 2 kontrak & stake *5,000 ECO* berhasil!`;
      await sendMessage(successMessage);

    } catch (error) {
      console.error(`❌ Pembangunan Ekosistem GAGAL di jaringan ${networkName.toUpperCase()}:`, error);
      const failureMessage = `❌ Pembangunan Ekosistem *GAGAL* di _${networkName.toUpperCase()}_\n\n*Error*: \`${error.message}\``;
      await sendMessage(failureMessage);
    }
  }
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal pada skrip utama:", error);
    process.exit(1);
});
