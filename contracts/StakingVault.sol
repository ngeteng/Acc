// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingVault {
    IERC20 public immutable stakingToken;
    mapping(address => uint256) public stakedBalances;

    constructor(address _stakingTokenAddress) {
        stakingToken = IERC20(_stakingTokenAddress);
    }

    function stake(uint256 _amount) public {
        require(_amount > 0, "Cannot stake 0");
        stakedBalances[msg.sender] += _amount;
        // Pindahkan token dari pengguna ke kontrak vault ini
        // Pengguna harus approve kontrak ini terlebih dahulu
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }
}
