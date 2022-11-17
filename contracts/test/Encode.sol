// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Encode {
    bytes4 private constant FUNC_SELECTOR =
        bytes4(keccak256('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)'));
    bytes4 private constant FUNC_SELECTOR_NATIVE =
        bytes4(keccak256('swapExactETHForTokens(uint256,address[],address,uint256)'));
    bytes4 private constant FUNC_SELECTOR_FOR_NATIVE =
        bytes4(keccak256('swapExactTokensForETH(uint256,uint256,address[],address,uint256)'));
    bytes4 private constant FUNC_SELECTOR_FOR_DEX_MOCK = bytes4(keccak256('swapTokens(address,uint256,address)'));
    bytes4 private constant FUNC_SELECTOR_FOR_DEX_MOCK_NATIVE = bytes4(keccak256('swapEth(address)'));

    function encodeDEXMock(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external pure returns (bytes memory) {
        bytes memory data = abi.encodeWithSelector(FUNC_SELECTOR_FOR_DEX_MOCK, tokenIn, amountIn, tokenOut);
        return data;
    }

    function encodeDEXMockNative(address tokenOut) external pure returns (bytes memory) {
        bytes memory data = abi.encodeWithSelector(FUNC_SELECTOR_FOR_DEX_MOCK_NATIVE, tokenOut);
        return data;
    }

    function encode(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external pure returns (bytes memory) {
        bytes memory data = abi.encodeWithSelector(FUNC_SELECTOR, amountIn, amountOutMin, path, to, type(uint256).max);
        return data;
    }

    function encodeNative(
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external pure returns (bytes memory) {
        bytes memory data = abi.encodeWithSelector(FUNC_SELECTOR_NATIVE, amountOutMin, path, to, type(uint256).max);
        return data;
    }

    function encodeTokenForNative(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external pure returns (bytes memory) {
        bytes memory data = abi.encodeWithSelector(
            FUNC_SELECTOR_FOR_NATIVE,
            amountIn,
            amountOutMin,
            path,
            to,
            type(uint256).max
        );
        return data;
    }
}
