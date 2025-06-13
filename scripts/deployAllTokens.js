const { ethers, config } = require("hardhat");
require("dotenv").config();
const { sendMessage } = require('./telegramReporter.js'); // Impor reporter kita

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
      // Dapatkan konfigurasi jaringan dari hardhat.config.js
      const networkConfig = config.networks[networkName];
      if (!networkConfig) {
        console.warn(`⚠️ Konfigurasi untuk jaringan '${networkName}' tidak ditemukan. Melewati...`);
        continue; 
      }
      
      // Buat koneksi ke jaringan
      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      const signer = new ethers.Wallet(privateKey, provider);
      
      // Dapatkan "pabrik" untuk kontrak kita
      const MyTokenFactory = await ethers.getContractFactory("MyToken", signer);

      // Deploy kontrak dengan parameter acak
      console.log(`📡 Mendeploy ${randomName}...`);
      const token = await MyTokenFactory.deploy(randomName, randomSymbol, randomSupply);
      
      // Tunggu sampai deployment selesai
      await token.waitForDeployment();
      const address = await token.getAddress();

      // Buat pesan sukses dan kirim ke Telegram
      const successMessage = `✅ Deployment *SUKSES* di _${networkName.toUpperCase()}_\n\n*Token*: ${randomName} (${randomSymbol})\n*Suplai Awal*: ${randomSupply.toLocaleString()}\n\n*Alamat*: \`${address}\``;
      
      console.log(`✅ Kontrak '${randomName}' berhasil di-deploy.`);
      await sendMessage(successMessage);

    } catch (error) {
      // Jika terjadi error, buat pesan gagal dan kirim ke Telegram
      const failureMessage = `❌ Deployment *GAGAL* di _${networkName.toUpperCase()}_\n\n*Percobaan untuk*: ${randomName}\n\n*Error*: \`${error.message.substring(0, 250)}...\``;

      console.error(`❌ Gagal deploy ke jaringan ${networkName.toUpperCase()}:`);
      await sendMessage(failureMessage);
    }
  }
}

main().catch((error) => {
  console.error("❌ Terjadi error fatal selama proses deployment massal:");
  console.error(error);
  process.exit(1);
});
