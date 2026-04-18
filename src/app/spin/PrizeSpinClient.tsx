"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PrizeModal } from "@/components/modal-prizes";
import { AlreadySpunModal } from "@/components/alreadySpunModal";
import { LoadingModal } from "@/components/modalLoading";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Prize = { id: number; name: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const SEGMENT_COLORS: { from: string; to: string }[] = [
  { from: "#FF6B6B", to: "#C0392B" },
  { from: "#4834D4", to: "#6C5CE7" },
  { from: "#F9CA24", to: "#F0932B" },
  { from: "#6AB04C", to: "#1E9E5E" },
  { from: "#E056BD", to: "#BE2EDD" },
  { from: "#22A6B3", to: "#0097A7" },
  { from: "#EB4D4B", to: "#C0392B" },
  { from: "#F9CA24", to: "#E67E22" },
  { from: "#686DE0", to: "#4834D4" },
  { from: "#6AB04C", to: "#27AE60" },
];

const SPIN_DURATION = 5000; // ms
const SPIN_REVOLUTIONS = 6;

// ─── Audio helpers ─────────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx)
    _audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  return _audioCtx;
}

function playTick(speed: number) {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 500 + speed * 300;
    o.type = "triangle";
    const vol = Math.min(0.12, 0.04 + speed * 0.08);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.04);
  } catch (_) {}
}

function playWhoosh() {
  try {
    const ctx = getAudioCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.setValueAtTime(2500, ctx.currentTime);
    filt.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.6);
    filt.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 0.6);
  } catch (_) {}
}

function playFanfare() {
  try {
    const ctx = getAudioCtx();
    const melody = [523, 659, 784, 1047, 784, 1047, 1319, 1047];
    const timing = [0, 0.1, 0.2, 0.35, 0.52, 0.62, 0.76, 0.9];
    melody.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = "triangle";
      const t = ctx.currentTime + timing[i];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t);
      o.stop(t + 0.24);
    });
  } catch (_) {}
}

// ─── Easing ───────────────────────────────────────────────────────────────────

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// ─── Draw wheel on canvas ─────────────────────────────────────────────────────

function drawWheel(
  canvas: HTMLCanvasElement,
  prizes: Prize[],
  angleOffset: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const CX = W / 2;
  const CY = H / 2;
  const R = W / 2 - 4;
  const N = prizes.length;
  if (N === 0) return;

  const SEG = (2 * Math.PI) / N;
  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < N; i++) {
    const startA = angleOffset + i * SEG - Math.PI / 2;
    const endA = startA + SEG;
    const midA = (startA + endA) / 2;
    const c = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // --- Gradient fill ---
    const grd = ctx.createLinearGradient(
      CX + R * 0.2 * Math.cos(midA),
      CY + R * 0.2 * Math.sin(midA),
      CX + R * Math.cos(midA),
      CY + R * Math.sin(midA),
    );
    grd.addColorStop(0, c.from + "DD");
    grd.addColorStop(1, c.to);

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, startA, endA);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();

    // --- Segment border ---
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // --- Subtle radial shine ---
    const shineGrd = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    shineGrd.addColorStop(0, "rgba(255,255,255,0.18)");
    shineGrd.addColorStop(0.5, "rgba(255,255,255,0.04)");
    shineGrd.addColorStop(1, "rgba(0,0,0,0.1)");
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, startA, endA);
    ctx.closePath();
    ctx.fillStyle = shineGrd;
    ctx.fill();

    // --- Text along radius ---
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(midA); // Xoay theo trục nan quạt

    // Cấu hình khoảng cách
    const marginOuter = 30; // Cách rìa ngoài 30px
    const hubSafeZone = 65; // Khoảng cách an toàn tính từ tâm (không đè lên hub)

    // Vị trí bắt đầu vẽ (sát rìa ngoài)
    const startX = R - marginOuter;
    // Độ dài tối đa của chữ để không chạm vào hub
    const maxTextWidth = startX - hubSafeZone;

    ctx.textAlign = "right"; // Chữ bám lề phải (từ ngoài hướng vào)
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 15px "Nunito", sans-serif`;

    // Đổ bóng cho chữ sắc nét
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;

    let displayName = prizes[i].name;

    // Check độ dài và cắt chữ bằng "..."
    if (ctx.measureText(displayName).width > maxTextWidth) {
      while (
        ctx.measureText(displayName + "...").width > maxTextWidth &&
        displayName.length > 0
      ) {
        displayName = displayName.slice(0, -1);
      }
      displayName += "...";
    }

    // Vẽ tại vị trí startX, chữ sẽ tự động kéo dài về hướng tâm
    ctx.fillText(displayName, startX, 0);

    ctx.restore();
  }

  // --- Outer ring ---
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // --- Gold outer border ---
  ctx.beginPath();
  ctx.arc(CX, CY, R + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrizeSpinClient() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [openModalPrize, setOpenModalPrize] = useState(false);
  const [openAlreadySpunModal, setAlreadySpunModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0); // current canvas angle in radians
  const rafRef = useRef<number>(0);
  const lastTickSegRef = useRef(-1);
  const soundEnabledRef = useRef(true);

  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const plateNumber = searchParams.get("plateNumber");
  const router = useRouter();

  // Sync ref with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ── Load prizes ──────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/prizes");
        const data: Prize[] = await res.json();
        setPrizes(data);
      } catch (err) {
        console.error("Lỗi khi load prizes:", err);
      } finally {
        setLoadingPrizes(false);
      }
    })();
  }, []);
  const handleCloseModal = () => {
    setOpenModalPrize(false);
    // Reset góc về 0 để quay ván mới từ đầu
    angleRef.current = 0;
    if (canvasRef.current) {
      drawWheel(canvasRef.current, prizes, 0);
    }
  };
  const spinTest = useCallback(() => {
    if (spinning || prizes.length === 0) return;

    setSpinning(true);
    setResultIndex(null);
    setShowCongrats(false);

    if (soundEnabledRef.current) playWhoosh();

    // Giả lập chọn phần thưởng ngẫu nhiên từ danh sách local
    const index = Math.floor(Math.random() * prizes.length);

    // Tính toán góc quay tương tự logic cũ
    const N = prizes.length;
    const SEG = (2 * Math.PI) / N;
    const segCenterAngle = index * SEG + SEG / 2;
    const targetOffset = 2 * Math.PI - segCenterAngle;
    const totalRad = SPIN_REVOLUTIONS * 2 * Math.PI + targetOffset;

    const startAngle = angleRef.current;
    const startTime = performance.now();
    lastTickSegRef.current = -1;

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = easeOutQuart(t);

      // totalRad là tổng góc quay, eased chạy từ 0 -> 1
      const currentRotation = totalRad * eased;

      // Góc hiển thị trên Canvas = Góc bắt đầu + Lượng vừa quay
      const displayAngle = startAngle + currentRotation;
      angleRef.current = displayAngle;

      if (canvasRef.current) {
        drawWheel(canvasRef.current, prizes, displayAngle);
      }

      // --- Logic Sound giữ nguyên ---
      if (soundEnabledRef.current) {
        const speed = 1 - t;
        // Chỉnh lại công thức tính segIdx để tiếng tick khớp với kim ở đỉnh
        const N = prizes.length;
        const deg = ((displayAngle * 180) / Math.PI + 90) % 360;
        const segIdx = Math.floor((360 - (deg % 360)) / (360 / N)) % N;

        if (segIdx !== lastTickSegRef.current) {
          playTick(speed);
          lastTickSegRef.current = segIdx;
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // KẾT THÚC: Đây là phần quan quan trọng nhất để reset
        // Đưa góc về trong khoảng 0 đến 2π để lần quay sau không bị lệch
        angleRef.current = displayAngle % (2 * Math.PI);

        setResultIndex(index);
        setSpinning(false);
        setShowCongrats(true);
        setTimeout(() => setOpenModalPrize(true), 600);
        if (soundEnabledRef.current) playFanfare();
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [spinning, prizes]);

  // ── Draw initial wheel ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current || prizes.length === 0) return;
    drawWheel(canvasRef.current, prizes, angleRef.current);
  }, [prizes]);

  // ── Keyboard shortcut ────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (spinning || loadingPrizes || prizes.length === 0) return;
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spinning, prizes, loadingPrizes]);

  // ── Spin logic ───────────────────────────────────────────────────────────────

  const spin = useCallback(async () => {
    if (spinning || !phone || prizes.length === 0) return;

    const deviceKey = localStorage.getItem("deviceKey");
    if (!deviceKey) {
      alert("Thiếu deviceKey. Vui lòng tải lại trang.");
      return;
    }

    setSpinning(true);
    setResultIndex(null);
    setLoading(true);
    setShowCongrats(false);

    if (soundEnabledRef.current) playWhoosh();

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, deviceKey, plateNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Lỗi máy chủ.");
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

      const prizeId: number = data.prizeId;
      const index = prizes.findIndex((p) => p.id === prizeId);
      if (index === -1) {
        alert("Phần thưởng không tồn tại.");
        setSpinning(false);
        setLoading(false);
        return;
      }

      setLoading(false);

      // ── Calculate target angle ──────────────────────────────────────────────
      // Pointer is at the top (−π/2 in canvas coords).
      // Segment i center is at: i * SEG + SEG/2  (from top, clockwise).
      // We need to rotate the wheel so segment i's center lands at top.
      // targetAngleRad = SPIN_REVOLUTIONS * 2π + (2π − (index * SEG + SEG/2))
      const N = prizes.length;
      const SEG = (2 * Math.PI) / N;
      const segCenterAngle = index * SEG + SEG / 2;
      const targetOffset = 2 * Math.PI - segCenterAngle;
      const totalRad = SPIN_REVOLUTIONS * 2 * Math.PI + targetOffset;

      // Animate
      const startAngle = angleRef.current;
      const startTime = performance.now();
      lastTickSegRef.current = -1;

      function animate(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / SPIN_DURATION, 1);
        const eased = easeOutQuart(t);
        const currentAngle = startAngle + totalRad * eased;
        angleRef.current = currentAngle;

        if (canvasRef.current) {
          drawWheel(canvasRef.current, prizes, currentAngle);
        }

        // Tick sound at each segment crossing
        if (soundEnabledRef.current) {
          const speed = 1 - t; // 1=fast start, 0=stopped
          const deg = ((currentAngle * 180) / Math.PI + 90 + 360) % 360;
          const segIdx = Math.floor(deg / (360 / N));
          if (segIdx !== lastTickSegRef.current) {
            playTick(speed);
            lastTickSegRef.current = segIdx;
          }
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          // 1. Tính toán lại góc thực tế trong vòng tròn 360 độ (0 đến 2π)
          // Điều này giúp lần quay sau bắt đầu từ vị trí hiện tại một cách chính xác
          angleRef.current = currentAngle % (2 * Math.PI);

          // 2. Các logic cũ của Nghĩa
          localStorage.setItem("hasSpun", "true");
          setResultIndex(index);
          setSpinning(false);
          setShowCongrats(true);

          setTimeout(() => {
            setOpenModalPrize(true);
          }, 600);

          if (soundEnabledRef.current) playFanfare();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối máy chủ.");
      setSpinning(false);
      setLoading(false);
    }
  }, [spinning, phone, prizes, plateNumber]);

  // Cleanup RAF on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ── Confetti ──────────────────────────────────────────────────────────────────

  const confettiItems = showCongrats
    ? Array.from({ length: 28 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.2}s`,
        dur: `${1.8 + Math.random() * 1.5}s`,
        color: [
          "#FFD700",
          "#FF6B9D",
          "#A78BFA",
          "#5352ED",
          "#2ED573",
          "#FFA502",
        ][i % 6],
      }))
    : [];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="spin-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;600;700;800;900&display=swap');

        .spin-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(120,40,200,0.35) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(255,60,130,0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(30,100,255,0.2) 0%, transparent 50%),
            linear-gradient(135deg, #0a0015 0%, #1a0533 40%, #0d0d2b 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 32px;
          font-family: 'Nunito', sans-serif;
        }

        /* ── Stars ── */
        .stars {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
        }
        .star {
          position: absolute; border-radius: 50%; background: white;
          animation: starTwinkle var(--dur, 3s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }
        @keyframes starTwinkle {
          0%,100%{ opacity:0; transform:scale(0.3) }
          50%{ opacity:var(--op,0.7); transform:scale(1) }
        }

        /* ── Home button ── */
        .home-btn {
          position: fixed; top: 20px; left: 20px; z-index: 50;
          width: 52px; height: 52px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .home-btn:hover { background: rgba(255,255,255,0.15); transform: scale(1.08); }
        .home-btn img { width: 28px; height: 28px; }

        /* ── Sound toggle ── */
        .sound-btn {
          position: fixed; top: 20px; right: 20px; z-index: 50;
          width: 52px; height: 52px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; font-size: 22px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .sound-btn:hover { background: rgba(255,255,255,0.15); transform: scale(1.08); }

        /* ── Title ── */
        .page-title {
          position: relative; z-index: 2;
          text-align: center; margin-bottom: 8px;
        }
        .title-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.25);
          border-radius: 100px; padding: 5px 16px;
          font-size: 11px; font-weight: 700; letter-spacing: 2.5px;
          color: rgba(255,215,0,0.8); text-transform: uppercase;
          margin-bottom: 12px;
        }
        .main-title {
          font-family: 'Lilita One', cursive;
          font-size: clamp(36px, 6vw, 56px); font-weight: 400;
          background: linear-gradient(135deg, #FFD700 0%, #FF8C69 40%, #FF6B9D 70%, #C084FC 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1; margin-bottom: 6px;
          filter: drop-shadow(0 4px 20px rgba(255,150,0,0.3));
        }
        .sub-title {
          color: rgba(255,255,255,0.5);
          font-size: 14px; font-weight: 600; letter-spacing: 0.5px;
        }

        /* ── Wheel wrapper ── */
        .wheel-section {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; align-items: center;
          margin-top: 4px;
        }

        /* Pointer */
        .pointer-container {
          position: relative; z-index: 10;
          margin-bottom: -18px;
          filter:
            drop-shadow(0 0 10px rgba(255,215,0,0.9))
            drop-shadow(0 0 25px rgba(255,100,0,0.5));
          animation: pointerPulse 2s ease-in-out infinite;
        }
        @keyframes pointerPulse {
          0%,100%{ filter: drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 6px 12px rgba(0,0,0,0.5)) }
          50%{ filter: drop-shadow(0 0 20px rgba(255,215,0,1)) drop-shadow(0 0 40px rgba(255,100,0,0.6)) drop-shadow(0 6px 12px rgba(0,0,0,0.5)) }
        }

        /* LED ring */
        .led-ring-wrap {
          position: absolute; inset: -18px; border-radius: 50%;
          animation: rotateLeds 5s linear infinite;
          pointer-events: none; z-index: 4;
        }
        @keyframes rotateLeds { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .led-dot {
          position: absolute; width: 9px; height: 9px; border-radius: 50%;
          animation: ledBlink var(--bd, 1s) var(--bdelay, 0s) ease-in-out infinite;
        }
        @keyframes ledBlink { 0%,100%{opacity:0.2;transform:translate(-50%,-50%) scale(0.7)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1)} }

        /* Canvas */
        .wheel-canvas-wrap {
          position: relative;
          width: min(420px, 84vw);
          height: min(420px, 84vw);
        }
        .wheel-canvas {
          width: 100%; height: 100%;
          border-radius: 50%;
          display: block;
          box-shadow:
            0 0 0 6px rgba(255,215,0,0.25),
            0 0 40px rgba(255,215,0,0.2),
            0 0 80px rgba(180,80,255,0.15),
            0 20px 60px rgba(0,0,0,0.6);
        }
        .wheel-canvas.spinning {
          box-shadow:
            0 0 0 6px rgba(255,215,0,0.5),
            0 0 60px rgba(255,215,0,0.4),
            0 0 120px rgba(255,100,0,0.3),
            0 20px 60px rgba(0,0,0,0.6);
        }

        /* Center hub */
        .center-hub {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: min(88px, 21vw); height: min(88px, 21vw);
          border-radius: 50%;
          background: conic-gradient(from 45deg, #FF9500, #FFE066, #FF9500, #CC6200, #FF9500);
          border: 4px solid rgba(255,255,255,0.95);
          box-shadow:
            0 0 0 3px rgba(255,180,0,0.4),
            0 0 20px rgba(255,180,0,0.7),
            inset 0 2px 6px rgba(255,255,255,0.6),
            inset 0 -2px 4px rgba(0,0,0,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: min(36px, 8vw);
          z-index: 5;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: hubGlow 2.5s ease-in-out infinite;
          user-select: none;
        }
        .center-hub:hover:not(.disabled) {
          transform: translate(-50%, -50%) scale(1.1);
        }
        .center-hub.disabled { cursor: not-allowed; animation: none; }
        @keyframes hubGlow {
          0%,100%{ box-shadow: 0 0 0 3px rgba(255,180,0,0.4), 0 0 20px rgba(255,180,0,0.7), inset 0 2px 6px rgba(255,255,255,0.6) }
          50%{ box-shadow: 0 0 0 6px rgba(255,180,0,0.3), 0 0 40px rgba(255,180,0,1), 0 0 70px rgba(255,100,0,0.4), inset 0 2px 6px rgba(255,255,255,0.6) }
        }

        /* ── Spin button ── */
        .spin-btn-wrap { margin-top: 28px; }
        .spin-btn {
          position: relative; overflow: hidden;
          padding: 16px 56px;
          border: none; border-radius: 100px;
          font-family: 'Lilita One', cursive;
          font-size: 22px; font-weight: 400;
          color: white; cursor: pointer;
          background: linear-gradient(135deg, #FF1F6B 0%, #FF4E00 50%, #FFB300 100%);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.1),
            0 8px 32px rgba(255,80,0,0.6),
            0 2px 0 rgba(0,0,0,0.3) inset;
          transition: all 0.2s;
          letter-spacing: 1px;
        }
        .spin-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 60%);
          pointer-events: none;
        }
        .spin-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 120%, rgba(255,255,255,0.15), transparent 70%);
          animation: btnShimmer 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes btnShimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .spin-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 12px 40px rgba(255,80,0,0.8);
        }
        .spin-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
        }
        .spin-btn:disabled {
          background: linear-gradient(135deg, #3a3a4a, #2a2a3a);
          box-shadow: none; cursor: not-allowed;
        }
        .spin-btn-inner {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; position: relative; z-index: 1;
        }
        .spinner-ring {
          width: 22px; height: 22px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spinRing 0.7s linear infinite;
        }
        @keyframes spinRing { to{transform:rotate(360deg)} }

        /* ── Status text ── */
        .status-text {
          margin-top: 18px; text-align: center;
          font-size: 14px; font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.3px; position: relative; z-index: 2;
        }
        .status-text.spinning-status { color: #FFD700; animation: pulse 1.2s ease-in-out infinite; }
        .status-text.loading-status { color: #818CF8; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }

        /* ── Congrats banner ── */
        .congrats-wrap {
          position: relative; z-index: 2;
          margin-top: 20px;
          animation: bannerIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes bannerIn { from{opacity:0;transform:scale(0.4) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .congrats-card {
          background: linear-gradient(135deg,
            rgba(255,215,0,0.12) 0%,
            rgba(255,100,150,0.08) 50%,
            rgba(100,80,255,0.12) 100%);
          border: 1.5px solid rgba(255,215,0,0.4);
          border-radius: 20px;
          padding: 20px 36px;
          text-align: center;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 60px rgba(255,215,0,0.1), 0 20px 40px rgba(0,0,0,0.3);
        }
        .congrats-trophy { font-size: 36px; margin-bottom: 6px; }
        .congrats-label {
          font-family: 'Lilita One', cursive;
          font-size: 13px; letter-spacing: 3px;
          color: rgba(255,215,0,0.7); text-transform: uppercase; margin-bottom: 4px;
        }
        .congrats-name {
          font-family: 'Lilita One', cursive;
          font-size: 26px;
          background: linear-gradient(135deg, #FFD700, #FF8C69);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 8px rgba(255,180,0,0.5));
        }

        /* ── Confetti ── */
        .confetti-piece {
          position: fixed;
          width: 10px; height: 10px;
          animation: confettiFall var(--cdur, 3s) var(--cdelay, 0s) linear forwards;
          pointer-events: none; z-index: 100;
        }
        @keyframes confettiFall {
          0%{ transform: translateY(-30px) rotate(0deg) scale(1); opacity: 1; }
          100%{ transform: translateY(110vh) rotate(900deg) scale(0.2); opacity: 0; }
        }
      `}</style>

      {/* ── Fixed stars bg ── */}
      <div className="stars" aria-hidden>
        {Array.from({ length: 70 }).map((_, i) => {
          const size = 1 + Math.random() * 3;
          return (
            <div
              key={i}
              className="star"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                ["--dur" as string]: `${2 + Math.random() * 4}s`,
                ["--delay" as string]: `${Math.random() * 6}s`,
                ["--op" as string]: `${0.3 + Math.random() * 0.7}`,
              }}
            />
          );
        })}
      </div>

      {/* ── Home ── */}
      <button
        className="home-btn"
        onClick={() => router.push("/")}
        aria-label="Về trang chủ"
      >
        <img src="/images/home.png" alt="Home" />
      </button>

      {/* ── Sound ── */}
      <button
        className="sound-btn"
        onClick={() => setSoundEnabled((v) => !v)}
        aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
      >
        {soundEnabled ? "🔊" : "🔇"}
      </button>

      {/* ── Title ── */}
      <div className="page-title">
        <div className="title-badge">✦ Sự kiện may mắn ✦</div>
        <h1 className="main-title">Vòng Quay</h1>
        <p className="sub-title">Quay ngay để nhận phần thưởng hấp dẫn!</p>
      </div>

      {/* ── Wheel section ── */}
      <div className="wheel-section">
        {/* Pointer */}
        <div className="pointer-container" aria-hidden>
          <svg width="46" height="54" viewBox="0 0 46 54">
            <defs>
              <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE566" />
                <stop offset="60%" stopColor="#FFAA00" />
                <stop offset="100%" stopColor="#CC6600" />
              </linearGradient>
            </defs>
            <polygon
              points="23,52 3,6 43,6"
              fill="url(#pGrad)"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="23,38 11,12 35,12"
              fill="rgba(255,255,255,0.22)"
              strokeWidth="0"
            />
          </svg>
        </div>

        {/* Wheel + LED ring */}
        <div className="wheel-canvas-wrap">
          {/* LED ring */}
          <div className="led-ring-wrap" aria-hidden>
            {Array.from({ length: 32 }).map((_, i) => {
              const colors = [
                "#FF6B6B",
                "#FFD700",
                "#5352ED",
                "#2ED573",
                "#FF4F96",
                "#00D2D3",
                "#F9CA24",
              ];
              const color = colors[i % colors.length];
              const angleDeg = (i / 32) * 360 - 90;
              const rad = (angleDeg * Math.PI) / 180;
              const rPx = 222;
              const x = Math.cos(rad) * rPx;
              const y = Math.sin(rad) * rPx;
              return (
                <div
                  key={i}
                  className="led-dot"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px 2px ${color}88`,
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    ["--bd" as string]: `${0.7 + (i % 6) * 0.15}s`,
                    ["--bdelay" as string]: `${i * 0.045}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className={`wheel-canvas${spinning ? " spinning" : ""}`}
          />

          {/* Center hub */}
          <div
            className={`center-hub${spinning ? " disabled" : ""}`}
            // onClick={spin} // Đổi từ spin sang spinTest để test không tốn data API
            onClick={process.env.NODE_ENV === "development" ? spinTest : spin}
            role="button"
            aria-label="Quay"
          >
            {showCongrats ? "🎊" : "🎁"}
          </div>
        </div>

        {/* Spin button */}
        <div className="spin-btn-wrap">
          <button
            className="spin-btn"
            onClick={spin}
            disabled={spinning || loadingPrizes}
          >
            <span className="spin-btn-inner">
              {spinning ? (
                <>
                  <span className="spinner-ring" />
                  Đang quay...
                </>
              ) : loadingPrizes ? (
                <>
                  <span className="spinner-ring" />
                  Đang tải...
                </>
              ) : (
                <>✨ QUAY NGAY ✨</>
              )}
            </span>
          </button>
        </div>

        {/* Status */}
        <p
          className={`status-text${
            spinning
              ? " spinning-status"
              : loadingPrizes
                ? " loading-status"
                : ""
          }`}
        >
          {spinning
            ? "⏳ Đang xử lý... Vui lòng chờ!"
            : loadingPrizes
              ? "⏳ Đang tải phần thưởng..."
              : "🎯 Nhấn QUAY hoặc Space / Enter"}
        </p>

        {/* Congrats */}
        {resultIndex !== null && showCongrats && (
          <div className="congrats-wrap">
            <div className="congrats-card">
              <div className="congrats-trophy">🏆</div>
              <div className="congrats-label">Chúc mừng bạn đã trúng</div>
              <div className="congrats-name">{prizes[resultIndex]?.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Confetti */}
      {showCongrats &&
        confettiItems.map((c, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: c.left,
              top: "-30px",
              background: c.color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              ["--cdur" as string]: c.dur,
              ["--cdelay" as string]: c.delay,
            }}
          />
        ))}

      {/* Modals */}
      <PrizeModal
        isOpen={openModalPrize}
        onClose={handleCloseModal}
        prize={prizes[resultIndex ?? 0] ?? ""}
      />
      <AlreadySpunModal
        isOpen={openAlreadySpunModal}
        message="Bạn đã quay rồi. Quay lại lần khác nhé!"
        onClose={handleCloseModal}
      />
      <LoadingModal isOpen={loading} />
    </div>
  );
}
