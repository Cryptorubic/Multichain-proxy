// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

import './libraries/FullMath.sol';

interface AnyswapV4Router {
     // Swaps `amount` `token` from this chain to `toChainID` chain with recipient `to` by minting with `underlying`
    function anySwapOutUnderlying(address token, address to, uint256 amount, uint256 toChainID) external;
}

contract MultichainProxy is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');

    uint256 public RubicFee;

    address public AnyRouter;

    mapping(address => uint256) public availableRubicFee;

    mapping(address => mapping(address => uint256)) public amountOfIntegrator;
    mapping(address => uint256) public integratorFee;
    mapping(address => uint256) public platformShare;

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 'MultichainProxy: Caller is not in admin role');
        _;
    }

    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            'MultichainProxy: Caller is not in manager role'
        );
        _;
    }

    constructor(address _anyRouter) {
        RubicFee = 100;
        AnyRouter = _anyRouter;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function MultichainProxyCall(
        IERC20 _token,
        uint256 _amountInTotal,
        address _integrator,
        uint256 _chainId
    ) external {
        _token.safeTransferFrom(msg.sender, address(this), _amountInTotal);

        uint256 _amountIn = _calculateFee(_integrator, _amountInTotal, address(_token));

        uint256 _allowance = _token.allowance(address(this), AnyRouter);
        if (_allowance < _amountIn) {
            if (_allowance == 0) {
                _token.safeApprove(gateway, type(uint256).max);
            } else {
                try _token.approve(gateway, type(uint256).max) returns (bool res) {
                    require(res == true, 'MultichainProxy: approve failed');
                } catch {
                    _token.safeApprove(gateway, 0);
                    _token.safeApprove(gateway, type(uint256).max);
                }
            }
        }

        uint256 balanceBefore = _token.balanceOf(address(this));

        AnyswapV4Router(AnyRouter).anySwapOutUnderlying(address(_anyToken), msg.sender, _amountIn, _chainId));

        require(
            (balanceBefore - _token.balanceOf(address(this))) == _amountIn,
            'MultichainProxy: different amount spent'
        );
    }

    function setRubicFee(uint256 _fee) external onlyManager {
        require(_fee <= 1e6, 'MultichainProxy: fee too high');
        RubicFee = _fee;
    }

    function setIntegratorFee(
        address _provider,
        uint256 _fee,
        uint256 _platformShare
    ) external onlyManager {
        require(_fee <= 1e6, 'MultichainProxy: fee too high');

        integratorFee[_provider] = _fee;
        platformShare[_provider] = _platformShare;
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
    }

    function collectIntegratorFee(address _token) external nonReentrant {
        uint256 amount = amountOfIntegrator[_token][msg.sender];
        require(amount > 0, 'MultichainProxy: amount is zero');

        amountOfIntegrator[_token][msg.sender] = 0;

        if (_token == address(0)) {
            Address.sendValue(payable(msg.sender), amount);
        } else {
            IERC20(_token).transfer(msg.sender, amount);
        }
    }

    function collectIntegratorFee(address _token, address _provider) external onlyManager {
        uint256 amount = amountOfIntegrator[_token][_provider];
        require(amount > 0, 'MultichainProxy: amount is zero');

        amountOfIntegrator[_token][_provider] = 0;

        if (_token == address(0)) {
            Address.sendValue(payable(_provider), amount);
        } else {
            IERC20(_token).transfer(_provider, amount);
        }
    }

    function collectRubicFee(address _token) external onlyManager {
        uint256 amount = availableRubicFee[_token];
        require(amount > 0, 'MultichainProxy: amount is zero');

        availableRubicFee[_token] = 0;

        if (_token == address(0)) {
            Address.sendValue(payable(msg.sender), amount);
        } else {
            IERC20(_token).transfer(msg.sender, amount);
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
}
