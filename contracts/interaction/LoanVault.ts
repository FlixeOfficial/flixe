import Web3 from "web3";
import abi from "../abis/LoanVaultAbi.json";

const contractAddress = process.env.NEXT_PUBLIC_LOANVAULT_CONTRACT_ADDRESS;
const NFTAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_THETA_RPC_URL;

const MIN_GAS_PRICE_GWEI = process.env.NEXT_PUBLIC_MIN_GAS_PRICE_GWEI || "2";
const DEFAULT_GAS_LIMIT = process.env.NEXT_PUBLIC_DEFAULT_GAS_LIMIT || "3000000";

// Utility to adjust the gas price based on the current network conditions
const getAdjustedGasPrice = async (web3: Web3): Promise<string> => {
  const gasPrice = await web3.eth.getGasPrice();
  const minGasPriceWei = BigInt(web3.utils.toWei(MIN_GAS_PRICE_GWEI, "gwei"));
  const adjustedGasPrice = gasPrice > minGasPriceWei ? gasPrice : minGasPriceWei;
  return adjustedGasPrice.toString();
};

interface LoanVaultContract {
  getNFTPrice(tokenId: number): Promise<number>;
  proposeLoan(nftIds: number[], requestedAmount: number, toPay: number, duration: number): Promise<void>;
  retractLoan(loanId: number): Promise<void>;
  payLoanInFull(loanId: number): Promise<void>;
  acceptLoan(loanId: number): Promise<void>;
  liquidateLoan(loanId: number): Promise<void>;
}

const LoanVaultInteraction = (): LoanVaultContract => {
  let web3: Web3;
  let loanVaultContract: any;

  if (typeof window !== "undefined" && (window as any).ethereum) {
    web3 = new Web3((window as any).ethereum);
    try {
      (window as any).ethereum.enable();
    } catch (error) {
      console.error("User denied account access...");
    }
  } else {
    web3 = new Web3("https://eth-rpc-api-testnet.thetatoken.org/rpc");
  }

  loanVaultContract = new web3.eth.Contract(abi, contractAddress);

  if (!loanVaultContract) {
    throw new Error("Contract not initialized");
  }

  return {
    // Fetches current market price of a specific NFT
    async getNFTPrice(tokenId: number): Promise<number> {
      return loanVaultContract.methods.getNFTPrice(tokenId).call();
    },

    // Proposes a loan with specific NFTs as collateral
    async proposeLoan(nftIds: number[], requestedAmount: number, toPay: number, duration: number): Promise<void> {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);
      await loanVaultContract.methods.propose(NFTAddress, nftIds, requestedAmount, toPay, duration).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    },

    // Retracts a proposed loan before it's accepted
    async retractLoan(loanId: number): Promise<void> {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);
      await loanVaultContract.methods.retract(loanId).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    },

    // Pays off a loan in full
    async payLoanInFull(loanId: number): Promise<void> {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);
      await loanVaultContract.methods.payInFull(loanId).send({
        from: accounts[0],
        value: web3.utils.toWei("amount", "ether"), // Replace "amount" with the actual amount
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    },

    // Accepts a loan as a lender
    async acceptLoan(loanId: number): Promise<void> {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);
      await loanVaultContract.methods.acceptLoan(loanId).send({
        from: accounts[0],
        value: web3.utils.toWei("amount", "ether"), // Replace "amount" with the actual amount to lend
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    },

    // Liquidates a loan upon default
    async liquidateLoan(loanId: number): Promise<void> {
      const accounts = await web3.eth.getAccounts();
      const adjustedGasPrice = await getAdjustedGasPrice(web3);
      await loanVaultContract.methods.liquidate(loanId).send({
        from: accounts[0],
        gas: DEFAULT_GAS_LIMIT,
        gasPrice: adjustedGasPrice,
      });
    },
  };
};

export default LoanVaultInteraction;
