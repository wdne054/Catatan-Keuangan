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
    await document.fonts.ready;
    await document.fonts.load("600 16px Fredoka");
    await document.fonts.load("700 24px Fredoka");

    const W = 440;
    const scale = 3;
    const measureCanvas = document.createElement("canvas");
    const measure = measureCanvas.getContext("2d");
    if (!measure) return;
    const wrap = (value: string, maxWidth: number, font: string) => {
      measure.font = font;
      const words = value.split(/\\s+/);
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
    logo.src = "/jasdor-logo-hd.webp";
    await logo.decode();

    const meta = [
      ["No. Nota", receiptNo],
      ["Tanggal", todayLabel()],
      ["Jam Transaksi", time + " WIB"],
      ["Customer", customer.trim() || "-"],
    ];
    const metaLayouts = meta.map(([label, value]) => ({
      label,
      lines: wrap(value, 265, "600 15px Fredoka"),
    }));
    const itemLayouts = validItems.map((item) => ({
      item,
      nameLines: wrap(item.name.trim(), 270, "600 18px Fredoka"),
    }));
    const noteLines = note.trim()
      ? wrap("Catatan: " + note.trim(), 370, "500 14px Fredoka")
      : [];

    // Content-first height: every wrapped menu/meta/note line contributes
    // to the paper height, so long orders never get clipped.
    let H = 0;
    let y = 24 + 174 + 12 + 28 + 20;
    for (const row of metaLayouts) y += Math.max(30, row.lines.length * 21) + 3;
    y += 20 + 38 + 18;
    for (const row of itemLayouts) y += row.nameLines.length * 25 + 42 + 18;
    y += 22 + 88;
    if (noteLines.length) y += noteLines.length * 21 + 18;
    y += 24 + 104 + 34;
    H = Math.max(700, Math.ceil(y));

    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    // Cream paper with a softly stitched scalloped edge.
    ctx.fillStyle = "#fff9f7";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#f3cbd2";
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, W - 14, H - 14);
    ctx.save();
    ctx.setLineDash([2, 10]);
    ctx.strokeStyle = "#f6cbd2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 18); ctx.lineTo(18, H - 18);
    ctx.moveTo(W - 18, 18); ctx.lineTo(W - 18, H - 18);
    ctx.stroke();
    ctx.restore();

    const text = (value: string, x: number, baseline: number, size: number, align: CanvasTextAlign = "left", weight = 600, color = "#70464d") => {
      ctx.font = weight + " " + size + "px Fredoka, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(value, x, baseline);
    };
    const divider = (at: number) => {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#f0aeba";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(28, at); ctx.lineTo(W - 28, at);
      ctx.stroke();
      ctx.restore();
    };
    const drawWrapped = (lines: string[], x: number, baseline: number, size: number, lineHeight: number, align: CanvasTextAlign = "left", weight = 600) => {
      lines.forEach((line, index) => text(line, x, baseline + index * lineHeight, size, align, weight));
    };
    const pill = (label: string, x: number, top: number, width: number, height: number) => {
      ctx.fillStyle = "#f9dce2";
      ctx.beginPath();
      ctx.roundRect(x, top, width, height, height / 2);
      ctx.fill();
      text(label, x + width / 2, top + height * .68, 16, "center", 700, "#70464d");
    };

    let cursor = 24;
    ctx.drawImage(logo, (W - 178) / 2, cursor, 178, 178);
    cursor += 194;
    text("♡  DIGITAL RECEIPT  ♡", W / 2, cursor, 20, "center", 700, "#70464d");
    cursor += 25;
    divider(cursor);
    cursor += 35;

    for (const row of metaLayouts) {
      text(row.label + " :", 30, cursor, 15, "left", 600);
      drawWrapped(row.lines, W - 30, cursor, 15, 21, "right", 600);
      cursor += Math.max(30, row.lines.length * 21) + 3;
    }
    cursor += 6;
    divider(cursor);
    cursor += 36;
    pill("DETAIL PESANAN", (W - 190) / 2, cursor - 23, 190, 30);
    cursor += 29;

    for (const { item, nameLines } of itemLayouts) {
      drawWrapped(nameLines, 30, cursor, 18, 25, "left", 600);
      const qty = Math.max(0, Number(item.qty) || 0);
      const price = Math.max(0, Number(item.price) || 0);
      text(money(qty * price), W - 30, cursor + 2, 17, "right", 700);
      cursor += nameLines.length * 25;
      text(qty + " × " + money(price), 30, cursor + 1, 14, "left", 500, "#956e76");
      cursor += 42;
    }

    cursor += 4;
    divider(cursor);
    cursor += 40;
    pill("Total Pesanan", 30, cursor - 23, 140, 30);
    pill("Total Harga", 238, cursor - 23, 172, 30);
    text(validItems.length + " item", 100, cursor + 28, 18, "center", 600);
    text(money(total), W - 30, cursor + 34, 27, "right", 700, "#70464d");
    cursor += 70;

    if (noteLines.length) {
      divider(cursor);
      cursor += 28;
      drawWrapped(noteLines, 30, cursor, 14, 21, "left", 500);
      cursor += noteLines.length * 21 + 16;
    }
    divider(cursor);
    cursor += 50;
    ctx.fillStyle = "#fde8ec";
    ctx.beginPath();
    ctx.roundRect(28, cursor - 30, W - 56, 76, 24);
    ctx.fill();
    text("Thank you for ordering ♡", W / 2, cursor, 21, "center", 700, "#70464d");
    text("Semoga harimu semanis kopimu ☕", W / 2, cursor + 29, 15, "center", 600, "#80555d");
    cursor += 76;
    text("──────────────  🎀  ──────────────", W / 2, cursor + 24, 17, "center", 600, "#e69aa8");

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
            <img src="/jasdor-logo-hd.webp" alt="Logo Jasdor by_esaashop" />
          </div>
          <p className="nota-subtitle">♡ DIGITAL RECEIPT ♡</p>
          <div className="nota-dash" />
          <div className="nota-meta"><span>No. Nota</span><b>{receiptNo}</b></div>
          <div className="nota-meta"><span>Tanggal</span><b>{todayLabel()}</b></div>
          <div className="nota-meta"><span>Jam</span><b>{time} WIB</b></div>
          <div className="nota-meta"><span>Customer</span><b>{customer.trim() || "-"}</b></div>
          <div className="nota-dash" />
          <p className="nota-detail-title"><span>DETAIL PESANAN</span></p>
          {items.filter((item) => item.name.trim()).map((item) => (
            <div className="nota-line-item" key={item.id}>
              <div><b>{item.name}</b><small>{item.qty || "0"} × {money(Number(item.price) || 0)}</small></div>
              <strong>{money((Number(item.qty) || 0) * (Number(item.price) || 0))}</strong>
            </div>
          ))}
          <div className="nota-dash" />
          <div className="nota-total"><div><b>Total Pesanan</b><span>{items.filter((item) => item.name.trim()).length} item</span></div><div><b>Total Harga</b><strong>{money(total)}</strong></div></div>
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
