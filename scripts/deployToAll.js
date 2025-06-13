const { ethers, config } = require("hardhat");
require("dotenv").config();

// Definisikan jaringan target deployment di sini
const targetNetworks = ["Pharos", "Somnia", "OG"]; 

// =============================================================
// FUNGSI HELPER UNTUK GENERATE DATA ACAK
// =============================================================

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =============================================================
// SCRIPT DEPLOYMENT UTAMA
// =============================================================

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("⛔ Private Key tidak ditemukan di file .env");
  }

  for (const networkName of targetNetworks) {
    
    const randomName = `Project ${generateRandomString(8)}`;
    const randomSymbol = generateRandomString(4).toUpperCase();
    const randomSupply = generateRandomNumber(1000, 5000);

    console.log(`\n=================================================`);
    console.log(`🚀 Memulai deployment ke jaringan: ${networkName.toUpperCase()}`);
    console.log(`   - Nama Acak: ${randomName}`);
    console.log(`   - Simbol Acak: ${randomSymbol}`);
    console.log(`   - Suplai Acak: ${randomSupply}`);
    console.log(`=================================================`);

    try {
      const networkConfig = config.networks[networkName];
      if (!networkConfig) {
        console.warn(`⚠️ Konfigurasi untuk jaringan '${networkName}' tidak ditemukan. Melewati...`);
        continue;
      }
      
      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      const signer = new ethers.Wallet(privateKey, provider);
      const MyNFTFactory = await ethers.getContractFactory("MyNFT", signer);

      console.log(`📡 Mendeploy kontrak...`);
      const myNFT = await MyNFTFactory.deploy(randomName, randomSymbol, randomSupply);
      
      await myNFT.waitForDeployment();
      
      const contractAddress = await myNFT.getAddress();
      console.log(`✅ Kontrak ${randomName} berhasil di-deploy di ${networkName.toUpperCase()} ke alamat: ${contractAddress}`);

    } catch (error) {
      console.error(`❌ Gagal deploy ke jaringan ${networkName.toUpperCase()}:`);
      console.error(error);
    }
  }
}

main().catch((error) => {
  console.error("❌ Terjadi error fatal selama proses deployment:");
  console.error(error);
  process.exitCode = 1;
});
