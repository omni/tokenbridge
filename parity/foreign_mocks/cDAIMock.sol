pragma solidity 0.4.24;

interface IERC20 {
  function transferFrom(address from,address to,uint256 value) external;
  function transfer(address to,uint256 value) external;
}

contract cDaiMock {
  IERC20 daiToken;

  event Transfer(address indexed from, address indexed to, uint amount);
  event Mint(address minter, uint mintAmount, uint mintTokens);
  event Redeem(address redeemer, uint redeemAmount, uint redeemTokens);


  function mint(uint256 mintAmount) external returns (uint256) {
    daiToken.transferFrom(msg.sender, address(this), mintAmount);

    emit Mint(msg.sender, mintAmount, mintAmount);
    emit Transfer(address(this), msg.sender, mintAmount);

    return 0;
  }

  function redeemUnderlying(uint256 redeemAmount) external returns (uint256) {
    daiToken.transfer(msg.sender, redeemAmount);

    emit Transfer(msg.sender, address(this), redeemAmount);
    emit Redeem(msg.sender, redeemAmount, redeemAmount);

    return 0;
  }
}
