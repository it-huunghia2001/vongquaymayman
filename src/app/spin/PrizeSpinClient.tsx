/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Gift, Trophy, Star } from "lucide-react";
import { PrizeModal } from "@/components/modal-prizes";
import { AlreadySpunModal } from "@/components/alreadySpunModal";
import { LoadingModal } from "@/components/modalLoading";
import { useRouter } from "next/navigation";

type Prize = {
  id: number;
  name: string;
};

type StarData = {
  left: string;
  top: string;
  delay: string;
  duration: string;
};

type ConfettiData = {
  left: string;
  top: string;
  delay: string;
  duration: string;
  emoji: string;
};

export default function PrizeSpinClient() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [rotation, setRotation] = useState(0);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const name = searchParams.get("name");
  const plateNumber = searchParams.get("plateNumber");
  const [openModalPrize, setOpenModalPrize] = useState(false);
  const [openAlreadySpunModal, setAlreadySpunModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [stars, setStars] = useState<StarData[]>([]);
  const [confetti, setConfetti] = useState<ConfettiData[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);

  const router = useRouter();

  const prizeColors = [
    { from: "#FF6B6B", to: "#FF8E8E", text: "#FFFFFF" },
    { from: "#4ECDC4", to: "#45B7AA", text: "#FFFFFF" },
    { from: "#FFE66D", to: "#FFD93D", text: "#1a1a1a" },
    { from: "#95E1D3", to: "#6DD5C3", text: "#1a1a1a" },
    { from: "#F38181", to: "#FF6B6B", text: "#FFFFFF" },
    { from: "#AA96DA", to: "#8B7ABA", text: "#FFFFFF" },
    { from: "#FCBAD3", to: "#F7A072", text: "#FFFFFF" },
    { from: "#A8E6CF", to: "#56CC9D", text: "#FFFFFF" },
    { from: "#FFD3B6", to: "#FFAAA5", text: "#FFFFFF" },
    { from: "#74B9FF", to: "#0984E3", text: "#FFFFFF" },
  ];

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const res = await fetch("/api/admin/prizes");
        const data: Prize[] = await res.json();
        setPrizes(data);
      } catch (err) {
        console.error("Lỗi khi load prizes:", err);
      } finally {
        setLoadingPrizes(false);
      }
    };
    fetchPrizes();
  }, []);

  useEffect(() => {
    const generatedStars: StarData[] = Array.from({ length: 50 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    if (showCongrats) {
      const emojis = ["🎉", "🎊", "✨", "🌟"];
      const generatedConfetti: ConfettiData[] = Array.from({ length: 20 }).map(
        () => ({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          delay: `${Math.random() * 2}s`,
          duration: `${1 + Math.random() * 2}s`,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        }),
      );
      setConfetti(generatedConfetti);
    }
  }, [showCongrats]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (spinning || openModalPrize || openAlreadySpunModal) return;
      if (loadingPrizes || prizes.length === 0) return;
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        spin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [spinning, phone, prizes]);

  const spin = async () => {
    if (spinning || !phone || prizes.length === 0) return;

    const deviceKey = localStorage.getItem("deviceKey");
    if (!deviceKey) {
      alert("Thiếu deviceKey. Vui lòng tải lại trang và thử lại.");
      return;
    }

    setSpinning(true);
    setResultIndex(null);
    setLoading(true);
    setShowCongrats(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, deviceKey, plateNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Lỗi máy chủ. Vui lòng thử lại sau.");
        setSpinning(false);
        setLoading(false);
        return;
      }

      if (data.alreadySpun) {
        setSpinning(false);
        setLoading(false);
        setAlreadySpunModal(true);
        return;
      }

      const prizeId = data.prizeId;
      const index = prizes.findIndex((p) => p.id === prizeId);

      if (index === -1) {
        alert("Phần thưởng không tồn tại.");
        setSpinning(false);
        setLoading(false);
        return;
      }

      const segmentAngle = 360 / prizes.length;

      // CÔNG THỨC CHÍNH XÁC
      // Mũi tên ở trên (0°), muốn nó chỉ vào phần thưởng thứ index
      // Công thức: 360 * spinCount - (index * segmentAngle + segmentAngle/2)
      // Dấu TRỪ vì vòng quay xoay THUẬN CHIỀU, mũi tên CỐ ĐỊNH trên cùng
      const spinCount = 5; // Quay 5 vòng
      const targetRotation =
        360 * spinCount - (index * segmentAngle + segmentAngle / 2);

      console.log("=== SPIN DEBUG (FIXED) ===");
      console.log("Total Prizes:", prizes.length);
      console.log("Segment Angle:", segmentAngle);
      console.log("Prize Index:", index);
      console.log("Prize Name:", prizes[index]?.name);
      console.log("Target Rotation (negative):", targetRotation);
      console.log("==========================");

      // Apply animation
      if (wheelRef.current) {
        wheelRef.current.style.transition = "none";
        wheelRef.current.style.transform = `rotate(0deg)`;

        void wheelRef.current.offsetHeight; // Force reflow

        wheelRef.current.style.transition =
          "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)";
        wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
      }

      setRotation(targetRotation);
      setResultIndex(index);
      setLoading(false);

      localStorage.setItem("hasSpun", "true");

      setTimeout(() => {
        setShowCongrats(true);
        setOpenModalPrize(true);
        setSpinning(false);
      }, 4000);
    } catch (error) {
      console.error("Lỗi khi gọi API /spin:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
      setSpinning(false);
      setLoading(false);
    }
  };

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <style>{`
        @keyframes ledPulse {
          0%, 100% {
            opacity: 0.3;
            filter: drop-shadow(0 0 4px currentColor);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 12px currentColor);
          }
        }

        @keyframes rotateLeds {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .led-lights {
          animation: rotateLeds 8s linear infinite;
        }

        .led-light {
          animation: ledPulse 1s ease-in-out infinite;
        }

        @keyframes pointerGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px #FCD34D) drop-shadow(0 0 24px #FCA5A5);
          }
          50% {
            filter: drop-shadow(0 0 18px #FCD34D) drop-shadow(0 0 36px #FCA5A5);
          }
        }

        .pointer-glow {
          animation: pointerGlow 1.5s ease-in-out infinite;
        }

        @keyframes wheelGlow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(252, 211, 77, 0.3), 0 0 80px rgba(252, 165, 165, 0.2);
          }
          50% {
            box-shadow: 0 0 60px rgba(252, 211, 77, 0.5), 0 0 120px rgba(252, 165, 165, 0.3);
          }
        }

        .wheel-glow {
          animation: wheelGlow 3s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={() => router.push("/")}
        className="absolute animate-bounce top-20 left-20 h-16 w-16 z-20 hover:scale-110 transition-transform"
      >
        <img src="/images/home.png" alt="Home" />
      </button>

      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-20"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          >
            <Star className="text-yellow-400 w-2 h-2" />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-yellow-400 w-10 h-10 animate-spin" />
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent leading-16!">
              Quay Thưởng
            </h1>
            <Sparkles className="text-yellow-400 w-10 h-10 animate-spin" />
          </div>
          <p className="text-xl text-gray-300 font-medium">
            Nhấn nút quay để nhận ngay phần thưởng!
          </p>
        </div>

        <div className="relative w-full flex flex-col items-center justify-center">
          {/* POINTER - SỬA LẠI */}
          <div className="absolute top-0 z-40 left-1/2 transform -translate-x-1/2 -mt-1 pointer-glow">
            <div className="relative flex flex-col items-center">
              {/* Outer glow circle */}
              <div className="absolute -inset-4 bg-gradient-to-b from-red-300/60 via-red-300/30 to-transparent rounded-full blur-2xl" />

              {/* Main pointer arrow - CHỈ XUỐNG */}
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                className="relative z-10 drop-shadow-2xl"
              >
                <defs>
                  <linearGradient
                    id="arrowGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
                    <stop offset="50%" stopColor="#FBBF24" stopOpacity="1" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                  </linearGradient>
                  <filter id="arrowShadow">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                  </filter>
                </defs>

                {/* Arrow triangle - HƯỚNG XUỐNG (2,46 trái, 46,46 phải, 24,2 trên) */}
                <polygon
                  points="24,46 2,2 46,2"
                  fill="url(#arrowGradient)"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="url(#arrowShadow)"
                />

                {/* Shine effect */}
                <polygon
                  points="24,46 2,2 46,2"
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity="0.8"
                />
              </svg>

              {/* Bottom glow */}
              <div className="absolute top-12 -inset-6 bg-gradient-to-b from-yellow-400/40 to-transparent rounded-full blur-2xl" />
            </div>
          </div>
          {/* Wheel */}
          <div className="relative aspect-square  h-[50vh]  mx-auto">
            {/* LED Lights Ring */}
            <div className="absolute inset-0 led-lights">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360;
                const colors = [
                  "#FF6B6B",
                  "#4ECDC4",
                  "#FFE66D",
                  "#F38181",
                  "#FCD34D",
                  "#FF8B7A",
                ];
                const color = colors[i % colors.length];
                return (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full led-light"
                    style={{
                      background: color,
                      top: "50%",
                      left: "50%",
                      // SỬA: Dùng calc để tính dựa trên kích thước container
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-50% - 245px))`,
                      boxShadow: `0 0 10px ${color}`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* WHEEL CONTAINER */}
            <div
              ref={wheelRef}
              className="absolute inset-0 rounded-full shadow-2xl wheel-glow"
              style={{
                willChange: "transform",
              }}
            >
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full absolute inset-0"
                style={{ filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.5))" }}
              >
                <defs>
                  {prizes.map((prize, index) => (
                    <linearGradient
                      key={`grad-${index}`}
                      id={`grad-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={prizeColors[index % prizeColors.length].from}
                      />
                      <stop
                        offset="100%"
                        stopColor={prizeColors[index % prizeColors.length].to}
                      />
                    </linearGradient>
                  ))}
                </defs>

                {prizes.map((prize, index) => {
                  const startAngle = (index * segmentAngle * Math.PI) / 180;
                  const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180;
                  const midAngle = (startAngle + endAngle) / 2;

                  const x1 = 200 + 190 * Math.cos(startAngle - Math.PI / 2);
                  const y1 = 200 + 190 * Math.sin(startAngle - Math.PI / 2);
                  const x2 = 200 + 190 * Math.cos(endAngle - Math.PI / 2);
                  const y2 = 200 + 190 * Math.sin(endAngle - Math.PI / 2);

                  const largeArc = segmentAngle > 180 ? 1 : 0;

                  const pathData = [
                    `M 200 200`,
                    `L ${x1} ${y1}`,
                    `A 190 190 0 ${largeArc} 1 ${x2} ${y2}`,
                    `Z`,
                  ].join(" ");

                  const textRadius = 130;
                  const textX =
                    200 + textRadius * Math.cos(midAngle - Math.PI / 2);
                  const textY =
                    200 + textRadius * Math.sin(midAngle - Math.PI / 2);

                  const textRotation = (midAngle * 180) / Math.PI - 90;

                  return (
                    <g key={prize.id}>
                      <path
                        d={pathData}
                        fill={`url(#grad-${index})`}
                        stroke="white"
                        strokeWidth="3"
                      />

                      <g
                        transform={`translate(${textX}, ${textY}) rotate(${textRotation})`}
                      >
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={prizeColors[index % prizeColors.length].text}
                          fontSize="16"
                          fontWeight="bold"
                          style={{
                            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            fontFamily: "Arial, sans-serif",
                            letterSpacing: "0.5px",
                            pointerEvents: "none",
                          }}
                        >
                          <tspan x="0" dy="0">
                            {prize.name.length > 15
                              ? prize.name.substring(0, 12) + "..."
                              : prize.name}
                          </tspan>
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute inset-0 rounded-full border-8 border-white/50 pointer-events-none shadow-inner" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 rounded-full shadow-2xl border-4 border-white flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/30"></div>
                  <div className="absolute inset-1 rounded-full border-2 border-white/50"></div>
                  <Gift className="w-16 h-16 text-white animate-bounce relative z-10" />
                </div>
              </div>
            </div>

            <div className="absolute -inset-8 rounded-full border-2 border-yellow-300/20 pointer-events-none animate-pulse" />
          </div>
          <div className="mt-12 mb-8">
            <button
              onClick={spin}
              disabled={spinning || loadingPrizes}
              className={`
                px-12 py-4 rounded-full font-bold text-2xl text-white transition-all duration-300 transform relative overflow-hidden shadow-2xl
                ${
                  spinning || loadingPrizes
                    ? "bg-gray-500 cursor-not-allowed scale-95"
                    : "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 hover:scale-110 active:scale-95 shadow-pink-500/50 hover:shadow-pink-500/70"
                }
              `}
            >
              {spinning ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Đang quay...
                </span>
              ) : loadingPrizes ? (
                "Đang tải..."
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  🎉 QUAY NGAY
                  <Sparkles className="w-6 h-6" />
                </span>
              )}
              {!spinning && !loadingPrizes && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 to-yellow-400/20 animate-pulse" />
              )}
            </button>
          </div>
          {resultIndex !== null && showCongrats && (
            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 shadow-2xl border-4 border-yellow-400 animate-bounce">
                <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-2">
                  🎁 CHÚC MỪNG!
                </div>
                <div className="text-xl text-white font-semibold">
                  Bạn trúng: {prizes[resultIndex]?.name}
                </div>
              </div>

              <div className="fixed inset-0 pointer-events-none">
                {confetti.map((c, i) => (
                  <div
                    key={i}
                    className="absolute animate-bounce text-4xl"
                    style={{
                      left: c.left,
                      top: c.top,
                      animationDelay: c.delay,
                      animationDuration: c.duration,
                    }}
                  >
                    {c.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}
          <PrizeModal
            isOpen={openModalPrize}
            onClose={() => setOpenModalPrize(false)}
            prize={prizes[resultIndex ?? 0] ?? ""}
          />
          <AlreadySpunModal
            isOpen={openAlreadySpunModal}
            message="Bạn đã quay rồi. Quay lại lần khác nhé!"
            onClose={() => setAlreadySpunModal(false)}
          />
          <LoadingModal isOpen={loading} />
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-lg">
              {spinning ? (
                <span className="text-yellow-400 font-semibold animate-pulse">
                  ⏳ Đang xử lý... Vui lòng chờ kết quả!
                </span>
              ) : loadingPrizes ? (
                <span className="text-blue-400 font-semibold animate-pulse">
                  ⏳ Đang tải phần thưởng...
                </span>
              ) : (
                "🎯 Nhấn nút quay để tham gia và nhận thưởng ngay!"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
