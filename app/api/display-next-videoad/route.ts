import { NextRequest, NextResponse } from "next/server";
import Web3 from "web3";
import abi from "@/contracts/abis/AdwareAbi.json";

const contractAddress = process.env.NEXT_PUBLIC_ADWARE_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_THETA_RPC_URL;

const MIN_GAS_PRICE_GWEI = process.env.NEXT_PUBLIC_MIN_GAS_PRICE_GWEI || "2";
const DEFAULT_GAS_LIMIT = process.env.NEXT_PUBLIC_DEFAULT_GAS_LIMIT || "3000000";

export async function POST(req: NextRequest) {
  console.log("hello from the api");
  if (req.method !== "POST") {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Invalid request method" }),
      { status: 405 }
    );
  }

  if (RPC_URL === undefined) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "RPC_URL is undefined" }),
      { status: 500 }
    );
  }

  try {
    const requestBody = await req.text();
    const body = JSON.parse(requestBody);
    const contentCreator = body.walletAddress;
    console.log("key: ", process.env.WALLET_PRIVATE_KEY);
    // Initialize Web3 with the server's wallet
    const web3 = new Web3(
      new Web3.providers.HttpProvider(RPC_URL)
    );
    const account = web3.eth.accounts.privateKeyToAccount(
      "0x" + process.env.WALLET_PRIVATE_KEY
    );
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    // Initialize the contract
    const adwareContract = new web3.eth.Contract(abi, contractAddress);

    // Use the adjusted gas price
    const gasPrice = await web3.eth.getGasPrice();
    const minGasPriceWei = BigInt(web3.utils.toWei(MIN_GAS_PRICE_GWEI, "gwei"));
    const adjustedGasPrice =
      gasPrice > minGasPriceWei ? gasPrice : minGasPriceWei;
    const adjustedGasPriceStr = adjustedGasPrice.toString();

    // Perform the transaction
    const nonce = await web3.eth.getTransactionCount(account.address, "latest");
    const tx = {
      from: account.address,
      to: contractAddress,
      nonce: nonce,
      gas: DEFAULT_GAS_LIMIT,
      gasPrice: adjustedGasPriceStr,
      // data: adwareContract.methods
      //   .displayNextVideoAd(contentCreator)
      //   .encodeABI(),
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);


    // Parsing the event data from the receipt (assuming the event is named 'VideoAdPlayed')
    const videoAdPlayedEvent = receipt.events?.VideoAdPlayed?.returnValues;
    if (!videoAdPlayedEvent) {
      throw new Error(
        "Video Ad Played event not found in the transaction receipt"
      );
    }

    // Return the ad details
    const adDetails = {
      advertiser: videoAdPlayedEvent.advertiser,
      spotsRemaining: videoAdPlayedEvent.spotsRemaining,
      adDetailsURL: videoAdPlayedEvent.adDetailsURL,
    };

    return new NextResponse(JSON.stringify({ success: true, adDetails }), {
      status: 200,
    });
  } catch (error) {
    // Handle errors
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500 }
    );
  }
}
