// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './SwapBase.sol';

contract Bridge is SwapBase {
    using SafeERC20 for IERC20;

    event BridgeRequestSent(uint256 dstChainId, uint256 amount, address transitToken);

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _anyRouter the multichain router address
     * @param _bridgeToken the transit token address
     * @param _anyToken the pegged token address
     * @param _funcName the name of the function supported by token
     * @param _integrator the integrator address
     */
    function multichainBridgeNative(
        uint256 _amountIn,
        address _anyRouter,
        uint256 _dstChainId,
        IERC20 _bridgeToken,
        address _anyToken,
        AnyInterface _funcName,
        address _integrator
    ) external payable onlyEOA {
        require(address(_bridgeToken) == nativeWrap, 'MultichainProxy: token mismatch');
        require(msg.value >= _amountIn, 'MultichainProxy: amount insufficient');

        IWETH(nativeWrap).deposit{value: _amountIn}();

        _amountIn = _calculateFee(_integrator, address(_bridgeToken), _amountIn);

        _transferToMultichain(_amountIn, _dstChainId, _bridgeToken, _anyToken, _anyRouter, _funcName);
    }

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _anyRouter the multichain router address
     * @param _bridgeToken the transit token address
     * @param _anyToken the pegged token address
     * @param _funcName the name of the function supported by token
     * @param _integrator the integrator address
     */
    function multichainBridge(
        uint256 _amountIn,
        address _anyRouter,
        uint256 _dstChainId,
        IERC20 _bridgeToken,
        address _anyToken,
        AnyInterface _funcName,
        address _integrator
    ) external onlyEOA {
        _bridgeToken.safeTransferFrom(msg.sender, address(this), _amountIn);

        _amountIn = _calculateFee(_integrator, address(_bridgeToken), _amountIn);

        _transferToMultichain(_amountIn, _dstChainId, _bridgeToken, _anyToken, _anyRouter, _funcName);
    }

    function _transferToMultichain(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 bridgeToken,
        address _anyToken,
        address _anyRouter,
        AnyInterface _funcName
    ) private {
        require(_dstChainId != uint256(block.chainid), 'MultichainProxy: same chain id');

        require(
            _amountIn >= minSwapAmount[address(bridgeToken)],
            'MultichainProxy: amount must be greater than min swap amount'
        );
        require(
            _amountIn <= maxSwapAmount[address(bridgeToken)],
            'MultichainProxy: amount must be lower than max swap amount'
        );

        require(
            IAnyswapV1ERC20(_anyToken).underlying() == address(bridgeToken),
            'MultichainProxy: incorrect anyToken address'
        );

        multichainCall(_amountIn, _dstChainId, bridgeToken, _anyToken, _anyRouter, _funcName);
        emit BridgeRequestSent(_dstChainId, _amountIn, address(bridgeToken));
    }
}
