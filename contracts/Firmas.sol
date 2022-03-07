// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  // getRoundData and latestRoundData should both raise "No data present"
  // if they do not have data to report, instead of returning unset values
  // which could be misinterpreted as actual reported values.
  function getRoundData(uint80 _roundId)
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}

contract PriceConsumerV3 {

    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
     */
    constructor() {
        priceFeed = AggregatorV3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view virtual returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}

contract Firmas is PriceConsumerV3 {
    address[] public owners;
    mapping(address => bool) public is_owner;
    uint public confirmations_num;
    
    mapping(uint => mapping(address => bool)) public is_confirmed;
    
    struct Transaction {
        address to;   
        uint value;
        int price_down;
        int price_up;
        bytes data;
        bool executed;
        uint confirmations;
    }
    
    Transaction[] public transactions;
    
    event Deposit(address from, uint value);
    
    event SubmitTransaction(address indexed sender, address indexed to, uint value, int price_down, int price_up, bytes data, uint indexed tx_index);
    event ConfirmTransaction(address indexed sender, uint indexed tx_index);
    event CancelConfirmation(address indexed sender, uint indexed tx_index);
    event ExecuteTransaction(address indexed sender, uint indexed tx_index);
    
    constructor(address[] memory _owners, uint _confirmations_num) {
        require(_owners.length > 1, "Multiple owners are required for multisig");
        require(_confirmations_num > 1 && _owners.length >= _confirmations_num);
        
        for( uint i = 0 ; i < _owners.length; i++) {
            address owner = _owners[i];
            require(!is_owner[owner], "The owner is not unique");
            require(owner != address(0), "0x address");
            
            is_owner[owner] = true;
            owners.push(owner);
        }
        
        confirmations_num = _confirmations_num;
    }
    
    // ########################### Modifiers
    modifier onlyOwner() {
        require(is_owner[msg.sender], "Not owner");
        _;
    }
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }
    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }
    modifier isConfirmed(uint _txIndex) {
        require(!is_confirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }
    modifier rangePrice(uint _txIndex) {
        int price = getLatestPrice();
        require((transactions[_txIndex].price_down <= price) && (price <= transactions[_txIndex].price_up), "price out of range!");
        _;
    }
    
    // ########################### Basic functions
    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    function get_balance() external view returns (uint) {
        return address(this).balance;
    }
    
    // ########################### Decision making
    function submit_transaction(address _to, uint _value, int _price_down, int _price_up, bytes memory _data) public onlyOwner {
        uint tx_index = transactions.length;
        
        transactions.push(Transaction({
            to: _to,
            value: _value,
            price_down: _price_down,
            price_up: _price_up,
            data: _data,
            executed: false,
            confirmations: 0
        }));
        
        emit SubmitTransaction(msg.sender, _to, _value, _price_down, _price_up, _data, tx_index);
    }
    
    function confirm_transaction(uint _tx_index) public onlyOwner txExists(_tx_index) notExecuted(_tx_index) isConfirmed(_tx_index) {
        transactions[_tx_index].confirmations += 1;
        is_confirmed[_tx_index][msg.sender] = true;
        
        emit ConfirmTransaction(msg.sender, _tx_index);
    }
    
    function cancel_confirmation(uint _tx_index ) public onlyOwner txExists(_tx_index) notExecuted(_tx_index) {
        require(is_confirmed[_tx_index][msg.sender], "tx not confirmed");
        
        transactions[_tx_index].confirmations -= 1;
        is_confirmed[_tx_index][msg.sender] = false;
        
        emit CancelConfirmation(msg.sender, _tx_index);
    }
    
    function execute_transaction(uint _tx_index) public onlyOwner txExists(_tx_index) notExecuted(_tx_index) rangePrice(_tx_index) { // Gas cost: 70725
        Transaction storage transaction = transactions[_tx_index];

        require(
            transaction.confirmations >= confirmations_num,
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _tx_index);
    }
    // function execute_transaction(uint _tx_index) public onlyOwner txExists(_tx_index) notExecuted(_tx_index) { // Gas cost: 71489
    //     //Transaction storage transaction = transactions[_tx_index];

    //     require(
    //         transactions[_tx_index].confirmations >= confirmations_num,
    //         "cannot execute tx"
    //     );

    //     transactions[_tx_index].executed = true;
    //     address payable to = payable(transactions[_tx_index].to);

    //     (bool success, ) = to.call{value: transactions[_tx_index].value}( 
    //         transactions[_tx_index].data
    //     ); // returned: (true or false, bytes from fallback function)
    //     require(success, "tx failed");

    //     emit ExecuteTransaction(msg.sender, _tx_index);
    // }
    // function execute_transaction(uint _tx_index) public onlyOwner txExists(_tx_index) notExecuted(_tx_index) { // Gas cost: 72258
    //     Transaction memory transaction = transactions[_tx_index];

    //     require(
    //         transaction.confirmations >= confirmations_num,
    //         "cannot execute tx"
    //     );

    //     transactions[_tx_index].executed = true;

    //     (bool success, ) = transactions[_tx_index].to.call{value: transaction.value}(
    //         transaction.data
    //     );
    //     require(success, "tx failed");

    //     emit ExecuteTransaction(msg.sender, _tx_index);
    // }

    // ########################### Info functions
    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
    
    function getTransaction(uint _tx_index)
        public
        view
        returns (
            address to,
            uint value,
            int price_down,
            int price_up,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage transaction = transactions[_tx_index];

        return (
            transaction.to,
            transaction.value,
            transaction.price_down,
            transaction.price_up,
            transaction.data,
            transaction.executed,
            transaction.confirmations
        );
    }

    function getLatestPrice() public view override returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}