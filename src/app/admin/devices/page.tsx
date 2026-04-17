/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";

export default function AdminDeviceManager() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null); // Trạng thái xử lý từng dòng

  // 1. Lấy danh sách thiết bị
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices/list");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // 2. Hàm Duyệt hoặc Chặn
  const handleAction = async (id: string, status: string) => {
    setActionId(id);
    try {
      const res = await fetch("/api/devices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await fetchDevices();
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái");
    } finally {
      setActionId(null);
    }
  };

  // 3. Hàm Xóa thiết bị
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa thiết bị này? Người dùng sẽ phải gửi lại yêu cầu từ đầu.",
      )
    )
      return;

    setActionId(id);
    try {
      const res = await fetch(`/api/devices/delete?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRequests(requests.filter((item) => item.id !== id));
      } else {
        alert("Không thể xóa thiết bị");
      }
    } catch (error) {
      alert("Lỗi kết nối");
    } finally {
      setActionId(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Quản lý thiết bị
            </h1>
            <p className="text-gray-500 mt-1">
              Duyệt hoặc chặn quyền truy cập theo ID phần cứng.
            </p>
          </div>
          <button
            onClick={fetchDevices}
            className="p-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-all"
            title="Làm mới"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="p-5">Người dùng / Thiết bị</th>
                  <th className="p-5 text-center">Trạng thái</th>
                  <th className="p-5">Mã Fingerprint (UUID)</th>
                  <th className="p-5">Ngày yêu cầu</th>
                  <th className="p-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((dev) => (
                  <tr
                    key={dev.id}
                    className={`hover:bg-indigo-50/30 transition-colors ${actionId === dev.id ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <td className="p-5">
                      <div className="font-bold text-gray-800">
                        {dev.deviceName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-1 italic">
                        Internal ID: {dev.id}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          dev.status === "APPROVED"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : dev.status === "REJECTED"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            dev.status === "APPROVED"
                              ? "bg-green-500"
                              : dev.status === "REJECTED"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        ></span>
                        {dev.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <code className="text-[11px] bg-gray-100 p-1 px-2 rounded text-indigo-600 font-mono">
                        {dev.deviceFingerprint}
                      </code>
                    </td>
                    <td className="p-5 text-sm text-gray-500">
                      {new Date(dev.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end space-x-2">
                        {dev.status !== "APPROVED" && (
                          <button
                            onClick={() => handleAction(dev.id, "APPROVED")}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all"
                          >
                            Duyệt
                          </button>
                        )}
                        {dev.status !== "REJECTED" && (
                          <button
                            onClick={() => handleAction(dev.id, "REJECTED")}
                            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                          >
                            Chặn
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(dev.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Xóa vĩnh viễn"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-200 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-gray-400 text-lg">
                          Chưa có yêu cầu truy cập nào.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-center text-gray-400 text-[10px] mt-8 uppercase tracking-widest font-bold">
          © 2026 Hardware Security Management System
        </p>
      </div>
    </div>
  );
}
