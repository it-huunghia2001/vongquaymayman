/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { LoadingModal } from "@/components/modalLoading";
export default function Home() {
  const [licensePlate2, setLicensePlate2] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      let deviceKey = localStorage.getItem("deviceKey");
      if (!deviceKey) {
        deviceKey = uuidv4();
        localStorage.setItem("deviceKey", deviceKey);
      }
      const licensePlate = licensePlate2.replace(/[^a-zA-Z0-9]/g, "");
      // ✅ Kiểm tra định dạng số điện thoại Việt Nam: 10–11 số bắt đầu bằng 0
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phone)) {
        setErr("Số điện thoại không hợp lệ.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, licensePlate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.message || "Đã có lỗi xảy ra từ máy chủ.");
      } else if (data.allowed) {
        router.push(`/spin?phone=${phone}&plateNumber=${licensePlate}`);
      } else {
        setErr(data.message || "Bạn không được phép tham gia.");
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      setErr("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-lottery-primary via-lottery-secondary to-lottery-accent">
      <LoadingModal isOpen={loading} />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lottery-glow rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-lottery-secondary rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lottery-glow rounded-full blur-3xl opacity-10 animate-spin-slow"></div>
      </div>

      {/* Floating Coins Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-8 h-8 bg-lottery-coin rounded-full animate-float delay-0"></div>
        <div className="absolute top-32 right-20 w-6 h-6 bg-lottery-coin rounded-full animate-float delay-500"></div>
        <div className="absolute bottom-40 left-20 w-10 h-10 bg-lottery-coin rounded-full animate-float delay-1000"></div>
        <div className="absolute bottom-20 right-10 w-7 h-7 bg-lottery-coin rounded-full animate-float delay-1500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              <h1 className="text-5xl font-black text-lottery-text mb-2 animate-glow text-nowrap">
                🎰 QUAY THƯỞNG
              </h1>
              <div className="absolute -inset-2 bg-lottery-glow rounded-lg blur opacity-20 animate-pulse"></div>
            </div>
            <p className="text-lottery-text-secondary text-lg font-semibold mt-4 animate-fade-in-up delay-500">
              Nhập thông tin để tham gia ngay!
            </p>
          </div>

          {/* Form Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-lottery-glow to-lottery-secondary rounded-2xl blur opacity-75 animate-pulse"></div>
            <form
              onSubmit={handleSubmit}
              className="relative bg-lottery-card backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-lottery-border space-y-6"
            >
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-lottery-text font-bold mb-2 text-sm uppercase tracking-wide">
                    👤 Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-lottery-input border-2 border-lottery-border rounded-xl focus:outline-none focus:border-lottery-glow focus:ring-2 focus:ring-lottery-glow/20 text-lottery-text font-semibold placeholder-lottery-text-secondary/60 transition-all duration-300"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>

                <div className="relative">
                  <label className="block text-lottery-text font-bold mb-2 text-sm uppercase tracking-wide">
                    🚗 Số Hợp Đồng
                  </label>
                  <input
                    type="text"
                    required
                    value={licensePlate2}
                    onChange={(e) => setLicensePlate2(e.target.value)}
                    className="w-full px-4 py-3 bg-lottery-input border-2 border-lottery-border rounded-xl focus:outline-none focus:border-lottery-glow focus:ring-2 focus:ring-lottery-glow/20 text-lottery-text font-semibold placeholder-lottery-text-secondary/60 transition-all duration-300"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>

                <div className="relative">
                  <label className="block text-lottery-text font-bold mb-2 text-sm uppercase tracking-wide">
                    📱 Số điện thoại
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-lottery-input border-2 border-lottery-border rounded-xl focus:outline-none focus:border-lottery-glow focus:ring-2 focus:ring-lottery-glow/20 text-lottery-text font-semibold placeholder-lottery-text-secondary/60 transition-all duration-300"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              {err && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 animate-shake">
                  <p className="text-red-500 text-sm text-center font-semibold">
                    ⚠️ {err}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-lottery-button-start to-lottery-button-end hover:from-lottery-button-end hover:to-lottery-button-start text-lottery-button-text font-black py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative text-xl uppercase tracking-wider">
                  🎯 Tham Gia Ngay
                </span>
              </button>

              {/* Decorative Elements */}
              <div className="flex justify-center space-x-4 pt-4">
                <div className="w-2 h-2 bg-lottery-glow rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-lottery-glow rounded-full animate-ping delay-200"></div>
                <div className="w-2 h-2 bg-lottery-glow rounded-full animate-ping delay-400"></div>
              </div>
            </form>
          </div>

          {/* Bottom Text */}
          <div className="text-center mt-6">
            <p className="text-lottery-text-secondary font-semibold animate-fade-in-up delay-1000">
              ✨ Cơ hội trúng thưởng lớn đang chờ bạn! ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
