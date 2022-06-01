// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import './interfaces/IWETH.sol';
import './interfaces/IAnyswapV4Router.sol';
import './interfaces/IAnyswapV1ERC20.sol';
import './libraries/FullMath.sol';

contract SwapBase is AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal supportedDEXes;
    EnumerableSet.AddressSet internal supportedAnyRouters;

    // Collected fee amount for Rubic and integrators
    // token -> amount of collected fees
    mapping(address => uint256) public collectedFee;
    // integrator -> token -> amount of collected fees
    mapping(address => mapping(address => uint256)) public integratorCollectedFee;

    // integrator -> percent for integrators
    mapping(address => uint256) public integratorFee;
    // integrator -> percent for Rubic
    mapping(address => uint256) public platformShare;

    // minimal amount of bridged token
    mapping(address => uint256) public minSwapAmount;
    // maximum amount of bridged token
    mapping(address => uint256) public maxSwapAmount;

    // platform Rubic fee
    uint256 public RubicFee;

    // erc20 wrap of gas token of this chain, eg. WETH
    address public nativeWrap;

    // Role of the manager
    bytes32 public constant MANAGER = keccak256('MANAGER');

    // @dev This modifier prevents using manager functions
    modifier onlyManager() {
        require(
            hasRole(MANAGER, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            'MultichainProxy: Caller is not in manager'
        );
        _;
    }

    modifier onlyEOA() {
        require(msg.sender == tx.origin, 'Not EOA');
        _;
    }

    // ============== struct for V2 like dexes ==============

    struct SwapInfoV2 {
        address dex; // the DEX to use for the swap
        address[] path;
        uint256 deadline; // deadline for the swap
        uint256 amountOutMinimum; // minimum receive amount for the swap
    }

    // ============== struct for V3 like dexes ==============

    struct SwapInfoV3 {
        address dex; // the DEX to use for the swap
        bytes path;
        uint256 deadline;
        uint256 amountOutMinimum;
    }

    // ============== struct for inch swap ==============

    struct SwapInfoInch {
        address dex;
        // path is tokenIn, tokenOut
        address[] path;
        bytes data;
        uint256 amountOutMinimum;
    }

    enum AnyInterface {
        anySwapOutUnderlying,
        anySwapOutNative,
        anySwapOut
    }

    // returns address of first token for V3
    function _getFirstBytes20(bytes memory input) internal pure returns (bytes20 result) {
        assembly {
            result := mload(add(input, 32))
        }
    }

    // returns address of tokenOut for V3
    function _getLastBytes20(bytes memory input) internal pure returns (bytes20 result) {
        uint256 offset = input.length + 12;
        assembly {
            result := mload(add(input, offset))
        }
    }

    function _calculateFee(
        address _integrator,
        address _token,
        uint256 _amountWithFee
    ) internal returns (uint256 amountWithoutFee) {
        uint256 _integratorPercent = integratorFee[_integrator];

        // integrator fee is supposed not to be zero
        if (_integratorPercent > 0) {
            uint256 _platformPercent = platformShare[_integrator];

            uint256 _integratorAndPlatformFee = FullMath.mulDiv(_amountWithFee, _integratorPercent, 1e6);

            uint256 _platformFee = FullMath.mulDiv(_integratorAndPlatformFee, _platformPercent, 1e6);

            integratorCollectedFee[_integrator][_token] += _integratorAndPlatformFee - _platformFee;
            collectedFee[_token] += _platformFee;

            amountWithoutFee = _amountWithFee - _integratorAndPlatformFee;
        } else {
            amountWithoutFee = FullMath.mulDiv(_amountWithFee, 1e6 - RubicFee, 1e6);

            collectedFee[_token] += _amountWithFee - amountWithoutFee;
        }
    }

    function smartApprove(
        IERC20 _token,
        uint256 _amount,
        address _to
    ) internal {
        uint256 _allowance = _token.allowance(address(this), _to);
        if (_allowance < _amount) {
            if (_allowance == 0) {
                _token.safeApprove(_to, type(uint256).max);
            } else {
                try _token.approve(_to, type(uint256).max) returns (bool res) {
                    require(res == true, 'MultichainProxy: approve failed');
                } catch {
                    _token.safeApprove(_to, 0);
                    _token.safeApprove(_to, type(uint256).max);
                }
            }
        }
    }

    function multichainCall(
        uint256 _amountIn,
        uint256 _dstChainId,
        IERC20 _tokenOut,
        address _anyToken,
        address _anyRouter,
        AnyInterface _funcName
    ) internal {
        require(supportedAnyRouters.contains(_anyRouter), 'MultichainProxy: incorrect anyRouter');
        if (AnyInterface.anySwapOutUnderlying == _funcName) {
            smartApprove(_tokenOut, _amountIn, _anyRouter);
            IAnyswapV4Router(_anyRouter).anySwapOutUnderlying(_anyToken, msg.sender, _amountIn, _dstChainId);
        }
        if (AnyInterface.anySwapOutNative == _funcName) {
            IWETH(nativeWrap).withdraw(_amountIn);
            IAnyswapV4Router(_anyRouter).anySwapOutNative{value: _amountIn}(_anyToken, msg.sender, _dstChainId);
        } else {
            smartApprove(_tokenOut, _amountIn, _anyRouter);
            IAnyswapV4Router(_anyRouter).anySwapOut(address(_tokenOut), msg.sender, _amountIn, _dstChainId);
        }
    }

    // This is needed to receive ETH when calling `IWETH.withdraw`
    receive() external payable {}
}
