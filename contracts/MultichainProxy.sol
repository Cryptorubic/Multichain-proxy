// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './interfaces/IAnyswapV4Router.sol';
import './libraries/FullMath.sol';
import "./SwapBase.sol";

contract MultichainProxy is ReentrancyGuard, AccessControl, SwapBase {
    using SafeERC20 for IERC20;

    constructor(address _anyRouter) {
        RubicFee = 100;
        AnyRouter = _anyRouter;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function multichainCall(
        IERC20 _token,
        uint256 _amountInTotal,
        address _integrator,
        uint256 _dstChainId
    ) public {
        _token.safeTransferFrom(msg.sender, address(this), _amountInTotal);

        uint256 _amountIn = _calculateFee(_integrator, _amountInTotal, address(_token));

        uint256 _allowance = _token.allowance(address(this), AnyRouter);
        if (_allowance < _amountIn) {
            if (_allowance == 0) {
                _token.safeApprove(AnyRouter, type(uint256).max);
            } else {
                try _token.approve(AnyRouter, type(uint256).max) returns (bool res) {
                    require(res == true, 'MultichainProxy: approve failed');
                } catch {
                    _token.safeApprove(AnyRouter, 0);
                    _token.safeApprove(AnyRouter, type(uint256).max);
                }
            }
        }

        uint256 balanceBefore = _token.balanceOf(address(this));

        IAnyswapV4Router(AnyRouter).anySwapOutUnderlying(address(_anyToken), msg.sender, _amountIn, _dstChainId);

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

    function collectIntegratorFee(address _token) external nonReentrant {
        uint256 amount = integratorCollectedFee[_token][msg.sender];
        require(amount > 0, 'MultichainProxy: amount is zero');

        integratorCollectedFee[_token][msg.sender] = 0;

        if (_token == address(0)) {
            Address.sendValue(payable(msg.sender), amount);
        } else {
            IERC20(_token).transfer(msg.sender, amount);
        }
    }

    function collectIntegratorFee(address _token, address _provider) external onlyManager {
        uint256 amount = integratorCollectedFee[_token][_provider];
        require(amount > 0, 'MultichainProxy: amount is zero');

        integratorCollectedFee[_token][_provider] = 0;

        if (_token == address(0)) {
            Address.sendValue(payable(_provider), amount);
        } else {
            IERC20(_token).transfer(_provider, amount);
        }
    }

    function collectRubicFee(address _token) external onlyManager {
        uint256 amount = collectedFee[_token];
        require(amount > 0, 'MultichainProxy: amount is zero');

        collectedFee[_token] = 0;

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
