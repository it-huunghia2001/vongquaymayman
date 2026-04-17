/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";

export default function PendingDevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    const res = await fetch("/api/devices/pending");
    const data = await res.json();
    if (Array.isArray(data)) setDevices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await fetch("/api/devices/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "APPROVED" }),
    });

    if (res.ok) {
      // Xóa máy vừa duyệt khỏi danh sách hiển thị
      setDevices(devices.filter((d) => d.id !== id));
      alert("Đã duyệt thiết bị thành công!");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Danh sách chờ duyệt ({devices.length})
        </h1>
        <button
          onClick={fetchPending}
          className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
        >
          Làm mới
        </button>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : devices.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">Không có thiết bị nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-bold text-gray-900">
                  {device.deviceName || "Thiết bị không tên"}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  ID: {device.deviceFingerprint}
                </p>
                <p className="text-xs text-blue-500 mt-1 italic">
                  Yêu cầu lúc:{" "}
                  {new Date(device.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(device.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Duyệt máy này
                </button>
                <button
                  onClick={async () => {
                    await fetch("/api/devices/update", {
                      method: "POST",
                      body: JSON.stringify({
                        id: device.id,
                        status: "REJECTED",
                      }),
                    });
                    fetchPending();
                  }}
                  className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
