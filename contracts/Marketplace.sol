pragma solidity 0.6.1; 
import "./ProductItem.sol";

contract Marketplace {
    string public name;
    uint public productCount = 0;
    mapping(uint => Product) public products;

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
        ProductItem item;
    }

    event ProductCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased,
        address productItem
    );

    event ProductPurchased(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    constructor() public {
        name = "Marketplace";
    }

    function createProduct(string memory _name, uint _price) public {
        require(bytes(_name).length > 0);
        require(_price > 0);
        productCount ++;
        ProductItem item = new ProductItem(this, _price, productCount);
        products[productCount] = Product(productCount, _name, _price, msg.sender, false, item);
        emit ProductCreated(productCount, _name, _price, msg.sender, false, address(item));
    }

    function purchaseProduct(uint _id) public payable {
        Product memory _product = products[_id];
        address payable _seller = _product.owner;
        require(_product.id > 0 && _product.id <= productCount);
        require(msg.value >= _product.price);
        require(!_product.purchased);
        require(_seller != msg.sender);
        _product.owner = msg.sender;
        _product.purchased = true;
        products[_id] = _product;
        payable(address(_seller)).transfer(msg.value);
        emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
    }

    function purchaseProductbyToken(uint _id) public virtual {
        Product memory _product = products[_id];
        address _seller = _product.owner;
        require(_product.id > 0 && _product.id <= productCount);
        require(!_product.purchased);
        require(_seller != msg.sender);
        _product.owner = msg.sender;
        _product.purchased = true;
        products[_id] = _product;
        emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
    }
}
