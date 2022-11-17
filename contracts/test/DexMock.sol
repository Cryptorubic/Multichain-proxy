// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface ITestDEX {
    function swapTokens(
        address _fromToken,
        uint256 _inputAmount,
        address _toToken
    ) external;

    function swapEth(address _toToken) external payable;
}

contract TestDEX is ITestDEX {
    uint256 public constant price = 2;

    function swapTokens(
        address _fromToken,
        uint256 _inputAmount,
        address _toToken
    ) external override {
        IERC20(_fromToken).transferFrom(msg.sender, address(this), _inputAmount);
        IERC20(_toToken).transfer(msg.sender, _inputAmount * price);
    }

    function swapEth(address _toToken) external payable override {
        IERC20(_toToken).transfer(msg.sender, msg.value * price);
    }
}
