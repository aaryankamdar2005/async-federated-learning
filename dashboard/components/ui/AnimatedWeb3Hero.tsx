// components/ui/animated-web3-landing-page.tsx
"use client";
import React, { useState, useEffect } from "react";

export function Web3HeroAnimated() {
  const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes subtlePulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.03); }
          }
        `}
      </style>

      <section className="absolute inset-0 overflow-hidden bg-black text-white z-0">
        {/* BACKGROUND */}
        <div
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{
            backgroundImage: [
              "radial-gradient(80% 55% at 50% 52%, rgba(252,166,154,0.45) 0%, rgba(214,76,82,0.46) 27%, rgba(61,36,47,0.38) 47%, rgba(39,38,67,0.45) 60%, rgba(8,8,12,0.92) 78%, rgba(0,0,0,1) 88%)",
              "radial-gradient(85% 60% at 14% 0%, rgba(255,193,171,0.65) 0%, rgba(233,109,99,0.58) 30%, rgba(48,24,28,0.0) 64%)",
              "radial-gradient(70% 50% at 86% 22%, rgba(88,112,255,0.40) 0%, rgba(16,18,28,0.0) 55%)",
              "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 40%)",
            ].join(","),
            backgroundColor: "#000",
          }}
        />

        <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(140%_120%_at_50%_0%,transparent_60%,rgba(0,0,0,0.85))]" />

        {/* Grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 mix-blend-screen opacity-30"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 24px)",
              "repeating-radial-gradient(80% 55% at 50% 52%, rgba(255,255,255,0.08) 0 1px, transparent 1px 120px)"
            ].join(","),
            backgroundBlendMode: "screen",
          }}
        />

        {/* FOREGROUND ANIMATION */}
        <div
          className="pointer-events-none absolute bottom-[128px] left-1/2 z-0 h-36 w-28 -translate-x-1/2 rounded-md bg-gradient-to-b from-white/75 via-rose-100/60 to-transparent"
          style={{ animation: 'subtlePulse 6s ease-in-out infinite' }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[54vh]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px px-[2px]">
            {pillars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-white/10 transition-height duration-1000 ease-in-out"
                style={{
                  height: isMounted ? `${h}%` : '0%',
                  transitionDelay: `${Math.abs(i - Math.floor(pillars.length / 2)) * 60}ms`
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}