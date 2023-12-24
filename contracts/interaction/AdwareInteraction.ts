import Web3 from "web3";
import abi from "../abis/AdwareAbi.json";

const contractAddress = process.env.NEXT_PUBLIC_ADWARE_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_THETA_RPC_URL;

const MIN_GAS_PRICE_GWEI = process.env.NEXT_PUBLIC_MIN_GAS_PRICE_GWEI || "2";
const DEFAULT_GAS_LIMIT = process.env.NEXT_PUBLIC_DEFAULT_GAS_LIMIT || "3000000";

const getAdjustedGasPrice = async (web3: Web3): Promise<string> => {
  const gasPrice = await web3.eth.getGasPrice();
  const minGasPriceWei = BigInt(web3.utils.toWei(MIN_GAS_PRICE_GWEI, "gwei"));
  const adjustedGasPrice =
    gasPrice > minGasPriceWei ? gasPrice : minGasPriceWei;
  return adjustedGasPrice.toString();
};

interface AdwareContract {
  bidForBillboardAd: (adDetailsURL: string, price: number) => Promise<any>;
  startingBidPrice: () => Promise<any>;
  videoAdSpotPrice: () => Promise<any>;
  getCurrentBillboardDetails: () => Promise<any>;
  listTodayTopBid: () => Promise<any>;
  yesterdayBids: (index: number) => Promise<any>;
  listYesterdayTopBids: () => Promise<any>;
  checkPendingWithdrawal: (user: string) => Promise<any>;
  withdrawMyEarnings: () => Promise<any>;
  initiateNewBillboardAuction: () => Promise<any>;
  buyVideoAdSlots: (spots: number, adDetailsURL: string) => Promise<any>;
  displayNextVideoAd: (contentCreator: string) => Promise<any>;
  getVideoAdDetails: (index: number) => Promise<any>;
  retrieveActiveAds: () => Promise<any>;
  retrieveSpecificUserAds: (user: string) => Promise<any>;
}

const AdwareInteraction = (): AdwareContract => {
  let web3: Web3;
  let adwareContract: any;

  if (typeof window !== "undefined" && (window as any).ethereum) {
    web3 = new Web3((window as any).ethereum);
    try {
      (window as any).ethereum.enable();
    } catch (error) {
      console.error("User denied account access...");
    }
  } else {
    web3 = new Web3(RPC_URL);
  }

  adwareContract = new web3.eth.Contract(abi, contractAddress);

  if (!adwareContract) {
    throw new Error("Contract not initialized");
  }

  // Bid for billboard ad slot
  const bidForBillboardAd = async (adDetailsURL: string, price: number) => {
    const priceInWei = web3.utils.toWei(String(price), "ether");
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await adwareContract.methods.bidForBillboardAd(adDetailsURL).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
        value: priceInWei,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Retrieve current billboard auction details
  const getCurrentBillboardDetails = async () => {
    try {
      return await adwareContract.methods.getCurrentBillboardDetails().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Initiate a new billboard ad auction
  const initiateNewBillboardAuction = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await adwareContract.methods.initiateNewBillboardAuction().send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Buy video ad slots
  const buyVideoAdSlots = async (spots: number, adDetailsURL: string) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      const slotPrice = await videoAdSpotPrice(); // slotPrice in Ether
      const slotPriceInWei = web3.utils.toWei(slotPrice, "ether"); // Convert to Wei
      const slotPriceBN = web3.utils.toBigInt(slotPriceInWei); // Convert to BigNumber

      const spotsBN = web3.utils.toBigInt(spots); // Convert spots to BigNumber
      const totalCostInWeiBN = slotPriceBN * spotsBN; // Perform multiplication using BigNumber

      const value = totalCostInWeiBN.toString(); // Convert the result to a string

      console.log(`Value: ${value}, Slot Price: ${slotPrice}, Spots: ${spots}`);

      return await adwareContract.methods
        .buyVideoAdSlots(spots, adDetailsURL)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
          value,
        });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Display the next video ad
  const displayNextVideoAd = async (contentCreator: string) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      // Assuming 'adwareContract' is your contract instance
      const receipt = await adwareContract.methods
        .displayNextVideoAd(contentCreator)
        .send({
          from: accounts[0],
          gas: DEFAULT_GAS_LIMIT,
          gasPrice: adjustedGasPrice,
        });

      // Check for VideoAdResult event
      const videoAdResultEvent = receipt.events?.VideoAdResult;
      if (videoAdResultEvent) {
        const message = videoAdResultEvent.returnValues.message;
        console.log("Video Ad Result:", message);
        return { type: "result", message };
      }

      // Check for VideoAdPlayed event
      const videoAdPlayedEvent = receipt.events?.VideoAdPlayed;
      if (videoAdPlayedEvent) {
        const videoAdDetails = videoAdPlayedEvent.returnValues;
        console.log("Video Ad Played:", videoAdDetails);
        return { type: "played", details: videoAdDetails };
      }

      console.log("No relevant event found.");
      return { type: "none" };
    } catch (error) {
      console.error("Error while displaying video ad:", error);
      throw error;
    }
  };

  // Check pending withdrawals for a user
  const checkPendingWithdrawal = async (user: string) => {
    try {
      return await adwareContract.methods.checkPendingWithdrawal(user).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Withdraw user earnings
  const withdrawMyEarnings = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);

      return await adwareContract.methods.withdrawMyEarnings().send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Retrieve all active video ads
  const retrieveActiveAds = async () => {
    try {
      return await adwareContract.methods.retrieveActiveAds().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Retrieve specific user's video ads
  const retrieveSpecificUserAds = async (user: string) => {
    try {
      return await adwareContract.methods.retrieveSpecificUserAds(user).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // List top billboard ads for today
  const listTodayTopBid = async () => {
    try {
      const listTodayTopBid = await adwareContract.methods
        .listTodayTopBid()
        .call();
      return web3.utils.fromWei(listTodayTopBid, "ether");
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Get the starting bid price
  const startingBidPrice = async () => {
    try {
      const startingBitPriceEther = await adwareContract.methods
        .startingBidPrice()
        .call();
      return web3.utils.fromWei(startingBitPriceEther, "ether");
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Get the starting bid price
  const videoAdSpotPrice = async () => {
    try {
      const videoAdSpotPrice = await adwareContract.methods
        .videoAdSpotPrice()
        .call();
      return web3.utils.fromWei(videoAdSpotPrice, "ether");
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // List top billboard ads for yesterday
  const yesterdayBids = async (index: number) => {
    try {
      return await adwareContract.methods.yesterdayBillboard(index).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // List top billboard ads for yesterday
  const listYesterdayTopBids = async () => {
    try {
      return await adwareContract.methods.listYesterdayTopBids().call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // Retrieve details for a specific video ad by index
  const getVideoAdDetails = async (index: number) => {
    try {
      return await adwareContract.methods.getVideoAdDetails(index).call();
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  return {
    bidForBillboardAd,
    startingBidPrice,
    videoAdSpotPrice,
    getCurrentBillboardDetails,
    listTodayTopBid,
    yesterdayBids,
    listYesterdayTopBids,
    checkPendingWithdrawal,
    withdrawMyEarnings,
    initiateNewBillboardAuction,
    buyVideoAdSlots,
    displayNextVideoAd,
    getVideoAdDetails,
    retrieveActiveAds,
    retrieveSpecificUserAds,
  };
};

export default AdwareInteraction;
