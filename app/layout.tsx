import Header from "@/components/header";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Chivo_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/components/NextAuthProvider";
import Providers from "@/components/Providers";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import Home from './(routes)/(flixe)/(home)/page';

interface Session {
    user?: {
        email: string;
    };
}

const chivoMono = Chivo_Mono({weight: "variable", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flixe",
  description: "Flixe - Revolutionizing the Creator Economy",
};

export default async function  RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  const session: Session | null = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={chivoMono.className}>
        <Providers>
          <NextAuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Header />
              <div className="mt-[4.5rem] sm:max-w-[90%] min-[2300px]:max-w-[80%] m-auto">
                {!session?.user?.email ? <Home /> : children}
              </div>
              {/* <div className="absolute inset-0 bg-dot-neutral-800 pointer-events-none select-none z-[-1]"></div> */}
              <Toaster />
            </ThemeProvider>
          </NextAuthProvider>
        </Providers>
      </body>
    </html>
  );
}
