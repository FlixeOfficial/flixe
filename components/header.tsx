"use client";

import Image from "next/image";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { WalletConnection } from "./wallet-connection";
import Link from "next/link";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import Confetti from "react-confetti";

export default function Header() {
  const pathname = usePathname();
  const isStudioPage = pathname?.startsWith("/studio");

  const logoRef = useRef<HTMLDivElement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOpacity, setConfettiOpacity] = useState(1);

  const menuItems = isStudioPage
    ? [
        "/studio/flixs",
        "/studio/artistry",
        "/studio/adware",
        "/studio/profile",
      ]
    : ["/cines", "/collateral", "/buzz", "/fundz"];

  const isActive = (path: string) => {
    return pathname === path ? "text-primary" : "";
  };

  const handleToggle = (event: React.MouseEvent) => {
    if (logoRef.current) {
      const toggleConfetti = event.type === "mousedown";
      logoRef.current.classList.toggle("scale-90", toggleConfetti);
      setShowConfetti(toggleConfetti);
      setConfettiOpacity(toggleConfetti ? 1 : 0);
    }
  };

  return (
    <>
      {showConfetti && (
        <Confetti style={{ opacity: confettiOpacity }} numberOfPieces={200} />
      )}

      <div className="fixed top-3 left-0 right-0 mx-auto h-12 xl:max-w-[55vw] w-[100vw] lg:max-w-[80vw] md:max-w-[90vw] sm:max-w-[95vw] bg-[#27272733] bg-opacity-50 backdrop-filter backdrop-blur-lg overflow-hidden rounded-2xl border border-border flex justify-between px-1.5 items-center z-50">
        {/* Left Section */}
        <div className="flex gap-3">
          <div
            ref={logoRef}
            className="transform transition-transform duration-200 cursor-pointer"
            onMouseDown={handleToggle}
            onMouseUp={handleToggle}
            onMouseLeave={handleToggle}
          >
            <Image src="/flixe.svg" alt="logo" width={36} height={36} />
          </div>

          <Link href={isStudioPage ? "/" : "/studio/flixs"}>
            <Button
              variant="ghost"
              className={`group h-9 rounded-sm backdrop-blur-md font-bold text-muted-foreground hover:text-primary hover:bg-card bg-transparent hover:dark:text-[#fff27c] hover:text-black tracking-wider ${isActive(
                isStudioPage ? "/" : "/studio/flixs"
              )}`}
            >
              {isStudioPage ? "Flix Portal" : "Flix Studio"}
            </Button>
          </Link>
        </div>

        {/* Middle Section */}
        <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-5 font-bold text-md ">
          {menuItems.map((item) => (
            <Link
              key={item}
              href={item}
            >
              <Button
                variant="ghost"
                className={`text-muted-foreground hover:text-primary font-bold text-md capitalize hover:bg-transparent ${isActive(
                  item
                )}`}
              >
                {item.split("/").pop()}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex gap-3">
          <WalletConnection />
          <DarkModeToggle />
        </div>
      </div>
    </>
  );
}
