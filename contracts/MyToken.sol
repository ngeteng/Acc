// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    // Constructor sekarang menerima nama, simbol, dan suplai awal
    constructor(
        string memory name, 
        string memory symbol, 
        uint256 initialSupply
    ) ERC20(name, symbol) {
        // Mint 'initialSupply' token ke alamat yang mendeploy
        // Kita kalikan dengan 10**18 karena ERC20 punya 18 desimal
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
