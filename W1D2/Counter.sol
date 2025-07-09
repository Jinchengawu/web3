// SPDX-License-Identifier: MIT
pragma solidity >=0.8.8;

contract counter {
    uint256 public counter = 0; // 3 bytes, big endian order

    function add( uint256 num) public{
        counter += num;
    }

    function getCounter()public view returns(uint256){
        return counter;
    }
}