// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MentorMe {

    
    uint internal Creatorlength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    struct Creator {
        address payable creator;
        string name;
        string description;
        uint supporters;
        uint supported;
    }
    
    // the key is the creator / Creatorlength
    // use creator.suggestions as length for mapping
    mapping(uint => mapping(address => bool)) internal isSupporting;
    mapping(uint => mapping(address => uint)) internal investAmount;
    mapping(uint => address[]) internal supporters; // key is creator supporters
    
    

    mapping (uint => Creator) internal creators;

    function addCreator(
        string memory _name,
        string memory _description,
        uint _supported,
        uint _supporters
    ) public {
        require(bytes(_name).length > 0, "Name should not be empty.");
        require(bytes(_description).length > 0, "Description should not be empty.");
        require(_supported > 0, "Supported should be greater than zero.");
        require(_supporters > 0, "Supporters should be greater than zero.");

        creators[Creatorlength] = Creator(
            payable(msg.sender),
            _name,
            _description,
            _supported,
            _supporters
        );
        Creatorlength ++;
    }

    function readCreator(uint _index) public view returns (
        address _creator,
        string memory _name,
        string memory _description,
        uint _supporters,
        uint _supported
    ) {
        return (
            creators[_index].creator,
            creators[_index].name, 
            creators[_index].description, 
            creators[_index].supporters, 
            creators[_index].supported
        );
    }
    
    function supportCreator(uint _index, uint _amount) public {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            creators[_index].creator,
            _amount
          ),
          "support did not go through."
        );
        
        if (isSupporting[_index][msg.sender] != true) {
            creators[_index].supporters ++;
            supporters[_index].push(msg.sender);
        }
        
        creators[_index].supported += _amount;
        isSupporting[_index][msg.sender] = true;
        investAmount[_index][msg.sender] += _amount;
        
    }
    
    function getSupporters(uint _index) public view returns(address[] memory _supporters) {
        return supporters[_index];
    }
    
    function amountSupported(uint _index, address _addr) public view returns(uint _amount) {
        return investAmount[_index][_addr];
    }
    
    function totalProjects() public view returns (uint) {
        return (Creatorlength);
    }
    
    
}
