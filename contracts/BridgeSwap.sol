// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './SwapBase.sol';
import './interfaces/IAnyswapV1ERC20.sol';

contract BridgeSwap is SwapBase {
    using SafeERC20 for IERC20;

    event BridgeRequestSent(uint256 dstChainId, uint256 amount, address srcToken);

    /**
     * @param _amountIn the input amount that the user wants to bridge
     * @param _dstChainId destination chain ID
     * @param _srcBridgeToken the transit token address
     * @param _anyToken the pegged token address
     * @param _integrator the integrator address
     */
    function bridgeWithSwap(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 _srcBridgeToken,
        address _anyToken,
        address _integrator
    ) external onlyEOA {
        _srcBridgeToken.safeTransferFrom(msg.sender, address(this), _amountIn);

        _amountIn = _calculateFee(_integrator, address(_srcBridgeToken), _amountIn);

        _crossChainBridgeWithSwap(_amountIn, _dstChainId, _srcBridgeToken, _anyToken);
    }

    //    function bridgeWithSwapNative(
    //        uint256 _amountIn,
    //        uint64 _dstChainId,
    //        address _srcBridgeToken,
    //        SwapInfoDest calldata _dstSwap,
    //        uint32 _maxBridgeSlippage
    //    ) external payable onlyEOA {
    //        require(_srcBridgeToken == nativeWrap, 'token mismatch');
    //        require(msg.value >= _amountIn, 'Amount insufficient');
    //        IWETH(nativeWrap).deposit{value: _amountIn}();
    //
    //        uint256 _fee = _calculateCryptoFee(msg.value - _amountIn, _dstChainId);
    //
    //        _crossChainBridgeWithSwap(
    //            _receiver,
    //            _amountIn,
    //            _dstChainId,
    //            _srcBridgeToken,
    //            _dstSwap,
    //            _maxBridgeSlippage,
    //            _fee
    //        );
    //    }

    function _crossChainBridgeWithSwap(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 _srcBridgeToken,
        address _anyToken
    ) private {
        uint256 _chainId = uint64(block.chainid);
        require(_dstChainId != _chainId, 'same chain id');

        require(_amountIn >= minSwapAmount[address(_srcBridgeToken)], 'amount must be greater than min swap amount');
        require(_amountIn <= maxSwapAmount[address(_srcBridgeToken)], 'amount must be lower than max swap amount');

        require(IAnyswapV1ERC20(_anyToken).underlying() == address(_srcBridgeToken), 'Incorrect anyToken address');

        multichainCall(_amountIn, _dstChainId, _srcBridgeToken, _anyToken);
        emit BridgeRequestSent(_dstChainId, _amountIn, address(_srcBridgeToken));
    }
}
