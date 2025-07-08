const { ethers, config } = require("hardhat");
require("dotenv").config();
const { sendMessage } = require('./telegramReporter.js');

// =============================================================
// PUSAT KONTROL
// =============================================================
const targetNetworks = ["Pharos", "Somnia", "OG"]; 

// =============================================================
// FUNGSI HELPER (Tidak ada perubahan di sini)
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
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  const thirdPartyPrivateKey = process.env.THIRD_PARTY_PRIVATE_KEY;

  if (!deployerPrivateKey) {
    throw new Error("⛔ PRIVATE_KEY (deployer) tidak ditemukan di file .env");
  }
  if (!thirdPartyPrivateKey) {
    console.warn("⚠️ THIRD_PARTY_PRIVATE_KEY tidak ditemukan, simulasi approve/transferFrom akan dilewati.");
  }

  for (const networkName of targetNetworks) {
    const randomName = `Token ${generateRandomString(6)}`;
    const randomSymbol = generateRandomString(3).toUpperCase();
    const randomSupply = generateRandomNumber(500000, 2000000);

    console.log(`\n=================================================`);
    console.log(`🚀 Memulai deployment & simulasi ke jaringan: ${networkName.toUpperCase()}`);
    console.log(`   - Token: ${randomName} (${randomSymbol})`);
    console.log(`=================================================`);

    try {
      const networkConfig = config.networks[networkName];
      if (!networkConfig) {
        console.warn(`⚠️ Konfigurasi untuk jaringan '${networkName}' tidak ditemukan. Melewati...`);
        continue;
      }
      
      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      
      // Buat DUA signer: satu untuk deployer, satu untuk pihak ketiga
      const deployerSigner = new ethers.Wallet(deployerPrivateKey, provider);
      const thirdPartySigner = thirdPartyPrivateKey ? new ethers.Wallet(thirdPartyPrivateKey, provider) : null;

      const MyTokenFactory = await ethers.getContractFactory("MyToken", deployerSigner);

      // 1. DEPLOY KONTRAK
      console.log(`[1/3] 📡 Mendeploy ${randomName}...`);
      const token = await MyTokenFactory.deploy(randomName, randomSymbol, randomSupply);
      await token.waitForDeployment();
      const address = await token.getAddress();
      console.log(`✔  Kontrak ter-deploy di: ${address}`);

      // 2. LOGIKA SIMULASI APPROVE & TRANSFERFROM
      if (thirdPartySigner) {
          const amountToSimulate = generateRandomNumber(100, 1000).toString();
          const amountInSmallestUnit = ethers.parseUnits(amountToSimulate, 18);
          
          // 2a. DEPLOYER MELAKUKAN APPROVE
          console.log(`[2/3] 👍 Deployer memberi izin (approve) kepada ${shortenAddress(thirdPartySigner.address)}...`);
          const approveTx = await token.connect(deployerSigner).approve(thirdPartySigner.address, amountInSmallestUnit);
          await approveTx.wait();
          console.log(`✔  Izin berhasil diberikan.`);

          // 2b. PIHAK KETIGA MELAKUKAN TRANSFERFROM
          console.log(`[3/3] 🤝 Pihak ketiga (${shortenAddress(thirdPartySigner.address)}) memindahkan (transferFrom) token...`);
          const recipientForTransfer = process.env.RECIPIENT_ADDRESS || deployerSigner.address; // Kirim ke RECIPIENT_ADDRESS atau kembali ke deployer
          const transferFromTx = await token.connect(thirdPartySigner).transferFrom(deployerSigner.address, recipientForTransfer, amountInSmallestUnit);
          await transferFromTx.wait();
          console.log(`✔  Berhasil memindahkan ${amountToSimulate} ${randomSymbol}.`);

          // Kirim laporan sukses lengkap ke Telegram
          const successMessage = `✅ Simulasi *SUKSES* di _${networkName.toUpperCase()}_\n\n*Token*: ${randomName} (${randomSymbol})\n*Alamat*: \`${shortenAddress(address)}\`\n\n*Interaksi*: \`approve\` & \`transferFrom\` sejumlah *${amountToSimulate} ${randomSymbol}* berhasil disimulasikan!`;
          await sendMessage(successMessage);
      } else {
          // Fallback jika tidak ada pihak ketiga
          const successMessage = `✅ Deployment *SUKSES* (tanpa simulasi) di _${networkName.toUpperCase()}_\n\n*Token*: ${randomName} (${randomSymbol})\n*Alamat*: \`${shortenAddress(address)}\``;
          await sendMessage(successMessage);
      }

    } catch (error) {
        const failureMessage = `❌ Proses *GAGAL* di _${networkName.toUpperCase()}_\n\n*Percobaan untuk*: ${randomName}\n\n*Error*: \`${error.message.substring(0, 250)}...\``;
        console.error(`❌ Gagal pada proses di jaringan ${networkName.toUpperCase()}:`, error);
        await sendMessage(failureMessage);
    }
  }
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal pada skrip utama:", error);
    process.exit(1);
});
