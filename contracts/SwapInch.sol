// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './SwapBase.sol';

contract TransferSwapInch is SwapBase {
    using Address for address payable;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    event SwapRequestSentInch(uint256 dstChainId, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _swap struct with all the data for swap V2
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function multichainInchNative(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoInch calldata _swap,
        address _anyToken,
        address _integrator
    ) external payable onlyEOA {
        require(_swap.path[0] == nativeWrap, 'token mismatch');
        require(msg.value >= _amountIn, 'amount insufficient');

        IWETH(nativeWrap).deposit{value: _amountIn}();

        _amountIn = _calculateFee(_integrator, _swap.path[0], _amountIn);

        _multichainInch(_amountIn, _dstChainId, _swap, _anyToken);
    }

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _swap struct with all the data for swap V2
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function multichainInch(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoInch calldata _swap,
        address _anyToken,
        address _integrator
    ) external onlyEOA {
        IERC20(_swap.path[0]).safeTransferFrom(msg.sender, address(this), _amountIn);

        _amountIn = _calculateFee(_integrator, _swap.path[0], _amountIn);

        _multichainInch(_amountIn, _dstChainId, _swap, _anyToken);
    }

    function _multichainInch(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoInch calldata _swap,
        address _anyToken
    ) private {
        require(_swap.path.length > 1 && _dstChainId != uint256(block.chainid), 'empty src swap path or same chain id');
        address tokenOut = _swap.path[_swap.path.length - 1];
        require(IAnyswapV1ERC20(_anyToken).underlying() == address(tokenOut), 'incorrect anyToken address');
        uint256 amountOut;

        bool success;
        (success, amountOut) = _trySwapInch(_swap, _amountIn);
        if (!success) revert('swap failed');

        require(amountOut >= minSwapAmount[tokenOut], 'amount must be greater than min swap amount');
        require(amountOut <= maxSwapAmount[tokenOut], 'amount must be lower than max swap amount');

        multichainCall(amountOut, _dstChainId, IERC20(tokenOut), _anyToken);
        emit SwapRequestSentInch(_dstChainId, _swap.path[0], _amountIn, _swap.path[_swap.path.length - 1], amountOut);
    }

    function _trySwapInch(SwapInfoInch memory _swap, uint256 _amount) internal returns (bool ok, uint256 amountOut) {
        if (!supportedDEXes.contains(_swap.dex)) {
            return (false, 0);
        }

        smartApprove(IERC20(_swap.path[0]), _amount, _swap.dex);

        IERC20 Transit = IERC20(_swap.path[_swap.path.length - 1]);
        uint256 transitBalanceBefore = Transit.balanceOf(address(this));

        Address.functionCall(_swap.dex, _swap.data);

        uint256 balanceDif = Transit.balanceOf(address(this)) - transitBalanceBefore;

        if (balanceDif >= _swap.amountOutMinimum) {
            return (true, balanceDif);
        }

        return (false, 0);
    }
}
