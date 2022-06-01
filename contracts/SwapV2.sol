// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './SwapBase.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

contract SwapV2 is SwapBase {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    event SwapRequestSentV2(
        uint256 dstChainId,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut
    );

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _anyRouter the multichain router address
     * @param _dstChainId destination chain ID
     * @param _swap struct with all the data for swap V2
     * @param _anyToken the pegged token address
     * @param _funcName the name of the function supported by token
     * @param _integrator the integrator address
     */
    function multichainV2Native(
        uint256 _amountIn,
        address _anyRouter,
        uint256 _dstChainId,
        SwapInfoV2 calldata _swap,
        address _anyToken,
        AnyInterface _funcName,
        address _integrator
    ) external payable onlyEOA nonReentrant {
        require(_swap.path[0] == nativeWrap, 'MultichainProxy: token mismatch');
        require(msg.value >= _amountIn, 'MultichainProxy: amount insufficient');

        IWETH(nativeWrap).deposit{value: _amountIn}();

        _multichainV2(_amountIn, _dstChainId, _swap, _anyToken, _anyRouter, _funcName);
    }

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _anyRouter the multichain router address
     * @param _dstChainId destination chain ID
     * @param _swap struct with all the data for swap V2
     * @param _anyToken the pegged token address
     * @param _funcName the name of the function supported by token
     * @param _integrator the integrator address
     */
    function multichainV2(
        uint256 _amountIn,
        address _anyRouter,
        uint256 _dstChainId,
        SwapInfoV2 calldata _swap,
        address _anyToken,
        AnyInterface _funcName,
        address _integrator
    ) external onlyEOA {
        IERC20(_swap.path[0]).safeTransferFrom(msg.sender, address(this), _amountIn);

        _multichainV2(_amountIn, _dstChainId, _swap, _anyToken, _anyRouter, _funcName);
    }

    function _multichainV2(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoV2 calldata _swap,
        address _anyToken,
        address _anyRouter,
        AnyInterface _funcName
    ) private {
        require(
            _swap.path.length > 1 && _dstChainId != uint256(block.chainid),
            'MultichainProxy: empty src swap path or same chain id'
        );
        address tokenOut = _swap.path[_swap.path.length - 1];
        require(
            IAnyswapV1ERC20(_anyToken).underlying() == address(tokenOut),
            'MultichainProxy: incorrect anyToken address'
        );
        uint256 amountOut;

        amountOut = _trySwapV2(_swap, _amountIn);

        require(amountOut >= minSwapAmount[tokenOut], 'MultichainProxy: amount must be greater than min swap amount');
        require(amountOut <= maxSwapAmount[tokenOut], 'MultichainProxy: amount must be lower than max swap amount');

        amountOut = _calculateFee(_integrator, tokenOut, amountOut);

        multichainCall(amountOut, _dstChainId, IERC20(tokenOut), _anyToken, _anyRouter, _funcName);
        emit SwapRequestSentV2(_dstChainId, _swap.path[0], _amountIn, _swap.path[_swap.path.length - 1], amountOut);
    }

    function _trySwapV2(SwapInfoV2 memory _swap, uint256 _amount) internal returns (uint256 amountOut) {
        require(supportedDEXes.contains(_swap.dex), 'MultichainProxy: incorrect dex');

        smartApprove(IERC20(_swap.path[0]), _amount, _swap.dex);

        try
            IUniswapV2Router02(_swap.dex).swapExactTokensForTokens(
                _amount,
                _swap.amountOutMinimum,
                _swap.path,
                address(this),
                _swap.deadline
            )
        returns (uint256[] memory amounts) {
            return amounts[amounts.length - 1];
        } catch {
            revert('MultichainProxy: swap failed');
        }
    }
}
