const { ethers } = require("hardhat");

async function main() {
    console.log("Mempersiapkan deployment Token ERC20...");

    const MyToken = await ethers.getContractFactory("MyToken");

    console.log("Mendeploy MyToken...");
    const token = await MyToken.deploy();
    await token.waitForDeployment();

    const address = await token.getAddress();
    console.log(`✅ Token (MyToken) berhasil di-deploy ke alamat: ${address}`);
}

main().catch((error) => {
    console.error("❌ Gagal mendeploy token:", error);
    process.exit(1);
});
