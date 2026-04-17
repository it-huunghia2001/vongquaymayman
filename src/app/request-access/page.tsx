/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // Đảm bảo bạn đã cài: npm install uuid @types/uuid

export default function RequestAccessPage() {
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "LOADING">("IDLE");
  const [requesterName, setRequesterName] = useState("");
  const [currentFingerprint, setCurrentFingerprint] = useState("");

  // Khởi tạo fingerprint ngay khi vào trang
  useEffect(() => {
    let deviceKey = localStorage.getItem("deviceKey");
    if (!deviceKey) {
      deviceKey = uuidv4();
      localStorage.setItem("deviceKey", deviceKey);
    }
    setCurrentFingerprint(deviceKey);

    // Luôn đảm bảo Cookie khớp với localStorage để Middleware không bị "mù"
    document.cookie = `device_fingerprint=${deviceKey}; path=/; max-age=31536000; SameSite=Strict`;
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim()) return alert("Vui lòng nhập tên của bạn");

    setStatus("LOADING");

    try {
      const res = await fetch("/api/devices/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: currentFingerprint, // Dùng UUID xịn bạn vừa lấy
          deviceName: `${requesterName.trim()} (${navigator.platform})`,
        }),
      });

      if (res.ok) {
        // Ghi đè lại cookie lần nữa cho chắc chắn
        document.cookie = `device_fingerprint=${currentFingerprint}; path=/; max-age=31536000; SameSite=Strict`;
        setStatus("PENDING");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Có lỗi xảy ra, vui lòng thử lại.");
        setStatus("IDLE");
      }
    } catch (error) {
      setStatus("IDLE");
      alert("Lỗi kết nối server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Xác thực thiết bị
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Hệ thống cần xác nhận danh tính máy tính này trước khi cho phép truy
            cập.
          </p>
        </div>

        {status === "IDLE" || status === "LOADING" ? (
          <form onSubmit={handleRequest} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ và tên người sử dụng máy
              </label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                Mã định danh máy (UUID)
              </p>
              <p className="text-[11px] font-mono text-gray-600 break-all">
                {currentFingerprint || "Đang tạo..."}
              </p>
            </div>

            <button
              type="submit"
              disabled={status === "LOADING" || !currentFingerprint}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
                status === "LOADING"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
              }`}
            >
              {status === "LOADING"
                ? "Đang gửi yêu cầu..."
                : "Gửi yêu cầu cấp quyền"}
            </button>
          </form>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl mb-6">
              <div className="flex">
                <div className="flex-shrink-0 text-emerald-500">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-emerald-800 font-bold">
                    Yêu cầu đã được gửi!
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Mã máy <strong>{currentFingerprint.slice(0, 8)}...</strong>{" "}
                    đang chờ duyệt.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm">
                Vui lòng báo cho <strong>Admin</strong> để phê duyệt thiết bị
                này.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-indigo-600 text-xs font-bold hover:underline"
              >
                Tôi đã được duyệt, vào trang chủ ngay
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="flex justify-center items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
              Secure Hardware Auth v2.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
