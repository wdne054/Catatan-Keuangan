"use client";

import { useEffect, useMemo, useState } from "react";

type Category =
  | "Merchant"
  | "Modal Merchant"
  | "OTP"
  | "VSPhone"
  | "Pribadi/Jajan";

type Transaction = {
  id: number;
  date: string;
  category: Category;
  type: "income" | "expense";
  amount: number;
};

const categories: {
  name: Category;
  type: "income" | "expense";
  emoji: string;
}[] = [
  { name: "Merchant", type: "income", emoji: "💰" },
  { name: "Modal Merchant", type: "expense", emoji: "📦" },
  { name: "OTP", type: "expense", emoji: "🔐" },
  { name: "VSPhone", type: "expense", emoji: "📱" },
  { name: "Pribadi/Jajan", type: "expense", emoji: "🍜" },
];

const formatRupiah = (value: number) =>
  `Rp${value.toLocaleString("id-ID")}`;

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [amount, setAmount] = useState("");
  const [loaded, setLoaded] = useState(false);

  const today = getToday();

  useEffect(() => {
    const saved = localStorage.getItem("catatan-keuangan-transactions");

    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch {
        setTransactions([]);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "catatan-keuangan-transactions",
        JSON.stringify(transactions),
      );
    }
  }, [transactions, loaded]);

  const todayTransactions = useMemo(
    () => transactions.filter((item) => item.date === today),
    [transactions, today],
  );

  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  const todayIncome = todayTransactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const todayExpense = todayTransactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const todayNet = todayIncome - todayExpense;

  const saveTransaction = () => {
    const numericAmount = Number(amount);

    if (!selectedCategory || !numericAmount || numericAmount <= 0) {
      return;
    }

    const categoryInfo = categories.find(
      (item) => item.name === selectedCategory,
    );

    if (!categoryInfo) return;

    const newTransaction: Transaction = {
      id: Date.now(),
      date: today,
      category: selectedCategory,
      type: categoryInfo.type,
      amount: numericAmount,
    };

    setTransactions((current) => [newTransaction, ...current]);
    setAmount("");
    setSelectedCategory(null);
  };

  return (
    <main>
      <header className="header">
        <div>
          <p className="eyebrow">CATATAN HARIAN</p>
          <h1>Catatan Keuangan</h1>
          <p className="date-text">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="mascot-placeholder">🌿</div>
      </header>

      <section className="balance-card">
        <p>💳 SALDO SAAT INI</p>
        <h2>{formatRupiah(currentBalance)}</h2>

        <div className="balance-line">
          <span>
            Bersih hari ini{" "}
            <strong className={todayNet >= 0 ? "positive" : "negative"}>
              {todayNet >= 0 ? "+" : "-"}
              {formatRupiah(Math.abs(todayNet))}
            </strong>
          </span>
        </div>
      </section>

      <section className="today-card">
        <div>
          <span>💰 Pemasukan</span>
          <strong>{formatRupiah(todayIncome)}</strong>
        </div>

        <div>
          <span>💸 Pengeluaran</span>
          <strong>{formatRupiah(todayExpense)}</strong>
        </div>
      </section>

      <section className="quick-section">
        <div className="section-title">
          <div>
            <h2>Catat Cepat</h2>
            <p>Tinggal klik sesuai kebutuhanmu</p>
          </div>
        </div>

        <p className="group-label income-label">💚 PEMASUKAN</p>

        <button
          className={`keyword-button income ${
            selectedCategory === "Merchant" ? "selected" : ""
          }`}
          onClick={() => {
            setSelectedCategory("Merchant");
            setAmount("");
          }}
        >
          <span className="keyword-icon">💰</span>
          <span>
            <strong>MERCHANT</strong>
            <small>Catat pemasukan jasa/order</small>
          </span>
        </button>

        <p className="group-label expense-label">❤️ PENGELUARAN</p>

        <div className="keyword-grid">
          {categories
            .filter((item) => item.type === "expense")
            .map((item) => (
              <button
                key={item.name}
                className={`keyword-button expense ${
                  selectedCategory === item.name ? "selected" : ""
                }`}
                onClick={() => {
                  setSelectedCategory(item.name);
                  setAmount("");
                }}
              >
                <span className="keyword-icon">{item.emoji}</span>
                <span>
                  <strong>{item.name.toUpperCase()}</strong>
                  <small>
                    {item.name === "Modal Merchant"
                      ? "Modal harian merchant"
                      : item.name === "Pribadi/Jajan"
                        ? "Pengeluaran pribadi"
                        : `Catat ${item.name}`}
                  </small>
                </span>
              </button>
            ))}
        </div>
      </section>

      {selectedCategory && (
        <section className="input-card">
          <div className="input-heading">
            <div>
              <p>CATAT TRANSAKSI</p>
              <h2>
                {categories.find((item) => item.name === selectedCategory)
                  ?.emoji}{" "}
                {selectedCategory}
              </h2>
            </div>

            <button
              className="close-button"
              onClick={() => {
                setSelectedCategory(null);
                setAmount("");
              }}
            >
              ×
            </button>
          </div>

          <label htmlFor="amount">Nominal</label>

          <input
            id="amount"
            type="number"
            inputMode="numeric"
            autoFocus
            placeholder="Contoh: 150000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />

          <button
            className="save-button"
            onClick={saveTransaction}
            disabled={!amount || Number(amount) <= 0}
          >
            SIMPAN {selectedCategory.toUpperCase()}
          </button>
        </section>
      )}

      <section className="history-card">
        <div className="section-title">
          <div>
            <h2>Transaksi Hari Ini</h2>
            <p>{todayTransactions.length} transaksi</p>
          </div>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="empty-state">
            <span>🌱</span>
            <p>Belum ada transaksi hari ini.</p>
            <small>Klik kata kunci di atas untuk mulai mencatat.</small>
          </div>
        ) : (
          <div className="transaction-list">
            {todayTransactions.map((item) => (
              <div className="transaction-item" key={item.id}>
                <div>
                  <strong>{item.category}</strong>
                  <small>
                    {item.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </small>
                </div>

                <strong
                  className={item.type === "income" ? "positive" : "negative"}
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatRupiah(item.amount)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
  }
