const { ethers, config } = require("hardhat");
require("dotenv").config();

// =============================================================
// PUSAT KONTROL: TENTUKAN SEMUA JARINGAN TARGET DI SINI
// =============================================================
const targetNetworks = ["Somnia", "OG"]; 

// =============================================================
// FUNGSI HELPER UNTUK DATA ACAK
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

// =============================================================
// SCRIPT DEPLOYMENT UTAMA
// =============================================================
async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("⛔ Private Key tidak ditemukan di file .env");
  }

  // Loop melalui setiap jaringan di dalam `targetNetworks`
  for (const networkName of targetNetworks) {
    
    // Generate data acak baru untuk setiap deployment
    const randomName = `Token ${generateRandomString(6)}`;
    const randomSymbol = generateRandomString(3).toUpperCase();
    const randomSupply = generateRandomNumber(500000, 2000000);

    console.log(`\n=================================================`);
    console.log(`🚀 Memulai deployment ke jaringan: ${networkName.toUpperCase()}`);
    console.log(`   - Nama: ${randomName}, Simbol: ${randomSymbol}, Suplai: ${randomSupply}`);
    console.log(`=================================================`);

    try {
      const networkConfig = config.networks[networkName];
      if (!networkConfig) {
        console.warn(`⚠️ Konfigurasi untuk jaringan '${networkName}' tidak ditemukan. Melewati...`);
        continue;
      }
      
      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      const signer = new ethers.Wallet(privateKey, provider);
      const MyTokenFactory = await ethers.getContractFactory("MyToken", signer);

      console.log(`📡 Mendeploy ${randomName}...`);
      const token = await MyTokenFactory.deploy(randomName, randomSymbol, randomSupply);
      
      await token.waitForDeployment();
      
      const address = await token.getAddress();
      console.log(`✅ Kontrak '${randomName}' berhasil di-deploy di ${networkName.toUpperCase()} ke alamat: ${address}`);

    } catch (error) {
      console.error(`❌ Gagal deploy ke jaringan ${networkName.toUpperCase()}:`);
      console.error(error);
    }
  }
}

main().catch((error) => {
  console.error("❌ Terjadi error fatal selama proses deployment massal:");
  console.error(error);
  process.exit(1);
});
