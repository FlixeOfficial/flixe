import { redirect } from "next/navigation";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { WalletConnection } from "@/components/wallet-connection";
import Image from "next/image";
// import { ScrollCore } from "./components/scroll";
// import { BackgroundSVG } from './components/backgroundBeam';
// import { MeteorPreview } from './components/meteorPreview';
// import { Lamp } from './components/SVGMaskEffect';
import { Meteors } from "./components/meteors";
import NightSky from "./components/nightSky";
import Stars from "./components/stars";

interface Session {
  user?: {
    email: string;
  };
}

export default async function Home() {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="flex flex-col items-center justify-between h-[100vh] -mt-[4.5rem] ">
        <div className="flex flex-col items-center justify-center gap-4 z-10 h-full text-white">
          <h1 className="text-9xl font-black text-center leading-tight tracking-tighter mb-4">
            Step<span className="text-8xl"> </span>into
            <span className="text-8xl"> </span>
            <span className="flixe-gradient text-9xl font-black px-1">
              Flixe
            </span>
            <span className="text-8xl"> </span>
            {/* <span className="font-extrabold inline-block align-middle">
              <Image
                src="/logo.png"
                alt="Flixe logo"
                width={110}
                height={110}
                className="pb-6"
              />
            </span> */}
            <span className="text-8xl"> </span>
            Universe
          </h1>

          <div className="text-center font-semibold text-xl">
            Unlock the magic with <WalletConnection home={true} /> to explore
            further!
          </div>
          {/* <ScrollCore /> */}
        </div>
        <NightSky />
        <Stars />
        {/* <BackgroundSVG /> */}
        <Meteors number={1} />
        {/* <MeteorPreview /> */}
        {/* <Lamp /> */}
      </main>
    );
  } else {
    return redirect("/cines");
  }
}
