// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/token/ERC721/ERC721.sol";

struct MarketItem {
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
}

interface IMarketplace {
    // Fetches details of an NFT from the marketplace
    function getNFTStatusPrice(uint256 tokenId)
        external
        view
        returns (string memory status, uint256 currentPrice);
}

contract LoanVault {
    IMarketplace marketplace;

    // State variables, mappings
    address private immutable owner;
    uint64 public loanId;
    uint32 public immutable feePercent;

    mapping(uint256 => Loan) public pendingLoans;
    mapping(uint256 => Loan) public activeLoans;

    struct Loan {
        IERC721[] nfts; // Array of NFT contracts
        uint224[] nftIds; // Array of NFT IDs
        bool paidOff;
        bool loanActive;
        address borrower;
        uint96 requestedAmount;
        address lender;
        uint96 toPay;
        uint64 timeStart;
        uint64 timeEnd;
        uint96 id;
        uint96 priceAtProposal;
    }

    // Events for emitting when certain things happen
    event PostedLoan(address proposer, uint256 id);
    event CeaseLoan(address retractor, uint256 id);
    event AcceptedLoan(
        address borrower,
        address lender,
        uint256 amnt,
        uint256 id
    );
    event LoanPaid(address borrower, uint256 id);
    event LoanDefaulted(address borrower, address lender, uint256 id);

    modifier onlyOwner() {
        require(msg.sender == owner, "LoanVault: Caller is not the owner");
        _;
    }

    // To check if the loan corresponding to the id passed in is a valid active loan
    modifier validActiveLoan(uint96 _id) {
        require(
            activeLoans[_id].id == _id,
            "LoanVault: Invalid or inactive loan"
        );
        _;
    }

    constructor(address marketplaceAddress, address _contractOwner, uint32 _feePercent) {
        marketplace = IMarketplace(marketplaceAddress);
        owner = _contractOwner;
        feePercent = _feePercent;
    }

    // Retrieves the current market price of a specific NFT using its token ID.
    function getNFTPrice(uint256 tokenId) public view returns (uint256) {
        (string memory status, uint256 price) = marketplace.getNFTStatusPrice(
            tokenId
        );
        require(
            keccak256(abi.encodePacked(status)) !=
                keccak256(abi.encodePacked("Rent")) &&
                keccak256(abi.encodePacked(status)) !=
                keccak256(abi.encodePacked("None")),
            "NFT is not eligible for collateral"
        );
        require(price > 0, "NFT price is zero");
        return price;
    }

    // Returns the fee percentage set for the contract.
    function _fee() public view returns (uint256) {
        return feePercent;
    }

    // Returns the address of the contract's owner.
    function _owner() public view returns (address) {
        return owner;
    }

    // Provides access to the details of a pending loan by its index.
    function accessPending(uint256 _index) public view returns (Loan memory) {
        return pendingLoans[_index];
    }

    // Provides access to the details of an active loan by its index.
    function accessActive(uint256 _index) public view returns (Loan memory) {
        return activeLoans[_index];
    }

    // Allows the owner to withdraw all Ether stored in the contract.
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Internal function used to transfer the NFT to the lender upon loan default.
    function liquidateLoan(uint96 _id) internal {
        Loan memory liqLoan = activeLoans[_id];
        for (uint256 i = 0; i < liqLoan.nfts.length; i++) {
            liqLoan.nfts[i].transferFrom(
                address(this),
                liqLoan.lender,
                liqLoan.nftIds[i]
            );
        }
        emit LoanDefaulted(liqLoan.borrower, liqLoan.lender, _id);
    }

    /**************************  BORROWER FUNCTIONS  **************************/

    function propose(
        IERC721[] calldata _nfts,
        uint224[] calldata _nftIds,
        uint96 _reqAmnt,
        uint96 _toPay,
        uint64 _duration
    ) external {
        require(_nfts.length == _nftIds.length, "Mismatched NFTs and IDs");
        require(
            _toPay > _reqAmnt,
            "ToPay must be greater than requested amount"
        );

        uint96 totalNFTPrice = 0;
        for (uint256 i = 0; i < _nftIds.length; i++) {
            require(
                _nfts[i].getApproved(_nftIds[i]) == address(this),
                "Transfer not approved"
            );
            uint96 nftPrice = uint96(getNFTPrice(_nftIds[i]));
            totalNFTPrice += nftPrice;
            _nfts[i].transferFrom(msg.sender, address(this), _nftIds[i]);
        }

        require(_reqAmnt <= totalNFTPrice / 2, "Requested amount too high");
        createLoan(_nfts, _nftIds, _reqAmnt, _toPay, _duration, totalNFTPrice);
    }

    // Borrower Functions

    // Borrower should be able to retract a proposed loan before it's accepted
    function retract(uint96 _id) external {
        require(activeLoans[_id].id != _id, "Loan is already active!");
        require(
            pendingLoans[_id].borrower == msg.sender,
            "Can only retract your loans!"
        );

        for (uint256 i = 0; i < pendingLoans[_id].nfts.length; i++) {
            pendingLoans[_id].nfts[i].transferFrom(
                address(this),
                pendingLoans[_id].borrower,
                pendingLoans[_id].nftIds[i]
            );
        }
        delete pendingLoans[_id];
        emit CeaseLoan(msg.sender, _id);
    }

    // Borrower should be able to pay off loan
    function payInFull(uint96 _id) external payable validActiveLoan(_id) {
        require(
            activeLoans[_id].borrower == msg.sender,
            "Can only pay off your own loans!"
        );
        require(msg.value >= activeLoans[_id].toPay, "Must pay loan in full!");

        uint256 profit = activeLoans[_id].toPay -
            activeLoans[_id].requestedAmount;
        uint256 poolFee = (profit * feePercent) / 100;

        payable(activeLoans[_id].lender).transfer(
            activeLoans[_id].toPay - poolFee
        );

        for (uint256 i = 0; i < activeLoans[_id].nfts.length; i++) {
            activeLoans[_id].nfts[i].transferFrom(
                address(this),
                activeLoans[_id].borrower,
                activeLoans[_id].nftIds[i]
            );
        }

        delete activeLoans[_id];
        emit LoanPaid(msg.sender, _id);
    }

    // Lender Functions

    // Lender should be able to lend to a borrower
    function acceptLoan(uint96 _loanId) external payable {
        require(
            activeLoans[_loanId].id != _loanId,
            "Loan has already been accepted!"
        );
        Loan storage accepting = pendingLoans[_loanId];
        require(accepting.borrower != address(0), "Loan has been retracted!");
        require(
            msg.value >= accepting.requestedAmount,
            "You need to loan out the full amount!"
        );

        payable(accepting.borrower).transfer(accepting.requestedAmount);
        makeLoanActive(_loanId);
    }

    // Lender should be able to liquidate defaulted loans
    function liquidate(uint96 _id) external validActiveLoan(_id) {
        Loan storage loan = activeLoans[_id];
        require(
            block.timestamp > loan.timeEnd && !loan.paidOff,
            "Loan period still active or loan paid off!"
        );
        require(msg.sender == loan.lender, "Not lender");

        for (uint256 i = 0; i < loan.nfts.length; i++) {
            loan.nfts[i].transferFrom(
                address(this),
                loan.lender,
                loan.nftIds[i]
            );
        }
        loan.loanActive = false;
        emit LoanDefaulted(loan.borrower, loan.lender, _id);
    }

    // Internal functions
    function createLoan(
        IERC721[] calldata _nfts,
        uint224[] calldata _nftIds,
        uint96 _reqAmnt,
        uint96 _toPay,
        uint64 _duration,
        uint96 _totalNFTPrice
    ) internal {
        Loan memory newLoan = Loan({
            nfts: _nfts,
            nftIds: _nftIds,
            paidOff: false,
            loanActive: false,
            borrower: msg.sender,
            lender: address(0),
            requestedAmount: _reqAmnt,
            toPay: _toPay,
            timeStart: 0,
            timeEnd: _duration * 1 days,
            id: ++loanId,
            priceAtProposal: _totalNFTPrice
        });

        pendingLoans[loanId] = newLoan;
        emit PostedLoan(msg.sender, loanId);
    }

    function makeLoanActive(uint96 _loanId) internal {
        Loan storage loan = pendingLoans[_loanId];
        activeLoans[_loanId] = Loan({
            nfts: loan.nfts,
            nftIds: loan.nftIds,
            borrower: loan.borrower,
            lender: msg.sender,
            requestedAmount: loan.requestedAmount,
            toPay: loan.toPay,
            timeStart: uint64(block.timestamp),
            timeEnd: loan.timeEnd + uint64(block.timestamp),
            id: _loanId,
            paidOff: false,
            loanActive: true,
            priceAtProposal: loan.priceAtProposal
        });

        delete pendingLoans[_loanId];
        emit AcceptedLoan(
            loan.borrower,
            msg.sender,
            loan.requestedAmount,
            _loanId
        );
    }
}
