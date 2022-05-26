// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

interface IAnyswapV4Router {
    // Swaps `amount` `token` from this chain to `toChainID` chain with recipient `to` by minting with `underlying`
    function anySwapOutUnderlying(
        address token,
        address to,
        uint256 amount,
        uint256 toChainID
    ) external;
}
