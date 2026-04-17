/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { LoadingModal } from "@/components/modalLoading";
import Link from "next/link";
import { useEffect, useState } from "react";

type Prize = {
  id: number;
  name: string;
  ratio: number;
  quantity: number;
};

type User = {
  id: number;
  name: string;
  phone: string;
  licensePlate: string;
  prize: string | null;
  hasSpun: boolean;
  createdAt: string;
};

type PrizeStat = {
  name: string;
  ratio: number;
  used: number;
  remaining: number;
};

type Stats = {
  totalUsers: number;
  winners: number;
  percent: number;
  prizeStats: PrizeStat[];
};

// ─── Inline styles ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&display=swap');

  .adm-root * { box-sizing: border-box; }

  .adm-root {
    font-family: 'Be Vietnam Pro', sans-serif;
    background: #F5F4F1;
    min-height: 100vh;
    color: #1a1a1a;
  }

  /* ── Topbar ── */
  .adm-topbar {
    background: #fff;
    border-bottom: 1px solid #E8E6E0;
    padding: 0 28px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .adm-topbar-left { display: flex; align-items: center; gap: 12px; }
  .adm-logo {
    width: 32px; height: 32px;
    background: #0F6E56;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .adm-title { font-size: 15px; font-weight: 600; color: #111; }
  .adm-sub { font-size: 11px; color: #888; margin-top: 1px; }
  .adm-badge-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: #E1F5EE; color: #0F6E56;
    font-size: 11px; font-weight: 500;
    padding: 4px 10px; border-radius: 20px;
  }
  .adm-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #0F6E56;
    animation: adm-pulse 1.6s ease-in-out infinite;
  }
  @keyframes adm-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── Main content ── */
  .adm-main { padding: 24px 28px; max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

  /* ── Stat cards ── */
  .adm-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .adm-stat {
    background: #fff; border: 1px solid #E8E6E0;
    border-radius: 12px; padding: 18px 20px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .adm-stat-label { font-size: 11px; color: #888; letter-spacing: 0.04em; text-transform: uppercase; }
  .adm-stat-value { font-size: 28px; font-weight: 600; line-height: 1; }
  .adm-stat-value.blue  { color: #185FA5; }
  .adm-stat-value.green { color: #0F6E56; }
  .adm-stat-value.amber { color: #854F0B; }
  .adm-stat-hint { font-size: 11px; color: #aaa; }

  /* ── Grid ── */
  .adm-grid { display: grid; grid-template-columns: 380px 1fr; gap: 16px; align-items: start; }

  /* ── Panel ── */
  .adm-panel {
    background: #fff; border: 1px solid #E8E6E0;
    border-radius: 12px; overflow: hidden;
  }
  .adm-panel-head {
    padding: 13px 18px;
    border-bottom: 1px solid #F0EEE8;
    display: flex; align-items: center; justify-content: space-between;
  }
  .adm-panel-title { font-size: 13px; font-weight: 600; color: #222; }
  .adm-panel-badge {
    font-size: 10px; color: #888;
    background: #F5F4F1; border-radius: 20px;
    padding: 2px 8px;
  }
  .adm-panel-body { padding: 16px 18px; }

  /* ── Form ── */
  .adm-form-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .adm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .adm-input {
    width: 100%;
    background: #FAFAF8;
    border: 1px solid #E0DED8;
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 13px;
    color: #222;
    font-family: 'Be Vietnam Pro', sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .adm-input:focus { border-color: #0F6E56; box-shadow: 0 0 0 3px rgba(15,110,86,0.08); }
  .adm-input::placeholder { color: #bbb; }
  .adm-btn-add {
    width: 100%;
    background: #0F6E56; color: #fff;
    border: none; border-radius: 8px;
    padding: 10px; font-size: 13px; font-weight: 500;
    cursor: pointer;
    font-family: 'Be Vietnam Pro', sans-serif;
    transition: background 0.15s, transform 0.1s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .adm-btn-add:hover { background: #085041; }
  .adm-btn-add:active { transform: scale(0.98); }

  /* ── Table ── */
  .adm-tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .adm-tbl th {
    padding: 9px 12px;
    text-align: left;
    font-size: 10.5px; font-weight: 600; letter-spacing: 0.06em;
    color: #999; text-transform: uppercase;
    background: #FAFAF8;
    border-bottom: 1px solid #EEECE6;
  }
  .adm-tbl td {
    padding: 10px 12px;
    border-bottom: 1px solid #F5F4F0;
    color: #333;
    vertical-align: middle;
  }
  .adm-tbl tbody tr:last-child td { border-bottom: none; }
  .adm-tbl tbody tr:hover td { background: #FAFAF8; }
  .adm-tbl-input {
    width: 100%;
    min-width: 50px;

    background: transparent;
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 3px 6px;
    font-size: 12.5px;
    color: #222;
    font-family: 'Be Vietnam Pro', sans-serif;
    outline: none;
    transition: border-color 0.1s, background 0.1s;
  }
  .adm-tbl-input:hover { border-color: #E0DED8; }
  .adm-tbl-input:focus { border-color: #0F6E56; background: #F0FAF6; }

  /* ── Icon buttons ── */
  .adm-actions { display: flex; gap: 4px; align-items: center; }
  .adm-icon-btn {
    border: 1px solid #E0DED8; background: #fff;
    color: #888; border-radius: 6px;
    width: 28px; height: 28px;
    cursor: pointer; font-size: 13px;
    display: inline-flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .adm-icon-btn:hover { background: #F5F4F1; }
  .adm-icon-btn.save { border-color: #9FE1CB; color: #0F6E56; }
  .adm-icon-btn.save:hover { background: #E1F5EE; }
  .adm-icon-btn.del  { border-color: #F5C4B3; color: #993C1D; }
  .adm-icon-btn.del:hover  { background: #FAECE7; }

  /* ── Progress bars ── */
  .adm-progress-wrap { display: flex; flex-direction: column; gap: 14px; }
  .adm-progress-item {}
  .adm-progress-meta {
    display: flex; justify-content: space-between;
    font-size: 12px; margin-bottom: 5px;
    color: #444;
  }
  .adm-progress-meta span:last-child { font-weight: 600; color: #222; }
  .adm-bar-bg { background: #EEECE6; border-radius: 20px; height: 5px; overflow: hidden; }
  .adm-bar { height: 100%; border-radius: 20px; transition: width 0.5s ease; }

  /* ── Prize chip ── */
  .adm-chip {
    display: inline-block;
    background: #E1F5EE; color: #085041;
    font-size: 11px; font-weight: 500;
    padding: 2px 9px; border-radius: 20px;
    white-space: nowrap;
  }
  .adm-chip-none { color: #ccc; }

  /* ── Export button ── */
  .adm-export-btn {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid #E0DED8; background: #FAFAF8;
    color: #555; border-radius: 7px;
    padding: 5px 12px; font-size: 12px; font-weight: 500;
    cursor: pointer; font-family: 'Be Vietnam Pro', sans-serif;
    transition: all 0.12s;
  }
  .adm-export-btn:hover { background: #fff; border-color: #0F6E56; color: #0F6E56; }

  /* ── Pagination ── */
  .adm-pag {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; padding: 14px 0 4px;
    font-size: 12px; color: #888;
    border-top: 1px solid #F5F4F0;
  }
  .adm-pag-btn {
    border: 1px solid #E0DED8; background: #FAFAF8;
    color: #555; border-radius: 7px;
    padding: 5px 12px; font-size: 12px;
    cursor: pointer; font-family: 'Be Vietnam Pro', sans-serif;
    transition: all 0.12s;
  }
  .adm-pag-btn:hover:not(:disabled) { background: #fff; border-color: #aaa; }
  .adm-pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Scroll wrapper ── */
  .adm-table-scroll { overflow-x: auto; }

  /* ── Left col gap ── */
  .adm-left { display: flex; flex-direction: column; gap: 14px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .adm-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 620px) {
    .adm-stats { grid-template-columns: 1fr 1fr; }
    .adm-stats .adm-stat:last-child { grid-column: span 2; }
    .adm-main { padding: 16px; }
    .adm-topbar { padding: 0 16px; }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="adm-bar-bg">
      <div
        className="adm-bar"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

const BAR_COLORS = ["#0F6E56", "#185FA5", "#854F0B", "#993C1D", "#533AB7"];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [name, setName] = useState("");
  const [ratio, setRatio] = useState("");
  const [quantity, setQuantity] = useState("");

  // ── Fetch ──
  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prizes");
      const data = await res.json();
      setPrizes(data);
    } catch (err) {
      console.error("❌ fetchPrizes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?page=${pageNum}&limit=${limit}`,
      );
      const data = await res.json();
      setUsers(data.users);
      setStats({
        totalUsers: data.pagination.totalUsers,
        winners: data.winners,
        percent: data.percent,
        prizeStats: data.prizeStats,
      });
      setTotalPages(data.pagination.totalPages);
      setPage(data.pagination.page);
    } catch (err) {
      console.error("❌ fetchUsers:", err);
    } finally {
      setLoading(false);
    }
  };

  const addPrize = async () => {
    if (!name || !ratio) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prizes", {
        method: "POST",
        body: JSON.stringify({ name, ratio, quantity }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setName("");
        setRatio("");
        setQuantity("");
        await fetchPrizes();
      }
    } catch (err) {
      console.error("❌ addPrize:", err);
    } finally {
      setLoading(false);
    }
  };

  const savePrize = async (item: Prize) => {
    setLoading(true);
    try {
      await fetch("/api/admin/prizes", {
        method: "PUT",
        body: JSON.stringify(item),
        headers: { "Content-Type": "application/json" },
      });
      await fetchPrizes();
    } finally {
      setLoading(false);
    }
  };

  const deletePrize = async (id: number) => {
    if (!confirm("Xoá phần thưởng này?")) return;
    setLoading(true);
    try {
      await fetch("/api/admin/prizes", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      await fetchPrizes();
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/export");
      if (!res.ok) throw new Error("Export thất bại");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "report.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export:", err);
    } finally {
      setLoading(false);
    }
  };

  const updatePrizeField = (id: number, field: keyof Prize, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  useEffect(() => {
    fetchPrizes();
    fetchUsers();
  }, []);

  // ── Render ──
  return (
    <>
      <style>{css}</style>
      <div className="adm-root">
        <LoadingModal isOpen={loading} />

        {/* ── Topbar ── */}
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <div className="adm-logo">🎰</div>
            <div>
              <div className="adm-title">Quản lý phần thưởng</div>
              <div className="adm-sub">Bảng điều khiển quản trị viên</div>
            </div>
          </div>
          <span className="adm-badge-live">
            <span className="adm-dot" />
            Live
          </span>
        </header>

        <div className="adm-main">
          {/* ── Stats ── */}
          {stats && (
            <div className="adm-stats">
              <div className="adm-stat">
                <div className="adm-stat-label">Tổng người tham gia</div>
                <div className="adm-stat-value blue">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="adm-stat-hint">Kể từ khi bắt đầu</div>
              </div>
              <div className="adm-stat">
                <div className="adm-stat-label">Số người trúng thưởng</div>
                <div className="adm-stat-value green">
                  {stats.winners.toLocaleString()}
                </div>
                <div className="adm-stat-hint">Đã nhận giải</div>
              </div>
              <div className="adm-stat">
                <div className="adm-stat-label">Tỉ lệ trúng</div>
                <div className="adm-stat-value amber">
                  {stats.totalUsers > 0
                    ? ((stats.winners / stats.totalUsers) * 100).toFixed(2)
                    : "0.00"}
                  %
                </div>
                <div className="adm-stat-hint">Trung bình toàn bộ giải</div>
              </div>
            </div>
          )}

          <div>
            <Link href="/admin/devices">
              <button className="adm-btn-add">Người dùng</button>
            </Link>
          </div>

          <div className="adm-grid">
            {/* ── Left column ── */}
            <div className="adm-left">
              {/* Add prize form */}
              <div className="adm-panel">
                <div className="adm-panel-head">
                  <span className="adm-panel-title">Thêm phần thưởng mới</span>
                </div>
                <div className="adm-panel-body">
                  <div className="adm-form-stack">
                    <input
                      className="adm-input"
                      placeholder="Tên phần thưởng"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-row" style={{ marginBottom: 12 }}>
                    <input
                      className="adm-input"
                      type="number"
                      placeholder="Tỷ lệ (%)"
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value)}
                    />
                    <input
                      className="adm-input"
                      type="number"
                      placeholder="Số lượng"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <button className="adm-btn-add" onClick={addPrize}>
                    <span>＋</span> Thêm phần thưởng
                  </button>
                </div>
              </div>

              {/* Prize list table */}

              {/* Prize stats with progress bars */}
              {stats && stats.prizeStats.length > 0 && (
                <div className="adm-panel">
                  <div className="adm-panel-head">
                    <span className="adm-panel-title">Thống kê đã trúng</span>
                  </div>
                  <div className="adm-panel-body">
                    <div className="adm-progress-wrap">
                      {stats.prizeStats.map((item, i) => {
                        const total =
                          prizes.find((p) => p.name === item.name)?.quantity ??
                          item.used + (item.remaining ?? 0);
                        return (
                          <div className="adm-progress-item" key={i}>
                            <div className="adm-progress-meta">
                              <span>{item.name}</span>
                              <span>
                                {item.used} /{" "}
                                {total > 0 ? total + item.used : "∞"}
                              </span>
                            </div>
                            <ProgressBar
                              value={item.used}
                              total={total}
                              color={BAR_COLORS[i % BAR_COLORS.length]}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: User table ── */}
            <div className="adm-panel">
              <div className="adm-panel">
                <div className="adm-panel-head">
                  <span className="adm-panel-title">Danh sách phần thưởng</span>
                  <span className="adm-panel-badge">{prizes.length} loại</span>
                </div>
              </div>
              <table className="adm-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>#</th>
                    <th>Tên</th>
                    <th style={{ textAlign: "center", maxWidth: 100 }}>
                      Tỷ lệ/SL
                    </th>
                    <th style={{ width: 68 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ color: "#bbb", fontSize: 11 }}>{i + 1}</td>
                      <td>
                        <input
                          className="adm-tbl-input"
                          value={item.name}
                          onChange={(e) =>
                            updatePrizeField(item.id, "name", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <div className="flex  w-full max-w-[150px] mx-auto gap-1">
                          <input
                            className="adm-tbl-input"
                            type="number"
                            style={{ textAlign: "right" }}
                            value={item.ratio}
                            onChange={(e) =>
                              updatePrizeField(
                                item.id,
                                "ratio",
                                Number(e.target.value),
                              )
                            }
                          />
                          /
                          <input
                            className="adm-tbl-input"
                            type="number"
                            style={{ textAlign: "right" }}
                            value={item.quantity}
                            onChange={(e) =>
                              updatePrizeField(
                                item.id,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                      </td>
                      <td>
                        <div className="adm-actions">
                          <button
                            className="adm-icon-btn save"
                            title="Lưu"
                            onClick={() => savePrize(item)}
                          >
                            ✓
                          </button>
                          <button
                            className="adm-icon-btn del"
                            title="Xoá"
                            onClick={() => deletePrize(item.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {prizes.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "#bbb",
                          padding: "24px 0",
                          fontSize: 12,
                        }}
                      >
                        Chưa có phần thưởng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="adm-panel-head mt-2 border-t">
                <span className="adm-panel-title">Danh sách người dùng</span>
                <button className="adm-export-btn" onClick={exportExcel}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 11v3h12v-3M8 2v8M5 7l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Xuất Excel
                </button>
              </div>

              <div className="adm-table-scroll">
                <table className="adm-tbl" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Số điện thoại</th>
                      <th>Số CCCD</th>
                      <th>Phần thưởng</th>
                      <th>Ngày tham gia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 500 }}>{user.name}</td>
                        <td style={{ color: "#555" }}>{user.phone}</td>
                        <td
                          style={{
                            color: "#555",
                            fontFamily: "monospace",
                            fontSize: 12,
                          }}
                        >
                          {user.licensePlate}
                        </td>
                        <td>
                          {user.prize ? (
                            <span className="adm-chip">{user.prize}</span>
                          ) : (
                            <span className="adm-chip-none">—</span>
                          )}
                        </td>
                        <td
                          style={{
                            color: "#aaa",
                            fontSize: 11.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(user.createdAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            color: "#bbb",
                            padding: "32px 0",
                            fontSize: 12,
                          }}
                        >
                          Chưa có người dùng nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="adm-pag">
                <button
                  className="adm-pag-btn"
                  disabled={page === 1}
                  onClick={() => fetchUsers(page - 1)}
                >
                  ← Trước
                </button>
                <span>
                  Trang <strong>{page}</strong> / {totalPages}
                </span>
                <button
                  className="adm-pag-btn"
                  disabled={page === totalPages}
                  onClick={() => fetchUsers(page + 1)}
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
