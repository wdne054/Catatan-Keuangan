"use client";

import { useState } from "react";

export default function Home() {
  const [showIncome, setShowIncome] = useState(false);
  const [amount, setAmount] = useState("");

  const saveIncome = () => {
    if (!amount) return;

    alert(`Pemasukan Rp${Number(amount).toLocaleString("id-ID")} tersimpan`);

    setAmount("");
    setShowIncome(false);
  };

  return (
    <main>
      <h1>Catatan Keuangan</h1>
      <p>Saldo Saat Ini</p>

      <section>
        <h2>Rp0</h2>
      </section>

      <div>
        <button onClick={() => setShowIncome(true)}>
          Pemasukan
        </button>

        <button>
          Pengeluaran
        </button>
      </div>

      {showIncome && (
        <section className="form-card">
          <p>💰 Pemasukan Merchant</p>

          <input
            type="number"
            inputMode="numeric"
            placeholder="Masukkan nominal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button onClick={saveIncome}>
            Simpan Pemasukan
          </button>

          <button onClick={() => setShowIncome(false)}>
            Batal
          </button>
        </section>
      )}

      <p>Belum ada transaksi hari ini.</p>
    </main>
  );
}
