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
    await document.fonts.load("600 16px Fredoka");
    await document.fonts.load("700 28px Fredoka");
    await document.fonts.ready;

    // Draw in the same 440px layout width as the on-screen receipt, then
    // export at 2x resolution. This keeps proportions identical on phones.
    const previewPaper = document.querySelector(".nota-paper");
    const W = Math.round(previewPaper?.getBoundingClientRect().width || 440);
    const scale = 2;
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
        } else current = candidate;
      }
      if (current) lines.push(current);
      return lines.length ? lines : [""];
    };

    const logo = new Image();
    logo.src = "/jasdor-logo.svg";
    await logo.decode();

    const meta = [
      ["No. Nota", receiptNo],
      ["Tanggal", todayLabel()],
      ["Jam", time + " WIB"],
      ["Customer", customer.trim() || "-"],
    ];
    const metaLayouts = meta.map(([label, value]) => ({
      label,
      lines: wrap(value, 205, "600 14px Fredoka"),
    }));
    const itemLayouts = validItems.map((item) => ({
      item,
      nameLines: wrap(item.name.trim(), 265, "600 17px Fredoka"),
    }));
    const noteLines = note.trim()
      ? wrap("Catatan: " + note.trim(), 370, "500 14px Fredoka")
      : [];

    let y = 250;
    for (const row of metaLayouts) y += Math.max(34, row.lines.length * 19) + 2;
    y += 54;
    for (const row of itemLayouts) y += row.nameLines.length * 23 + 48;
    y += 112 + noteLines.length * 21 + 112;
    const H = Math.max(900, y);

    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    const paperBottom = H - 20;
    ctx.fillStyle = "#fff9f7";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, paperBottom - 10);
    const scallops = 32;
    const sw = W / scallops;
    for (let i = scallops; i >= 0; i--) {
      ctx.lineTo(i * sw, paperBottom - (i % 2 === 0 ? 0 : 10));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#f1d9dc";
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let dotY = 28; dotY < paperBottom - 22; dotY += 25) {
      ctx.fillStyle = "rgba(177,119,128,.13)";
      ctx.beginPath();
      ctx.arc(13, dotY, 1.5, 0, Math.PI * 2);
      ctx.arc(W - 13, dotY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const text = (value: string, x: number, baseline: number, size: number, align: CanvasTextAlign = "left", weight = 600, color = "#765158") => {
      ctx.font = weight + " " + size + "px Fredoka, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.letterSpacing = "0px";
      ctx.fillText(value, x, baseline);
    };
    const divider = (at: number) => {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#dcbac0";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(28, at);
      ctx.lineTo(W - 28, at);
      ctx.stroke();
      ctx.restore();
    };
    const drawWrapped = (lines: string[], x: number, baseline: number, size: number, lineHeight: number, align: CanvasTextAlign = "left", weight = 600) => {
      lines.forEach((line, index) => text(line, x, baseline + index * lineHeight, size, align, weight));
    };

    // Logo is the same 180px square used in the preview; preserve its aspect ratio.
    ctx.drawImage(logo, (W - 160) / 2, 26, 160, 160);
    text("♡  DIGITAL RECEIPT  ♡", W / 2, 244, 14, "center", 700, "#70464d");
    divider(268);

    y = 300;
    for (const row of metaLayouts) {
      text(row.label, 30, y, 14, "left", 600);
      drawWrapped(row.lines, W - 30, y, 14, 19, "right", 600);
      y += Math.max(34, row.lines.length * 19) + 2;
    }
    divider(y + 5);
    y += 49;
    text("DETAIL PESANAN", W / 2, y, 14, "center", 700, "#70464d");
    y += 42;

    for (const { item, nameLines } of itemLayouts) {
      drawWrapped(nameLines, 30, y, 17, 23, "left", 600);
      const qty = Math.max(0, Number(item.qty) || 0);
      const price = Math.max(0, Number(item.price) || 0);
      text(money(qty * price), W - 30, y, 16, "right", 700);
      y += nameLines.length * 23;
      text(qty + " × " + money(price), 30, y + 1, 14, "left", 500, "#9b747b");
      y += 38;
    }

    divider(y + 2);
    y += 49;
    text("TOTAL PESANAN", 30, y, 16, "left", 700, "#70464d");
    text(money(total), W - 30, y + 2, 22, "right", 700, "#70464d");
    y += 55;

    const pillWidth = 336;
    ctx.fillStyle = "#f8dce1";
    ctx.beginPath();
    ctx.roundRect((W - pillWidth) / 2, y - 25, pillWidth, 42, 13);
    ctx.fill();
    text(status, W / 2, y + 3, 18, "center", 700, "#784951");
    y += 48;

    if (noteLines.length) {
      drawWrapped(noteLines, 30, y, 14, 21, "left", 500);
      y += noteLines.length * 21 + 16;
    }
    divider(y + 3);
    text("Thank you for ordering ♡", W / 2, y + 51, 19, "center", 600, "#885760");
    text("Semoga harimu semanis kopimu", W / 2, y + 82, 15, "center", 600, "#a17d82");

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
