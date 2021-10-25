pragma solidity 0.6.1; 
import "./Marketplace.sol";
contract ProductItem {
    uint public priceInWei;
    uint public index;
    
    Marketplace parentContract;
    
    constructor(Marketplace _parentContract, uint _priceInWei, uint _index) public {
        priceInWei = _priceInWei;
        index = _index;
        parentContract = _parentContract;
    }
    
}