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
      `Tanggal: ${todayLabel()}`,
      `Jam: ${time} WIB`,
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
    const width = 900;
    await document.fonts.load("700 48px Fredoka");
    await document.fonts.load("700 30px Fredoka");
    await document.fonts.ready;

    const measureCanvas = document.createElement("canvas");
    const measure = measureCanvas.getContext("2d");
    if (!measure) return;
    const wrap = (value: string, maxWidth: number, font: string) => {
      measure.font = font;
      const words = value.split(/\s+/);
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? current + " " + word : word;
        if (current && measure.measureText(candidate).width > maxWidth) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
      return lines.length ? lines : [""];
    };

    const itemLayouts = validItems.map((item) => ({
      item,
      nameLines: wrap(item.name.trim(), 700, "700 30px Fredoka"),
    }));
    const noteLines = note.trim()
      ? wrap("Catatan: " + note.trim(), 690, "700 25px Fredoka")
      : [];
    const itemHeight = itemLayouts.reduce((sum, row) => sum + row.nameLines.length * 40 + 70, 0);
    const height = Math.max(1120, 1050 + itemHeight + noteLines.length * 36);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Export only the receipt paper; everything outside it stays transparent.
    const paperLeft = 28;
    const paperRight = width - 28;
    const paperTop = 20;
    const paperBottom = height - 48;
    ctx.fillStyle = "#fffaf8";
    ctx.beginPath();
    ctx.moveTo(paperLeft, paperTop);
    ctx.lineTo(paperRight, paperTop);
    ctx.lineTo(paperRight, paperBottom - 12);
    const scallops = 34;
    const scallopWidth = (paperRight - paperLeft) / scallops;
    for (let i = scallops; i >= 0; i--) {
      ctx.lineTo(paperLeft + i * scallopWidth, paperBottom - (i % 2 === 0 ? 0 : 12));
    }
    ctx.closePath();
    ctx.fill();

    for (let y = 48; y < paperBottom - 24; y += 24) {
      ctx.fillStyle = "rgba(177,119,128,.13)";
      ctx.beginPath();
      ctx.arc(48, y, 2, 0, Math.PI * 2);
      ctx.arc(width - 48, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const center = (value: string, y: number, size: number, family = "Fredoka") => {
      ctx.font = `800 ${size}px ${family}, sans-serif`;
      ctx.fillStyle = "#70464d";
      ctx.textAlign = "center";
      ctx.letterSpacing = "0px";
      ctx.fillText(value, width / 2, y);
    };
    const left = (value: string, y: number, size = 27) => {
      ctx.font = `700 ${size}px Fredoka, sans-serif`;
      ctx.fillStyle = "#765158";
      ctx.textAlign = "left";
      ctx.letterSpacing = "0px";
      ctx.fillText(value, 100, y);
    };
    const right = (value: string, y: number, size = 27) => {
      ctx.font = `800 ${size}px Fredoka, sans-serif`;
      ctx.fillStyle = "#765158";
      ctx.textAlign = "right";
      ctx.letterSpacing = "0px";
      ctx.fillText(value, width - 100, y);
    };
    const line = (y: number) => {
      ctx.save();
      ctx.setLineDash([8, 9]);
      ctx.strokeStyle = "#d9b5bb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(94, y);
      ctx.lineTo(width - 94, y);
      ctx.stroke();
      ctx.restore();
    };

    // Use the exact Jasdor illustration in both the HTML preview and PNG export.
    const logo = new Image();
    logo.src = "/jasdor-logo.svg";
    await logo.decode();
    ctx.drawImage(logo, 350, 18, 200, 200);
    center("♡  DIGITAL RECEIPT  ♡", 292, 25);
    line(330);
    left(`No. Nota : ${receiptNo}`, 390, 26);
    left(`Tanggal : ${todayLabel()}`, 438, 26);
    left(`Jam transaksi : ${time} WIB`, 486, 27);
    left(`Customer : ${customer.trim() || "-"}`, 534, 26);
    line(570);
    center("DETAIL PESANAN", 620, 24);

    let y = 678;
    for (const { item, nameLines } of itemLayouts) {
      nameLines.forEach((nameLine) => {
        left(nameLine, y, 29);
        y += 39;
      });
      const qty = Math.max(0, Number(item.qty) || 0);
      const price = Math.max(0, Number(item.price) || 0);
      left(`${qty} × ${money(price)}`, y, 24);
      right(money(qty * price), y, 27);
      y += 54;
    }
    line(y);
    y += 58;
    left("TOTAL PESANAN", y, 29);
    right(money(total), y, 35);
    y += 76;

    ctx.fillStyle = "#f8dce1";
    ctx.beginPath();
    ctx.roundRect(104, y - 40, width - 208, 64, 18);
    ctx.fill();
    ctx.font = "800 28px Fredoka, sans-serif";
    ctx.fillStyle = "#784951";
    ctx.textAlign = "center";
    ctx.fillText(status, width / 2, y + 2);
    y += 76;

    if (noteLines.length) {
      noteLines.forEach((noteLine) => {
        left(noteLine, y, 25);
        y += 36;
      });
    }
    line(y + 4);
    center("Thank you for ordering ♡", y + 64, 28);
    center("Semoga harimu semanis kopimu", y + 108, 25);

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
        <label className="nota-time-field">
          Jam transaksi (WIB)
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <div className="nota-items-title">
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
          <div className="nota-logo-wrap">
            <img src="/jasdor-logo.svg" alt="Logo Jasdor by_esaashop" />
          </div>
          <p className="nota-subtitle">♡ DIGITAL RECEIPT ♡</p>
          <div className="nota-dash" />
          <div className="nota-meta"><span>No. Nota</span><b>{receiptNo}</b></div>
          <div className="nota-meta"><span>Tanggal</span><b>{todayLabel()}</b></div>
          <div className="nota-meta"><span>Jam</span><b>{time} WIB</b></div>
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
