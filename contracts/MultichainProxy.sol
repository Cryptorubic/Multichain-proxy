// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9;

import './libraries/FullMath.sol';
import './Bridge.sol';
import './SwapV2.sol';
import './SwapInch.sol';
import './SwapV3.sol';

contract MultichainProxy is ReentrancyGuard, AccessControl, Bridge, SwapV2, SwapV3, SwapInch {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor(
        address _nativeWrap,
        address[] memory _supportedAnyRouters,
        address[] memory _supportedDEXes
    ) {
        for (uint256 i = 0; i < _supportedAnyRouters.length; i++) {
            supportedAnyRouters.add(_supportedAnyRouters[i]);
        }
        for (uint256 i = 0; i < _supportedDEXes.length; i++) {
            supportedDEXes.add(_supportedDEXes[i]);
        }
        RubicFee = 3000;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // _setupRole(MANAGER, msg.sender);
        nativeWrap = _nativeWrap;
    }

    function _sendToken(
        address _token,
        uint256 _amount,
        address _receiver,
        bool _nativeOut
    ) private {
        if (_token == nativeWrap && _nativeOut == true) {
            IWETH(nativeWrap).withdraw(_amount);
            (bool sent, ) = _receiver.call{value: _amount, gas: 50000}('');
            require(sent, 'MultichainProxy: failed to send native');
        } else {
            IERC20(_token).safeTransfer(_receiver, _amount);
        }
    }

    function setRubicFee(uint256 _feeRubic) external onlyManager {
        require(_feeRubic <= 1000000, 'MultichainProxy: incorrect fee amount');
        RubicFee = _feeRubic;
    }

    function setRubicShare(address _integrator, uint256 _percent) external onlyManager {
        require(_percent <= 1000000, 'MultichainProxy: incorrect fee amount');
        require(_integrator != address(0));
        platformShare[_integrator] = _percent;
    }

    function setIntegrator(address _integrator, uint256 _percent) external onlyManager {
        require(_percent <= 1000000, 'MultichainProxy: incorrect fee amount');
        require(_integrator != address(0));
        integratorFee[_integrator] = _percent;
    }

    function setNativeWrap(address _nativeWrap) external onlyManager {
        nativeWrap = _nativeWrap;
    }

    function addSupportedDex(address[] memory _dexes) external onlyManager {
        for (uint256 i = 0; i < _dexes.length; i++) {
            supportedDEXes.add(_dexes[i]);
        }
    }

    function removeSupportedDex(address[] memory _dexes) external onlyManager {
        for (uint256 i = 0; i < _dexes.length; i++) {
            supportedDEXes.remove(_dexes[i]);
        }
    }

    function getSupportedDEXes() public view returns (address[] memory dexes) {
        return supportedDEXes.values();
    }

    function addSupportedAnyRouters(address[] memory _routers) external onlyManager {
        for (uint256 i = 0; i < _routers.length; i++) {
            supportedAnyRouters.add(_routers[i]);
        }
    }

    function removeSupportedAnyRouters(address[] memory _routers) external onlyManager {
        for (uint256 i = 0; i < _routers.length; i++) {
            supportedAnyRouters.remove(_routers[i]);
        }
    }

    function getSupportedAnyRouters() public view returns (address[] memory anyRouters) {
        return supportedAnyRouters.values();
    }

    function integratorCollectFee(
        address _token,
        address _integrator,
        uint256 _amount,
        bool _nativeOut
    ) external nonReentrant {
        require(integratorCollectedFee[_integrator][_token] >= _amount, 'MultichainProxy: amount too big');
        _sendToken(_token, _amount, _integrator, _nativeOut);
        integratorCollectedFee[_integrator][_token] -= _amount;
    }

    function collectIntegratorFeeManual(
        address _token,
        address _integrator,
        uint256 _amount,
        bool _nativeOut
    ) external onlyManager {
        require(integratorCollectedFee[_token][_integrator] >= _amount, 'MultichainProxy: amount too big');
        _sendToken(_token, _amount, _integrator, _nativeOut);
        integratorCollectedFee[_token][_integrator] -= _amount;
    }

    function collectRubicFee(
        address _token,
        uint256 _amount,
        bool _nativeOut
    ) external onlyManager {
        require(collectedFee[_token] >= _amount, 'MultichainProxy: amount too big');
        _sendToken(_token, _amount, msg.sender, _nativeOut);
        collectedFee[_token] -= _amount;
    }

    function setMinSwapAmount(address _token, uint256 _amount) external onlyManager {
        minSwapAmount[_token] = _amount;
    }

    function setMaxSwapAmount(address _token, uint256 _amount) external onlyManager {
        maxSwapAmount[_token] = _amount;
    }

    function sweepTokens(
        address _token,
        uint256 _amount,
        bool _nativeOut
    ) external onlyManager {
        _sendToken(_token, _amount, msg.sender, _nativeOut);
    }

    function pauseRubic() external onlyManager {
        _pause();
    }

    function unPauseRubic() external onlyManager {
        _unpause();
    }
}
