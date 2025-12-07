"use client";

import Link from "next/link";
import Beams from "@/components/Beams";
import TargetCursor from "@/components/TargetCursor";
import TextType from "@/components/TextType";
import CardNav from "@/components/CardNav";
import CardSwap, { Card } from "@/components/CardSwap";

export default function LandingPage() {
  const items = [
    {
      label: "About",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "About AeroLink", ariaLabel: "About AeroLink", href: "/about/aerolink" },
        { label: "Team", ariaLabel: "AeroLink Team", href: "/about/team" },
        { label: "Hedera Network", ariaLabel: "About Hedera Network", href: "https://hedera.com" },
      ],
    },
    {
      label: "Projects",
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Register Node", ariaLabel: "Register Node", href: "/register" },
        { label: "Earn Token", ariaLabel: "Earn Token", href: "/docs/rewards" },
        { label: "Sell Data", ariaLabel: "Sell Data", href: "/marketplace" },
      ],
    },
    {
      label: "Contact",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [
        { label: "Email", ariaLabel: "Email us", href: "mailto:621sparsh@gmail.com" },
        { label: "Twitter", ariaLabel: "Twitter", href: "https://x.com/sparshtwt" },
        { label: "LinkedIn", ariaLabel: "LinkedIn", href: "https://www.linkedin.com/in/sparsh-a3b837319/" },
      ],
    },
  ];

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Beams beamWidth={2} beamHeight={15} beamNumber={12} lightColor="#ffffff" speed={2} noiseIntensity={1.75} scale={0.2} rotation={45} />
      </div>

      {/* Navbar */}
      <header className="w-full z-30">
        <div className="container mx-auto px-4 py-6 mb-10 mt-20">
          <CardNav
            logo={"AeroLink"}
            items={items}
            baseColor="#FDC700"
            menuColor="#000000"
            buttonBgColor="#111111"
            buttonTextColor="#ffffff"
            ease="power3.out"
          />
        </div>
      </header>

      {/* Cursor */}
      <TargetCursor spinDuration={2} hideDefaultCursor={true} parallaxOn={true} targetSelector=".cursor-target" />

      {/* Content */}
      <main className="min-h-screen flex items-start justify-center pt-24 mt-35">
        <section className="flex flex-col items-center justify-start text-center px-6 py-8 max-w-5xl w-full mt-6">

          {/* Hero */}
          <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg flex gap-3 flex-wrap justify-center">
            <span className="cursor-target">Welcome</span>
            <span className="cursor-target">to</span>
            <span className="cursor-target text-yellow-400 inline-flex items-center">
              <TextType text={["AeroLink", "Future of DePIN", "Live Air Quality", "Hedera"]} typingSpeed={75} pauseDuration={1500} showCursor={true} cursorCharacter="|" />
            </span>
          </h1>

          <p className="text-lg text-gray-300 max-w-2xl mb-8 drop-shadow">
            A decentralized weather & pollution monitoring network powered by Hedera.
            Track real-time air quality, explore nodes, and experience a trustless IoT ecosystem.
          </p>

          {/* CTA */}
          <div className="mb-24">
            <Link href="/dashboard" className="cursor-target inline-block px-8 py-3 bg-yellow-500 text-black rounded-xl shadow-lg hover:bg-yellow-600 transition-all text-lg font-semibold">
              Launch App
            </Link>
          </div>

          {/* Cards + Side Text */}
          <div className="w-full flex items-center justify-center" style={{ height: 600, position: "relative" }}>
            <div className="w-full h-full flex flex-row items-center justify-center gap-10">

              {/* Left Text */}
              <div className="hidden md:flex flex-col items-start justify-center flex-1">
                <div className="text-6xl md:text-6xl font-black text-yellow-400 leading-tight mt-30">
                  MONITOR
                  <br />
                  REWARD
                  <br />
                  TRADE
                </div>
              </div>

              {/* Cards */}
              <div className="h-full max-w-[900px] w-full translate-x-30 mb-10">
                <CardSwap cardDistance={60} verticalDistance={70} delay={5000} pauseOnHover={false}>

                  {/* Card 1 */}
                  <Card>
                    <div className="p-8 bg-black border border-white/20 rounded-xl shadow-lg max-w-xs mx-auto text-left mt-25">
                      <h3 className="text-xl font-semibold text-yellow-400 mb-6">
                        Real-Time Monitoring
                      </h3>
                      <ul className="text-sm list-disc pl-4 space-y-3 text-yellow-400">
                        <li>PM2.5 & PM10 live readings</li>
                        <li>Temperature & humidity tracking</li>
                        <li>Geo-tagged sensor nodes</li>
                      </ul>
                    </div>
                  </Card>

                  {/* Card 2 */}
                  <Card>
                    <div className="p-8 bg-black border border-white/20 rounded-xl shadow-lg max-w-xs mx-auto text-left mt-25">
                      <h3 className="text-xl font-semibold text-yellow-400 mb-6">
                        Hedera-Backed Rewards
                      </h3>
                      <ul className="text-sm list-disc pl-4 space-y-3 text-yellow-400">
                        <li>HCS proof per sensor reading</li>
                        <li>AERO token via HTS</li>
                        <li>Uptime & data quality scoring</li>
                      </ul>
                    </div>
                  </Card>

                  {/* Card 3 */}
                  <Card>
                    <div className="p-8 bg-black border border-white/20 rounded-xl shadow-lg max-w-xs mx-auto text-left mt-25">
                      <h3 className="text-xl font-semibold text-yellow-400 mb-6">
                        Buy & Sell Data
                      </h3>
                      <ul className="text-sm list-disc pl-4 space-y-3 text-yellow-400">
                        <li>Monetize verified node data</li>
                        <li>Access historical AQI datasets</li>
                        <li>Power dashboards & research APIs</li>
                      </ul>
                    </div>
                  </Card>

                </CardSwap>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-[60px] mt-15 cursor-target py-6 text-center text-gray-400 text-sm">
        AeroLink © 2025 — Powered by Hedera
      </footer>
    </div>
  );
}
