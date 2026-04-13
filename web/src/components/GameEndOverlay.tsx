"use client";

import { useEffect, useState } from "react";

type EndType = "won" | "critical";

const CONFETTI_COLORS = [
  "bg-yellow-400",
  "bg-green-400",
  "bg-pink-400",
  "bg-blue-400",
  "bg-purple-400",
  "bg-red-400",
  "bg-orange-400",
  "bg-cyan-400",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${(index * 7.3 + 3) % 100}%`;
  const delay = `${(index * 0.15) % 2}s`;
  const duration = `${2 + (index % 3)}s`;
  const size = index % 3 === 0 ? "w-3 h-3" : index % 3 === 1 ? "w-2 h-4" : "w-2 h-2";

  return (
    <div
      className={`absolute top-0 ${color} ${size} rounded-sm opacity-90`}
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
        animationName: "confetti-fall",
        animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        animationIterationCount: "infinite",
        transform: `rotate(${index * 37}deg)`,
      }}
    />
  );
}

function WonScreen() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-900/95 via-green-900/95 to-blue-900/95">
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <div className="relative z-10 text-center font-[family-name:var(--font-cairo)]" dir="rtl">
        <div className="mb-6 text-8xl animate-bounce">🎉</div>
        <h1 className="mb-4 text-5xl font-black text-yellow-300 drop-shadow-lg">
          مبرووووك!
        </h1>
        <p className="mb-2 text-3xl font-bold text-white">
          خلاص كده! أنا فرّحتك النهاردة! 🥳
        </p>
        <p className="mb-8 text-xl text-yellow-200/80">
          وصلت ١٠٠ من ١٠٠ -- يومك حلو وأنا السبب 😎
        </p>
        <div className="text-6xl animate-pulse">🏆</div>
      </div>
    </div>
  );
}

function CriticalScreen() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setFlash((v) => !v), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center transition-colors duration-300 ${
        flash ? "bg-red-950/98" : "bg-neutral-950/98"
      }`}
    >
      <div className="text-center font-[family-name:var(--font-cairo)]" dir="rtl">
        <div className="mb-6 text-8xl animate-pulse">🚨</div>
        <h1 className="mb-4 text-5xl font-black text-red-400">
          حالة حرجة!
        </h1>
        <p className="mb-2 text-3xl font-bold text-white">
          بنتصل بمستشفى الصحة النفسية... 📞
        </p>
        <p className="mb-4 text-2xl text-red-300">
          هنبعتلك أمبولانس من مستشفى العباسية 🏥
        </p>
        <p className="mb-8 text-xl text-red-200/70">
          مفيش نكتة في الدنيا عجبتك... أنت حالتك صعبة يا باشا 😭
        </p>
        <div className="flex items-center justify-center gap-4 text-5xl">
          <span className="animate-bounce">🚑</span>
          <span className="animate-ping text-red-500">●</span>
          <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>🏥</span>
        </div>
      </div>
    </div>
  );
}

export default function GameEndOverlay({ type }: { type: EndType }) {
  return (
    <div className="fixed inset-0 z-50">
      {type === "won" ? <WonScreen /> : <CriticalScreen />}
    </div>
  );
}
