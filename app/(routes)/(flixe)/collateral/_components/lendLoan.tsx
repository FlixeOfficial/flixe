"use client";

import React, { useEffect, useState } from "react";
import DisplayCampaigns from "@/components/DisplayCampaigns";
import useCrowdFundingStore from "@/store/crowdFundingStore";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import LoanCard from './loan-card';
import BigNumber from 'bignumber.js';

interface Campaign {
  id: number;
  name: string;
}

const LendLoan: React.FC = () => {
  const { getCampaigns } = useCrowdFundingStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const data = await getCampaigns();
        setCampaigns(data);
        console.log(data);
      } catch (error) {
        console.error("Couldn't fetch campaigns:", error);
      }
      setIsLoading(false);
    };

    fetchCampaigns();
  }, [getCampaigns]);

  const sampleData = {
    owner: "John Doe",
    target: 1000, // Set your target amount in ether
    deadline: new BigNumber(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set your deadline date in milliseconds
    amountCollected: 500, // Set the amount collected in ether
    campaignURI: "https://your-campaign-uri.com",
    id: 1,
  };

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-epilogue font-semibold text-[18px] text-priamry text-left">All Proposals ({campaigns.length})</h1>

      <div className="flex flex-wrap mt-[20px] gap-[26px]">
        {/* {isLoading && (
          <img src={loader} alt="loader" className="w-[100px] h-[100px] object-contain" />
        )} */}

        {!isLoading && campaigns.length === 0 && (
          <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[#818183]">
            You have not created any campigns yet
          </p>
        )}

      {!isLoading && campaigns.length > 0 && campaigns.map((campaign, index) => (
        <LoanCard key={index} {...sampleData} id={index} />
      ))}
      </div>
    </div>
  );
};

export default LendLoan;
