// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

interface IMarketplace {
    function hasPremiumPass(address user) external view returns (bool);
}

contract Adware {
    IMarketplace public marketplaceContract;

    struct BillboardBidder {
        address bidderAddress;
        uint256 bidAmount;
        string adDetailsURL;
    }

    struct VideoAdvertisement {
        address advertiser;
        uint256 spotsRemaining;
        string adDetailsURL;
    }

    struct FlixPass {
        address holder;
        uint256 validUntil;
    }

    BillboardBidder[3] public todayBillboard;
    BillboardBidder[3] public yesterdayBillboard;
    VideoAdvertisement[] public videoAdsQueue;

    mapping(address => uint256) public pendingWithdrawals;

    uint256 public nextAuctionEndTime;
    address public platformWallet;
    uint256 public startingBidPrice;
    uint256 public videoAdSpotPrice;
    address public contractOwner;

    uint256 constant DAY_IN_SECONDS = 86400;
    uint256 constant PLATFORM_EARNINGS_PERCENTAGE = 20;

    event BillboardBidPlaced(
        address indexed bidder,
        uint256 bidAmount,
        string adDetailsURL
    );
    event VideoAdSlotPurchased(address indexed advertiser, uint256 spots);
    event VideoAdPlayed(
        address indexed advertiser,
        uint256 spotsRemaining,
        string adDetailsURL
    );
    event AuctionResetEarly();

    event VideoAdResult(string message, address indexed contentCreator);

    modifier onlyWhileAuctionActive() {
        require(block.timestamp < nextAuctionEndTime, "Auction has ended");
        _;
    }

    modifier onlyWhenAuctionEnds() {
        require(block.timestamp >= nextAuctionEndTime, "Auction is ongoing");
        _;
    }

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Only owner can call this");
        _;
    }

    // Constructor to initialize the contract with initial values
    constructor(
        address _contractOwner,
        uint256 _startingBidPrice,
        uint256 _videoAdSpotPrice
    ) {
        platformWallet = _contractOwner;
        nextAuctionEndTime = block.timestamp + DAY_IN_SECONDS;
        contractOwner = _contractOwner;
        startingBidPrice = _startingBidPrice;
        videoAdSpotPrice = _videoAdSpotPrice;
    }

    function setMarketplaceContract(address _marketplaceAddress)
        external
        onlyContractOwner
    {
        marketplaceContract = IMarketplace(_marketplaceAddress);
    }

    // Allows the contract owner to modify the starting bid price for billboard ads
    function modifyStartingBidPrice(uint256 _newAmount)
        external
        onlyContractOwner
    {
        startingBidPrice = _newAmount;
    }

    // Allows the contract owner to modify the price for video ad slots
    function modifyVideoAdSpotPrice(uint256 _newPrice)
        external
        onlyContractOwner
    {
        videoAdSpotPrice = _newPrice;
    }

    // Allows advertisers to bid for billboard ad slots while the auction is active
    function bidForBillboardAd(string memory _adDetailsURL)
        external
        payable
        onlyWhileAuctionActive
    {
        require(
            msg.value >= startingBidPrice,
            "Bid is below the required amount"
        );

        address oustedBidderAddress;
        uint256 oustedBidAmount;

        for (uint256 i = 0; i < 3; i++) {
            if (msg.value > todayBillboard[i].bidAmount) {
                if (i == 0) {
                    oustedBidderAddress = todayBillboard[2].bidderAddress;
                    oustedBidAmount = todayBillboard[2].bidAmount;
                }

                for (uint256 j = 2; j > i; j--) {
                    todayBillboard[j] = todayBillboard[j - 1];
                }

                todayBillboard[i] = BillboardBidder({
                    bidderAddress: msg.sender,
                    bidAmount: msg.value,
                    adDetailsURL: _adDetailsURL
                });

                emit BillboardBidPlaced(msg.sender, msg.value, _adDetailsURL);
                break;
            }
        }

        if (oustedBidderAddress != address(0)) {
            pendingWithdrawals[oustedBidderAddress] += oustedBidAmount;
        }
    }

    // Initiates a new auction cycle for the billboard ad slots
    function initiateNewBillboardAuction() external onlyWhenAuctionEnds {
        for (uint256 i = 0; i < 3; i++) {
            yesterdayBillboard[i] = todayBillboard[i];
            delete todayBillboard[i];
        }
        nextAuctionEndTime = block.timestamp + DAY_IN_SECONDS;
    }

    // Re-Initiates a new auction cycle for the billboard ad slots before the 24hrs end
    function resetAuctionEarly() external onlyContractOwner {
        for (uint256 i = 0; i < 3; i++) {
            yesterdayBillboard[i] = todayBillboard[i];
            delete todayBillboard[i];
        }
        nextAuctionEndTime = block.timestamp + DAY_IN_SECONDS;

        emit AuctionResetEarly();
    }

    // Allows advertisers to buy video ad slots by paying the required amount
    function buyVideoAdSlots(uint256 spots, string memory _adDetailsURL)
        external
        payable
    {
        uint256 totalCost = spots * videoAdSpotPrice;
        require(msg.value == totalCost, "Payment mismatch");

        VideoAdvertisement memory newAd = VideoAdvertisement({
            advertiser: msg.sender,
            spotsRemaining: spots,
            adDetailsURL: _adDetailsURL
        });

        videoAdsQueue.push(newAd);
        emit VideoAdSlotPurchased(msg.sender, spots);
    }

    // Displays the next video ad in queue and distributes earnings
    function displayNextVideoAd(address contentCreator) external {
        // Check if there are no ads in the queue
        if (videoAdsQueue.length == 0) {
            emit VideoAdResult("No ads available", contentCreator);
            return;
        }

        // Check if the content creator has a Premium Pass
        if (hasPremiumPass(contentCreator)) {
            emit VideoAdResult("Valuable user", contentCreator);
            return;
        }

        // Get the current advertisement from the queue
        VideoAdvertisement storage currentAd = videoAdsQueue[0];

        // Calculate the cost of the ad and the shares for the platform and content creator
        uint256 adCost = currentAd.spotsRemaining * videoAdSpotPrice;
        uint256 platformShare = (adCost * PLATFORM_EARNINGS_PERCENTAGE) / 100;
        uint256 contentCreatorShare = adCost - platformShare;

        // Update the virtual balances
        pendingWithdrawals[platformWallet] += platformShare;
        pendingWithdrawals[contentCreator] += contentCreatorShare;

        // Emit the event that the ad was played
        emit VideoAdPlayed(
            currentAd.advertiser,
            currentAd.spotsRemaining,
            currentAd.adDetailsURL
        );

        // Decrement the spots remaining for the ad
        currentAd.spotsRemaining--;
        if (currentAd.spotsRemaining == 0) {
            // Remove the ad from the queue if there are no spots remaining
            videoAdsQueue[0] = videoAdsQueue[videoAdsQueue.length - 1];
            videoAdsQueue.pop();
        }

        // Emit the result of the ad display
        emit VideoAdResult("Ad displayed", contentCreator);
    }

    // Helper function to check if user has Premium pass
    function hasPremiumPass(address user) internal view returns (bool) {
        return marketplaceContract.hasPremiumPass(user);
    }

    // Checks the pending withdrawals (earnings) for a given address
    function checkPendingWithdrawal(address user)
        external
        view
        returns (uint256)
    {
        return pendingWithdrawals[user];
    }

    // Allows users to withdraw their pending earnings
    function withdrawMyEarnings() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No earnings to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Retrieves all active video ads currently in queue
    function retrieveActiveAds()
        external
        view
        returns (VideoAdvertisement[] memory)
    {
        return videoAdsQueue;
    }

    // Retrieves details of the current billboard ad auction
    function getCurrentBillboardDetails()
        external
        view
        returns (
            uint256 auctionEndTime,
            uint256 baseBid,
            BillboardBidder[3] memory topThreeBids
        )
    {
        return (nextAuctionEndTime, startingBidPrice, todayBillboard);
    }

    // Retrieves all active video ads purchased by a specific user
    function retrieveSpecificUserAds(address user)
        external
        view
        returns (VideoAdvertisement[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < videoAdsQueue.length; i++) {
            if (videoAdsQueue[i].advertiser == user) {
                count++;
            }
        }
        VideoAdvertisement[] memory userAds = new VideoAdvertisement[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < videoAdsQueue.length; i++) {
            if (videoAdsQueue[i].advertiser == user) {
                userAds[index] = videoAdsQueue[i];
                index++;
            }
        }
        return userAds;
    }

    // Return today top bit amount
    function listTodayTopBid() external view returns (uint256) {
        return todayBillboard[0].bidAmount;
    }
}
