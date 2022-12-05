// SPDX-License-Identifier: MIT

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

pragma solidity ^0.8.0;

contract AnyswapV4ERC20 is ERC20Upgradeable {
    event LogSwapout(address indexed account, uint256 amount, address bindaddr);

    constructor() {
        _mint(msg.sender, 100000000000 ether);
    }

    function Swapout(uint256 amount, address bindaddr) public returns (bool) {
        _burn(_msgSender(), amount);
        emit LogSwapout(_msgSender(), amount, bindaddr);
        return true;
    }
}
