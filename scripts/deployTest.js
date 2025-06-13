const { ethers } = require("hardhat");

async function main() {
    console.log("Memulai tes kompilasi dan deployment sederhana...");
    
    const TestContract = await ethers.getContractFactory("Test");
    
    console.log("Kompilasi berhasil. Mencoba deploy...");

    const test = await TestContract.deploy();
    await test.waitForDeployment();

    const address = await test.getAddress();
    console.log(`✅ Tes BERHASIL! Kontrak 'Test' ter-deploy ke alamat: ${address}`);
}

main().catch((error) => {
    console.error("❌ TES GAGAL:", error);
    process.exit(1);
});
