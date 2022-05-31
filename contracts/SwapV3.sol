// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './SwapBase.sol';
import './interfaces/IUniswapRouterV3.sol';

contract SwapV3 is SwapBase {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    event SwapRequestSentV3(uint256 dstChainId, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _swap struct with all the data for swap V3
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function multichainV3Native(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoV3 calldata _swap,
        address _anyToken,
        address _integrator
    ) external payable onlyEOA {
        require(address(_getFirstBytes20(_swap.path)) == nativeWrap, 'MultichainProxy: token mismatch');
        require(msg.value >= _amountIn, 'MultichainProxy: amount insufficient');

        IWETH(nativeWrap).deposit{value: _amountIn}();

        _amountIn = _calculateFee(_integrator, address(_getFirstBytes20(_swap.path)), _amountIn);

        _multichainV3(_amountIn, _dstChainId, _swap, _anyToken);
    }

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _swap struct with all the data for swap V3
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function multichainV3(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoV3 calldata _swap,
        address _anyToken,
        address _integrator
    ) external onlyEOA {
        IERC20(address(_getFirstBytes20(_swap.path))).safeTransferFrom(msg.sender, address(this), _amountIn);

        _amountIn = _calculateFee(_integrator, address(_getFirstBytes20(_swap.path)), _amountIn);

        _multichainV3(_amountIn, _dstChainId, _swap, _anyToken);
    }

    function _multichainV3(
        uint256 _amountIn,
        uint256 _dstChainId,
        SwapInfoV3 calldata _swap,
        address _anyToken
    ) private {
        require(
            _swap.path.length > 20 && _dstChainId != uint256(block.chainid),
            'MultichainProxy: empty src swap path or same chain id'
        );
        address tokenOut = address(_getLastBytes20(_swap.path));
        require(IAnyswapV1ERC20(_anyToken).underlying() == address(tokenOut), 'incorrect anyToken address');
        uint256 amountOut;

        bool success;
        (success, amountOut) = _trySwapV3(_swap, _amountIn);
        if (!success) revert('MultichainProxy: swap failed');

        require(amountOut >= minSwapAmount[tokenOut], 'MultichainProxy: amount must be greater than min swap amount');
        require(amountOut <= maxSwapAmount[tokenOut], 'MultichainProxy: amount must be lower than max swap amount');

        multichainCall(amountOut, _dstChainId, IERC20(tokenOut), _anyToken);
        emit SwapRequestSentV3(
            _dstChainId,
            address(_getFirstBytes20(_swap.path)),
            _amountIn,
            address(_getLastBytes20(_swap.path)),
            amountOut
        );
    }

    function _trySwapV3(SwapInfoV3 memory _swap, uint256 _amount) internal returns (bool ok, uint256 amountOut) {
        uint256 zero;
        require(supportedDEXes.contains(_swap.dex), 'MultichainProxy: incorrect dex');

        smartApprove(IERC20(address(_getFirstBytes20(_swap.path))), _amount, _swap.dex);

        IUniswapRouterV3.ExactInputParams memory paramsV3 = IUniswapRouterV3.ExactInputParams(
            _swap.path,
            address(this),
            _swap.deadline,
            _amount,
            _swap.amountOutMinimum
        );

        try IUniswapRouterV3(_swap.dex).exactInput(paramsV3) returns (uint256 _amountOut) {
            return (true, _amountOut);
        } catch {
            return (false, zero);
        }
    }
}
