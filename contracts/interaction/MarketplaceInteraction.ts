import Web3 from "web3";
import abi from "../abis/MarketplaceAbi.json";

const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_THETA_RPC_URL;

const MIN_GAS_PRICE_GWEI = process.env.NEXT_PUBLIC_MIN_GAS_PRICE_GWEI || "2";
const DEFAULT_GAS_LIMIT = process.env.NEXT_PUBLIC_DEFAULT_GAS_LIMIT || "3000000";

const getAdjustedGasPrice = async (web3: Web3): Promise<string> => {
  const gasPrice = await web3.eth.getGasPrice(); // This is a bigint
  const minGasPriceWei = BigInt(web3.utils.toWei(MIN_GAS_PRICE_GWEI, "gwei")); // Convert to bigint
  const adjustedGasPrice =
    gasPrice > minGasPriceWei ? gasPrice : minGasPriceWei;
  return adjustedGasPrice.toString();
};

interface NFTMarketplaceContract {
  setPlatformFee: (fee: number) => Promise<any>;
  getPlatformFee: () => Promise<any>;
  mintNFT: (tokenURI: string) => Promise<any>;
  mintAndListNFT: (tokenURI: string, price: number) => Promise<any>;
  listNFTForSale: (tokenId: number, price: number) => Promise<any>;
  relistNFT: (tokenId: number, price: number) => Promise<any>;
  unlistNFT: (tokenId: number) => Promise<any>;
  purchaseNFT: (tokenId: number) => Promise<any>;
  startNFTAuction: (
    tokenId: number,
    startPrice: number,
    bottomPrice: number,
    discountRate: number,
    duration: number
  ) => Promise<any>;
  cancelNFTAuction: (tokenId: number) => Promise<any>;
  buyNFTFromAuction: (tokenId: number) => Promise<any>;
  getAuctionPrice: (tokenId: number) => Promise<any>;
  withdrawFunds: () => Promise<any>;
  fetchAllNFTs: () => Promise<any>;
  fetchAllNFTsOnSale: () => Promise<any>;
  fetchNFTsOwnedByUser: (user: string) => Promise<any>;
  fetchNFTDetails: (tokenId: number) => Promise<any>;
  fetchNFTTotalCount: () => Promise<any>;
  fetchOwnedNFTsNotOnSale: (owner: string) => Promise<any>;
  fetchOwnedNFTsOnSale: (owner: string) => Promise<any>;
  fetchNFTsOnAuction: () => Promise<any>;
  checkPendingWithdrawal: (user: string) => Promise<any>;
  auctions: (tokenId: number) => Promise<any>;
  discountInterval: () => Promise<any>;
  ownerOf: (tokenId: number) => Promise<any>;
  tokenURI: (tokenId: number) => Promise<any>;
  listNFTForRent: (tokenId: number, dailyPrice: number) => Promise<any>;
  rentNFT: (tokenId: number, duration: number) => Promise<any>;
  unlistNFTFromRental: (tokenId: number) => Promise<any>;
  hasActivePass: (user: string) => Promise<boolean>;
  getCurrentPassType: (user: string) => Promise<string>;
  hasSuperPass: (user: string) => Promise<boolean>;
  hasPremiumPass: (user: string) => Promise<boolean>;
  setPassPrices: (
    monthlyStandard: string,
    annualStandard: string,
    monthlySuper: string,
    annualSuper: string,
    monthlyPremium: string,
    annualPremium: string
  ) => Promise<any>;
  getPassPrices: () => Promise<string[]>;
  purchasePass: (
    duration: FlexPassDuration,
    passType: "Standard" | "Super" | "Premium"
  ) => Promise<any>;
  setRentalPeriod: (
    tokenId: number,
    rentalStart: number,
    rentalEnd: number
  ) => Promise<any>;
  checkRentNFTAccess: (tokenId: number, user: string) => Promise<any>;
  checkNFTRentStatus: (tokenId: number, user: string) => Promise<any>;
  calculateRentalPrice: (
    dailyPrice: number,
    duration: number
  ) => Promise<number>;
}

export enum FlexPassDuration {
  Monthly = "Monthly",
  ThreeMonth = "ThreeMonth",
  Annual = "Annual",
}

const MarketplaceInteraction = (): NFTMarketplaceContract => {
  let web3: Web3;
  let nftMarketplaceContract: any;

  if (typeof window !== "undefined" && (window as any).ethereum) {
    web3 = new Web3((window as any).ethereum);
    try {
      (window as any).ethereum.enable(); // Request account access if needed
    } catch (error) {
      console.error("User denied account access...");
    }
  } else {
    web3 = new Web3(RPC_URL);
  }

  nftMarketplaceContract = new web3.eth.Contract(abi, contractAddress);

  if (!nftMarketplaceContract) {
    throw new Error("Contract not initialized");
  }

  // Set the platform fee
  const setPlatformFee = async (fee: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await nftMarketplaceContract.methods.setPlatformFee(fee).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch the platform fee
  const getPlatformFee = async () => {
    try {
      return await nftMarketplaceContract.methods.getPlatformFee().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Mint an NFT with the given token URI
  const mintNFT = async (tokenURI: string) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const receipt = await nftMarketplaceContract.methods
        .mintNFT(tokenURI)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });

      const mintEvent = receipt.events?.NFTMinted;
      if (mintEvent) {
        const newTokenId = mintEvent.returnValues.tokenId;
        console.log("Minted NFT ID:", newTokenId);
        return Number(newTokenId);
      } else {
        console.log("NFT Minted event not found.");
      }
    } catch (error) {
      console.error("Error while minting NFT:", error);
      throw error;
    }
  };

  // Mint and list an NFT with the given token URI and price
  const mintAndListNFT = async (tokenURI: string, price: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const priceInWei = web3.utils.toWei(String(price), "ether");
      const receipt = await nftMarketplaceContract.methods
        .mintAndListNFT(tokenURI, priceInWei)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });

      if (receipt.status) {
        const mintAndListEvent = receipt.events?.NFTMintedAndListed;
        if (mintAndListEvent) {
          const newTokenId = mintAndListEvent.returnValues.tokenId;
          console.log("Minted and Listed NFT ID:", newTokenId);
          return Number(newTokenId);
        } else {
          console.log("NFT Minted and Listed event not found.");
        }
      } else {
        throw new Error("Minting and listing transaction failed");
      }
    } catch (error) {
      console.error("Error in minting and listing NFT:", error);
      throw error;
    }
  };

  // List an NFT for sale with the given token ID and price
  const listNFTForSale = async (tokenId: number, price: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const priceInWei = web3.utils.toWei(String(price), "ether");
      return await nftMarketplaceContract.methods
        .listNFTForSale(tokenId, priceInWei)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });
    } catch (error) {
      console.log("error: ", error);
      throw error;
    }
  };

  // Relist an NFT with the given token ID and price
  const relistNFT = async (tokenId: number, price: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const priceInWei = web3.utils.toWei(String(price), "ether");
      return await nftMarketplaceContract.methods
        .relistNFT(tokenId, priceInWei)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Unlist an NFT using its token ID
  const unlistNFT = async (tokenId: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await nftMarketplaceContract.methods.unlistNFT(tokenId).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Purchase an NFT using its token ID - return new owner address
  const purchaseNFT = async (tokenId: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const nftDetail = await fetchNFTDetails(tokenId);
      await nftMarketplaceContract.methods.purchaseNFT(tokenId).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
        value: nftDetail.price,
      });
      const newOwner = await ownerOf(tokenId);
      return newOwner;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Start an auction for an NFT
  const startNFTAuction = async (
    tokenId: number,
    startPrice: number,
    bottomPrice: number,
    discountRate: number, // not percentage (how much about to be reduced every 30min)
    duration: number // seconds
  ) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const startPriceInWei = web3.utils.toWei(String(startPrice), "ether");
      const bottomPriceInWei = web3.utils.toWei(String(bottomPrice), "ether");
      const discountRateInWei = web3.utils.toWei(String(discountRate), "ether");

      return await nftMarketplaceContract.methods
        .startNFTAuction(
          tokenId,
          startPriceInWei,
          bottomPriceInWei,
          discountRateInWei,
          duration
        )
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Cancel an ongoing auction for an NFT
  const cancelNFTAuction = async (tokenId: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await nftMarketplaceContract.methods
        .cancelNFTAuction(tokenId)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Purchase an NFT from an ongoing auction - return new owner address
  const buyNFTFromAuction = async (tokenId: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const auctionPriceEther = await getAuctionPrice(tokenId);
      const auctionPriceWei = web3.utils.toWei(
        auctionPriceEther.toString(),
        "ether"
      );

      const receipt = await nftMarketplaceContract.methods
        .buyNFTFromAuction(tokenId)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
          value: auctionPriceWei,
        });

      // Check receipt status
      if (!receipt.status) {
        throw new Error("Transaction failed");
      }

      // Get the new owner of the NFT
      const newOwner = await ownerOf(tokenId);
      return newOwner;
    } catch (error) {
      console.error("Error in buying NFT from auction:", error);
      throw error;
    }
  };

  // Get the current auction price of an NFT
  const getAuctionPrice = async (tokenId: number) => {
    try {
      const auctionPriceWei = await nftMarketplaceContract.methods
        .getAuctionPrice(tokenId)
        .call();
      return web3.utils.fromWei(auctionPriceWei, "ether");
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const listNFTForRent = async (tokenId: number, dailyPrice: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);
      const dailyPriceInWei = web3.utils.toWei(String(dailyPrice), "ether");

      return await nftMarketplaceContract.methods
        .listNFTForRent(tokenId, dailyPriceInWei)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });
    } catch (error) {
      console.error("Error in listing NFT for rent:", error);
      throw error;
    }
  };

  // Rent an NFT
  const rentNFT = async (tokenId: number, duration: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await nftMarketplaceContract.methods
        .rentNFT(tokenId, duration)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });
    } catch (error) {
      console.error("Error in renting NFT:", error);
      throw error;
    }
  };

  // Unlist an NFT from rental
  const unlistNFTFromRental = async (tokenId: number) => {
    const accounts = await web3.eth.getAccounts();
    const adjustedGasPrice = await getAdjustedGasPrice(web3);

    return await nftMarketplaceContract.methods
      .unlistNFTFromRental(tokenId)
      .send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
  };

  // Set the Pass Prices
  const setPassPrices = async (
    monthlyStandard: string,
    annualStandard: string,
    monthlySuper: string,
    annualSuper: string,
    monthlyPremium: string,
    annualPremium: string
  ) => {
    const accounts = await web3.eth.getAccounts();
    const adjustedGasPrice = await getAdjustedGasPrice(web3);

    return await nftMarketplaceContract.methods
      .setPassPrices(
        web3.utils.toWei(monthlyStandard, "ether"),
        web3.utils.toWei(annualStandard, "ether"),
        web3.utils.toWei(monthlySuper, "ether"),
        web3.utils.toWei(annualSuper, "ether"),
        web3.utils.toWei(monthlyPremium, "ether"),
        web3.utils.toWei(annualPremium, "ether")
      )
      .send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
  };

  // Get the Pass Prices
  const getPassPrices = async () => {
    const prices = await nftMarketplaceContract.methods.getPassPrices().call();
    return prices.map((price: any) => web3.utils.fromWei(price, "ether"));
  };

  // Set rental period for an NFT
  const setRentalPeriod = async (
    tokenId: number,
    rentalStart: number,
    rentalEnd: number
  ) => {
    const accounts = await web3.eth.getAccounts();
    const adjustedGasPrice = await getAdjustedGasPrice(web3);

    return await nftMarketplaceContract.methods
      .setRentalPeriod(tokenId, rentalStart, rentalEnd)
      .send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
  };

  // Check if a user has an active pass
  const hasActivePass = async (user: string) => {
    return await nftMarketplaceContract.methods.hasActivePass(user).call();
  };

  // Get current pass type for a user
  const getCurrentPassType = async (user: string) => {
    return await nftMarketplaceContract.methods.getCurrentPassType(user).call();
  };

  // Check if a user has a Super Pass
  const hasSuperPass = async (user: string) => {
    return await nftMarketplaceContract.methods.hasSuperPass(user).call();
  };

  // Check if a user has a Premium Pass
  const hasPremiumPass = async (user: string) => {
    return await nftMarketplaceContract.methods.hasPremiumPass(user).call();
  };

  // purchaseStandardPass or purchaseSuperPass or purchasePremiumPass
  const purchasePass = async (
    duration: FlexPassDuration,
    passType: "Standard" | "Super" | "Premium"
  ) => {
    const accounts = await web3.eth.getAccounts();
    const adjustedGasPrice = await getAdjustedGasPrice(web3);

    // Fetch current prices
    const prices = await getPassPrices();
    let priceInEther;

    switch (passType) {
      case "Standard":
        priceInEther =
          duration === FlexPassDuration.Annual ? prices[1] : prices[0];
        break;
      case "Super":
        priceInEther =
          duration === FlexPassDuration.Annual ? prices[3] : prices[2];
        break;
      case "Premium":
        priceInEther =
          duration === FlexPassDuration.Annual ? prices[5] : prices[4];
        break;
      default:
        throw new Error("Invalid pass type");
    }

    const methodName = `purchase${passType}Pass`;
    return await nftMarketplaceContract.methods[methodName](duration).send({
      from: accounts[0],
      gas: DEFAULT_GAS_LIMIT,
      gasPrice: adjustedGasPrice,
      value: web3.utils.toWei(priceInEther, "ether"),
    });
  };

  // Check if a user has access to a rented NFT or via a Flex Pass
  const checkRentNFTAccess = async (tokenId: number, user: string) => {
    try {
      return await nftMarketplaceContract.methods
        .checkRentNFTAccess(tokenId, user)
        .call();
    } catch (error) {
      console.error("Error in checking rent NFT access:", error);
      throw error;
    }
  };

  // Check the rent status
  const checkNFTRentStatus = async (tokenId: number) => {
    try {
      return await nftMarketplaceContract.methods
        .checkNFTRentStatus(tokenId)
        .call();
    } catch (error) {
      console.error("Error in checking NFT rent status:", error);
      throw error;
    }
  };

  // Calculate rental price with possible discounts
  const calculateRentalPrice = async (dailyPrice: number, duration: number) => {
    try {
      const dailyPriceInWei = web3.utils.toWei(String(dailyPrice), "ether");
      return await nftMarketplaceContract.methods
        .calculateRentalPrice(dailyPriceInWei, duration)
        .call()
        .then((totalPriceInWei: string) =>
          web3.utils.fromWei(totalPriceInWei, "ether")
        );
    } catch (error) {
      console.error("Error in calculating rental price:", error);
      throw error;
    }
  };

  // Withdraw funds from the contract
  const withdrawFunds = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await nftMarketplaceContract.methods.withdrawFunds().send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch all NFTs available in the contract
  const fetchAllNFTs = async () => {
    try {
      return await nftMarketplaceContract.methods.fetchAllNFTs().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch all NFTs currently on sale
  const fetchAllNFTsOnSale = async () => {
    try {
      return await nftMarketplaceContract.methods.fetchAllNFTsOnSale().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch NFTs owned by a specific user
  const fetchNFTsOwnedByUser = async (user: string) => {
    try {
      return await nftMarketplaceContract.methods
        .fetchNFTsOwnedByUser(user)
        .call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch details of a specific NFT using its token ID
  const fetchNFTDetails = async (tokenId: number) => {
    try {
      return await nftMarketplaceContract.methods
        .fetchNFTDetails(tokenId)
        .call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch total count of NFTs in the marketplace
  const fetchNFTTotalCount = async () => {
    try {
      // await new Promise((resolve) => setTimeout(resolve, 10000));
      const nftCount = await nftMarketplaceContract.methods
        .fetchNFTTotalCount()
        .call();
      return Number(nftCount);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch NFTs owned by a user but not on sale
  const fetchOwnedNFTsNotOnSale = async (owner: string) => {
    try {
      return await nftMarketplaceContract.methods
        .fetchOwnedNFTsNotOnSale(owner)
        .call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch NFTs that are owned by a user and are on sale
  const fetchOwnedNFTsOnSale = async (owner: string) => {
    try {
      const ownerNFTCount = await nftMarketplaceContract.methods
        .fetchOwnedNFTsOnSale(owner)
        .call();

      if (Array.isArray(ownerNFTCount)) {
        return ownerNFTCount.map((num) => Number(num));
      } else {
        return [Number(ownerNFTCount)];
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Fetch NFTs that are currently on auction
  const fetchNFTsOnAuction = async () => {
    try {
      return await nftMarketplaceContract.methods.fetchNFTsOnAuction().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Check pending withdrawals for a user
  const checkPendingWithdrawal = async (user: string) => {
    try {
      return await nftMarketplaceContract.methods
        .checkPendingWithdrawal(user)
        .call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Get auction details for a specific NFT using its token ID
  const auctions = async (tokenId: number) => {
    try {
      return await nftMarketplaceContract.methods.auctions(tokenId).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Get the discount interval
  const discountInterval = async () => {
    try {
      return await nftMarketplaceContract.methods.discountInterval().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Get the owner of a specific NFT using its token ID
  const ownerOf = async (tokenId: number) => {
    try {
      return await nftMarketplaceContract.methods.ownerOf(tokenId).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Get the token URI for a specific NFT using its token ID
  const tokenURI = async (tokenId: number) => {
    try {
      return await nftMarketplaceContract.methods.tokenURI(tokenId).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  return {
    // NFT Minting and Management
    mintNFT, // Creates a new NFT with a specified token URI.
    mintAndListNFT, // Mints a new NFT and immediately lists it for sale.
    listNFTForSale, // Lists a specific NFT for sale by its token ID.
    relistNFT, // Relists an NFT for sale, possibly with a new price.
    unlistNFT, // Removes an NFT from being listed for sale.
    fetchNFTDetails, // Provides detailed information about a specific NFT.
    fetchNFTTotalCount, // Returns the total number of NFTs minted.
    fetchOwnedNFTsNotOnSale, // Gets NFTs owned by a user that are not listed for sale.
    fetchOwnedNFTsOnSale, // Retrieves NFTs owned by a user that are listed for sale.
    ownerOf, // Determines the current owner of a specific NFT.
    tokenURI, // Retrieves the unique URI of an NFT.

    // Auction Management
    startNFTAuction, // Initiates an auction for an NFT.
    cancelNFTAuction, // Cancels an ongoing auction for an NFT.
    buyNFTFromAuction, // Enables purchase of an NFT from an auction.
    getAuctionPrice, // Retrieves the current auction price of an NFT.
    fetchNFTsOnAuction, // Fetches all NFTs currently on auction.
    auctions, // Retrieves details of a specific auction.

    // NFT Rentals
    listNFTForRent, // Lists an NFT for rent.
    rentNFT, // Allows renting of an NFT for a duration.
    unlistNFTFromRental, // Removes an NFT from rental listings.
    setRentalPeriod, // Sets the rental period for an NFT.
    checkRentNFTAccess, // Checks user access to a rented NFT.
    checkNFTRentStatus, // Checks the rental status of an NFT.
    calculateRentalPrice, // Calculates the rental price for an NFT.

    // User and Marketplace Interactions
    purchaseNFT, // Enables purchase of a listed NFT.
    withdrawFunds, // Allows withdrawal of funds from the marketplace.
    fetchAllNFTs, // Fetches all NFTs in the marketplace.
    fetchAllNFTsOnSale, // Retrieves all NFTs currently on sale.
    fetchNFTsOwnedByUser, // Gets all NFTs owned by a specific user.
    checkPendingWithdrawal, // Checks pending withdrawals for a user.
    discountInterval, // Gets the interval for auction price reduction.

    // Pass Management
    hasActivePass, // Checks if a user has an active pass.
    getCurrentPassType, // Determines the user's current pass type.
    hasSuperPass, // Checks if a user has a 'Super Pass'.
    hasPremiumPass, // Checks if a user has a 'Premium Pass'.
    setPassPrices, // Sets prices for different pass types.
    getPassPrices, // Retrieves current pass prices.
    purchasePass, // General function for purchasing a pass.

    // Platform Configuration
    setPlatformFee, // Sets the platform fee for transactions.
    getPlatformFee, // Retrieves the current platform fee.
  };
};

export default MarketplaceInteraction;
