import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateLoanProposal from './_components/proposeLoan';
import LendLoan from './_components/lendLoan';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row px-8">
      <Tabs defaultValue="video" className="flex w-full">
        <div className="relative flex min-h-screen pr-8">
          <div className="sticky top-[6rem] border overflow-auto bg-card shadow rounded-lg max-h-96 w-64">
            <TabsList className="flex flex-col w-full bg-transparent space-y-2 -p-2">
              <h2 className="text-lg font-semibold py-2 text-foreground/30 bg-background w-full text-center">
                Loans and Collaterals
              </h2>
              <div className="flex flex-col space-y-1 w-full p-2">
                <TabsTrigger
                  value="video"
                  className="w-full justify-start px-4 py-3 hover:bg-muted border border-card data-[state=active]:border-border font-black"
                >
                  Loan Proposal
                </TabsTrigger>
                <TabsTrigger
                  value="billboard"
                  className="w-full justify-start px-4 py-3 hover:bg-muted border border-card data-[state=active]:border-border font-black"
                >
                  Fund Loans
                </TabsTrigger>
                <TabsTrigger
                  value="dynamic"
                  className="w-full justify-start px-4 py-3 hover:bg-muted border border-card data-[state=active]:border-border font-black"
                  disabled
                >
                  Dynamic Adware
                </TabsTrigger>
              </div>
            </TabsList>
          </div>
        </div>

        <div className="flex-grow overflow-hidden">
          <TabsContent value="video" className="border-none p-0 outline-none">
            {/* <div className="flex flex-col gap-y-2 pt-6">
              <h1 className="text-3xl font-bold tracking-wider">
                Create {" "}
                <span className="font-black text-[#6ca987]">Loan Proposal</span>
              </h1>
            </div> */}
            <CreateLoanProposal/>
          </TabsContent>
          <TabsContent
            value="billboard"
            className="flex flex-col h-full border-none p-0"
          >
            <div className="flex flex-col gap-y-2 pt-4">
              <h1 className="text-3xl font-bold tracking-wider">
                Fund a{" "}
                <span className="font-black text-[#6ca987]">
                  Loan Proposal
                </span>
              </h1>
            </div>
            <LendLoan />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
