const { ethers } = require("hardhat");

// Fungsi helper untuk data acak
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

async function main() {
    // Generate data acak
    const randomName = `Token ${generateRandomString(6)}`;
    const randomSymbol = generateRandomString(3).toUpperCase();
    const randomSupply = generateRandomNumber(500000, 2000000); // Suplai antara 500rb - 2jt

    console.log("==============================================");
    console.log("🚀 Memulai deployment token acak...");
    console.log(`   - Nama: ${randomName}`);
    console.log(`   - Simbol: ${randomSymbol}`);
    console.log(`   - Suplai Awal: ${randomSupply}`);
    console.log("==============================================");

    const MyToken = await ethers.getContractFactory("MyToken");

    console.log("Mendeploy MyToken dengan parameter acak...");
    // Masukkan variabel acak sebagai argumen saat deploy
    const token = await MyToken.deploy(randomName, randomSymbol, randomSupply);
    
    await token.waitForDeployment();

    const address = await token.getAddress();
    console.log(`✅ Token '${randomName}' berhasil di-deploy ke alamat: ${address}`);
}

main().catch((error) => {
    console.error("❌ Gagal mendeploy token:", error);
    process.exit(1);
});
