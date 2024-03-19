// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.20;

contract BatchTransferManager {
    uint256 public transferAmount = 2 ether;
    receive() external payable {}

    function modifyTransferAmount(uint256 _transferAmount) public {
        transferAmount = _transferAmount;
    }

    function batchTransfer(address[] calldata toAddress) public payable {
        require(toAddress.length * transferAmount <= address(this).balance, "Contract balance is not enough");

        for (uint256 i = 0; i < toAddress.length; i++) {
            (bool sent1, ) = payable(toAddress[i]).call{value: transferAmount}("");
            require(sent1, "ETH: SE1");
        }
    }

    function withdraw(uint256 _amount) external  {
        (bool sent1, ) = payable(msg.sender).call{value: _amount}("");
        require(sent1, "ETH: SE1");
    }
}
