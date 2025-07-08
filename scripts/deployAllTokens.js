const { ethers, config } = require("hardhat");
require("dotenv").config();
const { sendMessage } = require('./telegramReporter.js'); // Impor reporter kita

// =============================================================
// PUSAT KONTROL: TENTUKAN SEMUA JARINGAN TARGET DI SINI
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
      
      console.log(`✅ Kontrak '${randomName}' berhasil di-deploy.`);

      // --- LOGIKA AUTO-TRANSAKSI ---
      const recipient = process.env.RECIPIENT_ADDRESS;
      if (recipient) {
          console.log(`💸 Melakukan auto-transaksi ke alamat: ${shortenAddress(recipient)}...`);
          const amountToSend = generateRandomNumber(10, 1000).toString();
          const amountInSmallestUnit = ethers.parseUnits(amountToSend, 18);

          const tx = await token.transfer(recipient, amountInSmallestUnit);
          await tx.wait();
          
          console.log(`✔  Berhasil mengirim ${amountToSend} ${randomSymbol} ke ${shortenAddress(recipient)}`);
          
          const successMessage = `✅ Deployment & TX *SUKSES* di _${networkName.toUpperCase()}_\n\n*Token*: ${randomName} (${randomSymbol})\n*Alamat*: \`${shortenAddress(address)}\`\n\n*Auto-TX*: Mengirim *${amountToSend} ${randomSymbol}* ke \`${shortenAddress(recipient)}\``;
          await sendMessage(successMessage);

      } else {
          // Jika tidak ada RECIPIENT_ADDRESS, kirim laporan biasa
          const successMessage = `✅ Deployment *SUKSES* di _${networkName.toUpperCase()}_\n\n*Token*: ${randomName} (${randomSymbol})\n*Alamat*: \`${shortenAddress(address)}\``;
          await sendMessage(successMessage);
      }

    } catch (error) {
      const failureMessage = `❌ Deployment *GAGAL* di _${networkName.toUpperCase()}_\n\n*Percobaan untuk*: ${randomName}\n\n*Error*: \`${error.message.substring(0, 250)}...\``;
      console.error(`❌ Gagal deploy/transaksi di jaringan ${networkName.toUpperCase()}:`, error);
      await sendMessage(failureMessage);
    }
  }
}

main().catch((error) => {
  console.error("❌ Terjadi error fatal selama proses deployment massal:");
  console.error(error);
  process.exit(1);
});
