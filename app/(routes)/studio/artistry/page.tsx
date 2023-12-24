"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchAddress } from "@/lib/walletUtil";
import { useRouter } from "next/navigation";
import { PlusCircle } from 'lucide-react';

const CreateCampaign = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const updateWalletAddress = async () => {
    const address = await fetchAddress();
    setWalletAddress(address);
  };

  useEffect(() => {
    updateWalletAddress();
  }, []);

  const router = useRouter();

  const handleClick = () => {
    router.push("/studio/artistry/create");
  };

  return (
    <div className="p-6">
      {/* {isLoading && <Loader />} */}
      <div className="flex items-center justify-between bg-card border rounded-md px-4 py-2">
        <div className="flex items-center flex-row justify-center align-middle">
          <div className="font-medium flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-wider">
              <span className="font-black text-[#8b7ad0]">Artistry</span>{" "}List
            </h1>
          </div>
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          onClick={handleClick}
        >
          <PlusCircle className="h-4 w-4 mr-2 font-bold" />
          Create
        </Button>
      </div>
    </div>
  );
};

export default CreateCampaign;
