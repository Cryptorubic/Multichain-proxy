// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './SwapBase.sol';

contract Bridge is SwapBase {
    using SafeERC20 for IERC20;

    event BridgeRequestSent(uint256 dstChainId, uint256 amount, address transitToken);

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param bridgeToken the transit token address
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function multichainBridgeNative(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 bridgeToken,
        address _anyToken,
        address _integrator
    ) external payable onlyEOA {
        require(address(bridgeToken) == nativeWrap, 'token mismatch');
        require(msg.value >= _amountIn, 'amount insufficient');

        IWETH(nativeWrap).deposit{value: _amountIn}();

        _amountIn = _calculateFee(_integrator, address(bridgeToken), _amountIn);

        _transferToMultichain(_amountIn, _dstChainId, bridgeToken, _anyToken);
    }

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param bridgeToken the transit token address
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function multichainBridge(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 bridgeToken,
        address _anyToken,
        address _integrator
    ) external onlyEOA {
        bridgeToken.safeTransferFrom(msg.sender, address(this), _amountIn);

        _amountIn = _calculateFee(_integrator, address(bridgeToken), _amountIn);

        _transferToMultichain(_amountIn, _dstChainId, bridgeToken, _anyToken);
    }

    function _transferToMultichain(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 bridgeToken,
        address _anyToken
    ) private {
        require(_dstChainId != uint256(block.chainid), 'same chain id');

        require(_amountIn >= minSwapAmount[address(bridgeToken)], 'amount must be greater than min swap amount');
        require(_amountIn <= maxSwapAmount[address(bridgeToken)], 'amount must be lower than max swap amount');

        require(IAnyswapV1ERC20(_anyToken).underlying() == address(bridgeToken), 'incorrect anyToken address');

        multichainCall(_amountIn, _dstChainId, bridgeToken, _anyToken);
        emit BridgeRequestSent(_dstChainId, _amountIn, address(bridgeToken));
    }
}
