// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IAnyswapV1ERC20 {
    function mint(address to, uint256 amount) external returns (bool);
    function burn(address from, uint256 amount) external returns (bool);
    function changeVault(address newVault) external returns (bool);
    function depositVault(uint amount, address to) external returns (uint);
    function withdrawVault(address from, uint amount, address to) external returns (uint);
    function underlying() external view returns (address);
}