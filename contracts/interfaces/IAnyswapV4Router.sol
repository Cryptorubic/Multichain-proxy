// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

interface IAnyswapV4Router {
    // Swaps `amount` `token` from this chain to `toChainID` chain with recipient `to` by minting with `underlying`
    // token is `anyToken` address
    function anySwapOutUnderlying(
        address token,
        address to,
        uint256 amount,
        uint256 toChainID
    ) external;

    // token is `anyToken` address
    function anySwapOutNative(
        address token,
        address to,
        uint256 toChainID
    ) external payable;

    // token is a regular address
    function anySwapOut(
        address token,
        address to,
        uint256 amount,
        uint256 toChainID
    ) external;
}
