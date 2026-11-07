"use client";

import { useEffect, useMemo, useState } from "react";
import "./nota.css";

type NotaItem = { id: number; name: string; qty: string; price: string };

const money = (value: number) =>
  `Rp${Math.max(0, value).toLocaleString("id-ID")}`;

const todayLabel = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function NotaDigitalPage() {
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<NotaItem[]>([
    { id: 1, name: "", qty: "1", price: "" },
  ]);
  const [status, setStatus] = useState<"LUNAS" | "BELUM LUNAS">("LUNAS");
  const [note, setNote] = useState("");
  const [receiptNo, setReceiptNo] = useState("Menyiapkan...");
  const [time, setTime] = useState("12:00");

  useEffect(() => {
    const now = new Date();
    setTime(now.toTimeString().slice(0, 5));
    const dateKey = `jasdor-nota-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nextNumber = Number(window.localStorage.getItem(dateKey) || "0") + 1;
    window.localStorage.setItem(dateKey, String(nextNumber));
    const datePart = `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}`;
    setReceiptNo(`JD-${datePart}-${String(nextNumber).padStart(3, "0")}`);
  }, []);
  const [feedback, setFeedback] = useState("");

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.qty) || 0) *
            Math.max(0, Number(item.price) || 0),
        0,
      ),
    [items],
  );

  const updateItem = (id: number, key: "name" | "qty" | "price", value: string) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );

  const receiptText = () => {
    const rows = items
      .filter((item) => item.name.trim())
      .map(
        (item) =>
          `${item.name} x${item.qty || "0"} — ${money(
            (Number(item.qty) || 0) * (Number(item.price) || 0),
          )}`,
      );
    return [
      "JASDOR by_esaashop",
      "DIGITAL RECEIPT",
      "--------------------------------",
      `No. Nota: ${receiptNo}`,
      `Tanggal: ${todayLabel()}`,\n      `Jam: ${time} WIB`,
      `Customer: ${customer.trim() || "-"}`,
      "--------------------------------",
      ...rows,
      "--------------------------------",
      `TOTAL: ${money(total)}`,
      `STATUS: ${status}`,
      note.trim() ? `Catatan: ${note.trim()}` : "",
      "",
      "Terima kasih sudah order di Jasdor ♡",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const downloadPng = async () => {
    const validItems = items.filter((item) => item.name.trim());
    const width = 760;
    const height = 900 + validItems.length * 72 + (note.trim() ? 50 : 0);
    await document.fonts.load("700 54px Fredoka");
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff0f3";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fffaf8";
    ctx.fillRect(42, 24, width - 84, height - 48);

    // Soft paper grain and perforated receipt edges.
    for (let y = 34; y < height - 30; y += 16) {
      ctx.fillStyle = "rgba(177,119,128,.08)";
      ctx.fillRect(55, y, 5, 2);
      ctx.fillRect(width - 60, y, 5, 2);
    }

    const center = (text: string, y: number, size: number, weight = "600") => {
      ctx.font = `${weight} ${size}px Fredoka, sans-serif`;
      ctx.fillStyle = "#70464d";
      ctx.textAlign = "center";
      ctx.fillText(text, width / 2, y);
    };
    const line = (y: number) => {
      ctx.save();
      ctx.setLineDash([7, 8]);
      ctx.strokeStyle = "#d9aeb5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(92, y);
      ctx.lineTo(width - 92, y);
      ctx.stroke();
      ctx.restore();
    };
    const left = (text: string, y: number, size = 22, weight = "500") => {
      ctx.font = `${weight} ${size}px Fredoka, sans-serif`;
      ctx.fillStyle = "#765158";
      ctx.textAlign = "left";
      ctx.fillText(text, 100, y);
    };
    const right = (text: string, y: number, size = 22, weight = "500") => {
      ctx.font = `${weight} ${size}px Fredoka, sans-serif`;
      ctx.fillStyle = "#765158";
      ctx.textAlign = "right";
      ctx.fillText(text, width - 100, y);
    };

    // Tiny hand-drawn coffee cup doodle.
    ctx.save();
    ctx.strokeStyle = "#bd858c";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(330, 76);
    ctx.lineTo(430, 76);
    ctx.lineTo(418, 145);
    ctx.quadraticCurveTo(380, 164, 342, 145);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(430, 91);
    ctx.quadraticCurveTo(482, 85, 462, 126);
    ctx.quadraticCurveTo(448, 140, 421, 132);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(355, 60);
    ctx.quadraticCurveTo(340, 42, 356, 28);
    ctx.moveTo(382, 60);
    ctx.quadraticCurveTo(367, 42, 384, 28);
    ctx.moveTo(409, 60);
    ctx.quadraticCurveTo(394, 42, 411, 28);
    ctx.stroke();
    ctx.restore();

    center("Jasdor", 205, 54, "700");
    center("by_esaashop", 238, 23, "600");
    center("♡  DIGITAL RECEIPT  ♡", 278, 19, "600");
    line(310);
    left(`No. Nota  : ${receiptNo}`, 354, 20);
    left(`Tanggal  : ${todayLabel()}`, 392, 20);
    left(`Jam      : ${time} WIB`, 430, 20);
    left(`Customer : ${customer.trim() || "-"}`, 468, 20);
    line(500);

    let y = 548;
    validItems.forEach((item) => {
      const qty = Math.max(0, Number(item.qty) || 0);
      const price = Math.max(0, Number(item.price) || 0);
      left(item.name.slice(0, 34), y, 22, "600");
      right(`${qty} x ${money(price)}`, y, 19);
      y += 30;
      right(money(qty * price), y, 19, "600");
      y += 42;
    });
    line(y);
    y += 48;
    left("TOTAL", y, 25, "700");
    right(money(total), y, 28, "700");
    y += 58;

    ctx.fillStyle = "#f8dce1";
    ctx.fillRect(100, y - 29, width - 200, 58);
    ctx.font = "700 24px Fredoka, sans-serif";
    ctx.fillStyle = "#784951";
    ctx.textAlign = "center";
    ctx.fillText(status, width / 2, y + 9);
    y += 60;

    if (note.trim()) {
      left(`Catatan: ${note.trim().slice(0, 45)}`, y + 15, 18);
      y += 50;
    }
    line(y + 12);
    center("Thank you for ordering ♡", y + 62, 23, "700");
    center("Semoga harimu semanis kopimu ☕", y + 96, 17, "500");
    center("Jasdor by_esaashop", y + 132, 16, "600");

    const link = document.createElement("a");
    link.download = `Nota-Jasdor-${receiptNo}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setFeedback("Nota PNG berhasil disiapkan ♡");
  };

  const copyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(receiptText());
      setFeedback("Rincian nota berhasil disalin. Tinggal tempel ke WhatsApp ♡");
    } catch {
      setFeedback("Salin otomatis tidak tersedia di browser ini. Kamu bisa gunakan tombol Cetak.");
    }
  };

  return (
    <main className="nota-page">
      <a className="nota-back" href="/">← Kembali ke Catatan Keuangan</a>
      <header className="nota-heading">
        <span>☕  ♡  🧋</span>
        <p>JASDOR by_esaashop</p>
        <h1>Nota Digital</h1>
        <small>Bikin struk manis untuk setiap pesananmu</small>
      </header>

      <section className="nota-form">
        <label>
          Nama customer
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer" />
        </label>
        <label className="nota-time-field">\n          Jam transaksi (WIB)\n          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />\n        </label>\n        <div className="nota-items-title">
          <strong>Detail pesanan</strong>
          <button type="button" onClick={() => setItems((current) => [...current, { id: Date.now(), name: "", qty: "1", price: "" }])}>+ Tambah menu</button>
        </div>
        {items.map((item) => (
          <div className="nota-item-editor" key={item.id}>
            <input aria-label="Nama menu" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="Nama menu / pesanan" />
            <div className="nota-item-numbers">
              <label>Qty<input inputMode="numeric" type="number" min="0" value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} /></label>
              <label>Harga satuan<input inputMode="numeric" type="number" min="0" value={item.price} onChange={(e) => updateItem(item.id, "price", e.target.value)} placeholder="15000" /></label>
              <button type="button" className="nota-remove" aria-label="Hapus menu" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}>×</button>
            </div>
            <small>Jumlah: {money((Number(item.qty) || 0) * (Number(item.price) || 0))}</small>
          </div>
        ))}
        <label>
          Catatan tambahan (opsional)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Pesanan diambil di outlet KCP" />
        </label>
        <div className="nota-status">
          <span>Status pembayaran</span>
          <div>
            <button type="button" className={status === "LUNAS" ? "chosen" : ""} onClick={() => setStatus("LUNAS")}>♡ Lunas</button>
            <button type="button" className={status === "BELUM LUNAS" ? "chosen" : ""} onClick={() => setStatus("BELUM LUNAS")}>Belum lunas</button>
          </div>
        </div>
      </section>

      <section className="nota-preview-wrap">
        <div className="nota-preview-label">PREVIEW NOTA ♡</div>
        <article className="nota-paper">
          <div className="nota-doodle" aria-hidden="true">
            <span className="steam">〰 〰 〰</span>
            <span className="cup">☕</span>
            <span className="sparkle">✳</span>
          </div>
          <h2>Jasdor</h2>
          <strong className="nota-brand">by_esaashop</strong>
          <p className="nota-subtitle">♡ DIGITAL RECEIPT ♡</p>
          <div className="nota-dash" />
          <div className="nota-meta"><span>No. Nota</span><b>{receiptNo}</b></div>
          <div className="nota-meta"><span>Tanggal</span><b>{todayLabel()}</b></div>\n          <div className="nota-meta"><span>Jam</span><b>{time} WIB</b></div>
          <div className="nota-meta"><span>Customer</span><b>{customer.trim() || "-"}</b></div>
          <div className="nota-dash" />
          <p className="nota-detail-title">DETAIL PESANAN</p>
          {items.filter((item) => item.name.trim()).map((item) => (
            <div className="nota-line-item" key={item.id}>
              <div><b>{item.name}</b><small>{item.qty || "0"} × {money(Number(item.price) || 0)}</small></div>
              <strong>{money((Number(item.qty) || 0) * (Number(item.price) || 0))}</strong>
            </div>
          ))}
          <div className="nota-dash" />
          <div className="nota-total"><b>TOTAL</b><strong>{money(total)}</strong></div>
          {note.trim() && <p className="nota-note">Catatan: {note}</p>}
          <div className="nota-paid">{status}</div>
          <div className="nota-dash" />
          <p className="nota-thanks">Thank you for ordering ♡</p>
          <p className="nota-footer">Semoga harimu semanis kopimu ☕</p>
          <div className="nota-stamp">Jasdor by_esaashop</div>
        </article>
      </section>

      <div className="nota-actions">
        <button type="button" onClick={downloadPng}>↓ Simpan nota sebagai gambar</button>
        <button type="button" className="secondary" onClick={copyWhatsApp}>Salin teks untuk WhatsApp</button>
      </div>
      {feedback && <p className="nota-feedback" role="status">{feedback}</p>}
      <p className="nota-disclaimer">Nota ini berdiri sendiri dan tidak mengubah catatan transaksi, saldo, atau grafik keuangan Jasdor.</p>
    </main>
  );
}
