"use client";

import { useEffect, useMemo, useState } from "react";

type Category =
  | "Merchant"
  | "Modal Merchant"
  | "OTP"
  | "VSPhone"
  | "Cash Out";

type Transaction = {
  id: number;
  date: string;
  category: Category;
  amount: number;
  note?: string;
};

const categories: {
  name: Category;
  emoji: string;
  type: "income" | "expense";
}[] = [
  { name: "Merchant", emoji: "💰", type: "income" },
  { name: "Modal Merchant", emoji: "📦", type: "expense" },
  { name: "OTP", emoji: "🔐", type: "expense" },
  { name: "VSPhone", emoji: "📱", type: "expense" },
  { name: "Cash Out", emoji: "💸", type: "expense" },
];

const formatRupiah = (value: number) =>
  `Rp${Math.abs(value).toLocaleString("id-ID")}`;

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const commandMap: Record<string, Category> = {
  MC: "Merchant",
  MM: "Modal Merchant",
  OT: "OTP",
  VS: "VSPhone",
  CS: "Cash Out",
};


const parseAmount = (value: string) => {
  const clean = value
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/rp/g, "");

  if (clean.endsWith("jt")) {
    return Number(clean.replace("jt", "").replace(",", ".")) * 1000000;
  }

  if (clean.endsWith("k")) {
    return Number(clean.replace("k", "").replace(",", ".")) * 1000;
  }

  // Input cepat satuan ribuan:
  // 1 = 1.000 | 10 = 10.000 | 1.000 = 1.000.000
  // 1,5 = 1.500 | 15,5 = 15.500 | 1.756,7 = 1.756.700
  if (/^\d[\d.]*,\d+$/.test(clean)) {
    const normalized = clean.replace(/\./g, "").replace(",", ".");
    return Number(normalized) * 1000;
  }

  if (/^\d[\d.]*$/.test(clean)) {
    return Number(clean.replace(/\./g, "")) * 1000;
  }

  return Number(clean.replace(/\./g, "").replace(",", ".")) || 0;
};

const parseTransactionCommand = (
  value: string,
  fallbackCategory: Category | null,
) => {
  const normalized = value.trim().toUpperCase();
  const parts = normalized.split(/\s+/);
  const possibleCommand = parts[0];
  const commandCategory = commandMap[possibleCommand];

  if (commandCategory) {
    return {
      category: commandCategory,
      amount: parseAmount(parts.slice(1).join(" ")),
    };
  }

  return {
    category: fallbackCategory,
    amount: parseAmount(value),
  };
};

const getCategoryType = (category: Category) =>
  category === "Merchant" ? "income" : "expense";

const getNet = (transactions: Transaction[]) =>
  transactions.reduce((total, item) => {
    return total + (getCategoryType(item.category) === "income"
      ? item.amount
      : -item.amount);
  }, 0);

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialBalance, setInitialBalance] = useState(0);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<
    "harian" | "mingguan" | "bulanan"
  >("harian");

  const [chartPeriod, setChartPeriod] = useState<
    "7hari" | "14hari" | "30hari"
  >("7hari");

  const [showBalanceEditor, setShowBalanceEditor] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [entryDate, setEntryDate] = useState(getDateKey());

  const today = getDateKey(currentDate);

  useEffect(() => {
    const updateCurrentDate = () => setCurrentDate(new Date());
    updateCurrentDate();

    const timer = window.setInterval(updateCurrentDate, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") updateCurrentDate();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!editingId) setEntryDate(today);
  }, [today, editingId]);

  useEffect(() => {
    const savedTransactions = localStorage.getItem(
      "jasdor-keuangan-transactions",
    );

    const savedInitialBalance = localStorage.getItem(
      "jasdor-keuangan-initial-balance",
    );

    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch {
        setTransactions([]);
      }
    }

    if (savedInitialBalance) {
      setInitialBalance(Number(savedInitialBalance) || 0);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "jasdor-keuangan-transactions",
      JSON.stringify(transactions),
    );

    localStorage.setItem(
      "jasdor-keuangan-initial-balance",
      String(initialBalance),
    );
  }, [transactions, initialBalance, loaded]);

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }

        return b.id - a.id;
      }),
    [transactions],
  );

  const todayTransactions = useMemo(
    () => transactions.filter((item) => item.date === today),
    [transactions, today],
  );

  const beforeToday = useMemo(
    () => transactions.filter((item) => item.date < today),
    [transactions, today],
  );

  const saldoPertamaHariIni = initialBalance + getNet(beforeToday);

  const todayIncome = todayTransactions
    .filter((item) => getCategoryType(item.category) === "income")
    .reduce((total, item) => total + item.amount, 0);

  const todayExpense = todayTransactions
    .filter((item) => getCategoryType(item.category) === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const todayByCategory = (category: Category) =>
    todayTransactions
      .filter((item) => item.category === category)
      .reduce((total, item) => total + item.amount, 0);

  const saveTransaction = () => {
    const parsed = parseTransactionCommand(amount, selectedCategory);

    if (
      !parsed.category ||
      !parsed.amount ||
      parsed.amount <= 0
    ) {
      return;
    }

    const numericAmount = parsed.amount;
    const transactionCategory = parsed.category;

    if (editingId !== null) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                date: entryDate || item.date,
                category: transactionCategory,
                amount: numericAmount,
                note: description.trim() || undefined,
              }
            : item,
        ),
      );
    } else {
      const newTransaction: Transaction = {
        id: Date.now(),
        date: entryDate || today,
        category: transactionCategory,
        amount: numericAmount,
        note: description.trim() || undefined,
      };

      setTransactions((current) => [newTransaction, ...current]);
    }

    setSelectedCategory(null);
    setAmount("");
    setDescription("");
    setEditingId(null);
  };

  const editTransaction = (item: Transaction) => {
    setEditingId(item.id);
    setEntryDate(item.date);
    setSelectedCategory(item.category);
    setAmount(String(item.amount));
    setDescription(item.note ?? "");
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const deleteTransaction = (id: number) => {
    const confirmed = window.confirm(
      "Hapus transaksi ini? Saldo akan otomatis dihitung ulang.",
    );

    if (!confirmed) return;

    setTransactions((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const saveInitialBalance = () => {
    const numericAmount = parseAmount(balanceInput);

    if (numericAmount < 0 || Number.isNaN(numericAmount)) return;

    setInitialBalance(numericAmount);
    setBalanceInput("");
    setShowBalanceEditor(false);
  };

  const merchantToday = todayByCategory("Merchant");
  const modalToday = todayByCategory("Modal Merchant");
  const otpToday = todayByCategory("OTP");
  const vsphoneToday = todayByCategory("VSPhone");
  const cashOutToday = todayByCategory("Cash Out");

  const saldoKeluarHariIni =
    modalToday + otpToday + vsphoneToday + cashOutToday;

  // Cash Out hanya mengurangi saldo, bukan menghitung keuntungan usaha.
  // Sebelum ada pemasukan, keuntungan ditampilkan 0 agar tidak terlihat minus.
  const keuntunganHariIni = Math.max(
    0,
    merchantToday - modalToday - otpToday - vsphoneToday,
  );

  const currentBalance =
    initialBalance + getNet(transactions);

  // Saldo akhir adalah saldo berjalan setelah seluruh transaksi tercatat.
  const saldoAkhirHariIni = currentBalance;

  const todayNet = keuntunganHariIni;

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const startOfWeek = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);

    return result;
  };

  const weeklyTransactions = useMemo(() => {
    const start = startOfWeek(new Date(currentDate));

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return transactions.filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return date >= start && date <= end;
    });
  }, [transactions, currentDate]);

  const monthlyTransactions = useMemo(() => {
    const now = new Date(currentDate);
    const month = now.getMonth();
    const year = now.getFullYear();

    return transactions.filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return (
        date.getMonth() === month &&
        date.getFullYear() === year
      );
    });
  }, [transactions, currentDate]);

  const recapData =
    activeTab === "harian"
      ? todayTransactions
      : activeTab === "mingguan"
        ? weeklyTransactions
        : monthlyTransactions;

  const recapIncome = recapData
    .filter((item) => item.category === "Merchant")
    .reduce((total, item) => total + item.amount, 0);

  const recapModal = recapData
    .filter((item) => item.category === "Modal Merchant")
    .reduce((total, item) => total + item.amount, 0);

  const recapOtp = recapData
    .filter((item) => item.category === "OTP")
    .reduce((total, item) => total + item.amount, 0);

  const recapVsphone = recapData
    .filter((item) => item.category === "VSPhone")
    .reduce((total, item) => total + item.amount, 0);

  const recapCashOut = recapData
    .filter((item) => item.category === "Cash Out")
    .reduce((total, item) => total + item.amount, 0);

  const recapNet =
    recapIncome -
    recapModal -
    recapOtp -
    recapVsphone -
    recapCashOut;

  const chartDays = useMemo(() => {
    const days: {
      date: string;
      label: string;
      value: number;
    }[] = [];

    const now = new Date(currentDate);
    const start = new Date(now);

    const periodDays = chartPeriod === "7hari"
      ? 7
      : chartPeriod === "14hari"
        ? 14
        : 30;

    // Pencatatan mulai 5 Oktober 2026, jadi grafik tidak pernah
    // menampilkan tanggal 1–4 Oktober.
    const trackingStart = new Date(2026, 9, 5);
    const rollingStart = new Date(now);
    rollingStart.setDate(now.getDate() - periodDays + 1);
    const startDate = rollingStart < trackingStart ? trackingStart : rollingStart;
    start.setTime(startDate.getTime());

    for (let date = new Date(start); date <= now; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const key = getDateKey(currentDate);

      const value = transactions
        .filter(
          (item) =>
            item.date === key && item.category === "Merchant",
        )
        .reduce((total, item) => total + item.amount, 0);

      days.push({
        date: key,
        label: currentDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        value,
      });
    }

    return days;
  }, [transactions, chartPeriod, currentDate]);

  // Skala mengikuti kelipatan Rp600 ribu. Mulai dari Rp3 juta,
  // lalu otomatis bertambah lagi jika pemasukan melewati batas.
  const chartStep = 600000;
  const chartMaxValue = Math.max(
    3000000,
    Math.ceil(
      Math.max(...chartDays.map((item) => item.value), 0) / chartStep,
    ) * chartStep,
  );

  const chartWidth = 360;
  const chartHeight = 170;
  const plotLeft = 4;
  const plotRight = 316;
  const plotTop = 10;
  const plotBottom = 150;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const chartPoints = chartDays.map((item, index) => {
    const x =
      plotLeft +
      ((index + 0.5) / Math.max(chartDays.length, 1)) * plotWidth;

    const y =
      plotBottom -
      (item.value / chartMaxValue) * plotHeight;

    return `${x},${y}`;
  });

  const chartScaleLabels = Array.from(
    { length: Math.round(chartMaxValue / chartStep) + 1 },
    (_, index) => index * chartStep,
  ).reverse();

  const formatChartScale = (value: number) => {
    if (value === 0) return "0";
    if (value >= 1000000) {
      const millions = value / 1000000;
      return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} jt`;
    }
    return `${value / 1000} rb`;
  };

  return (
    <main>
      <header className="header">
        <div>
          <p className="eyebrow">CATATAN HARIAN</p>
          <h1>Jasdorby_esaashop</h1>

          <p className="date-text">
            {currentDate.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </header>

      <section className="balance-card">
        <div className="balance-top">
          <p>💳 SALDO SAAT INI</p>

          <button
            className="mini-edit"
            onClick={() => {
              setBalanceInput(String(initialBalance));
              setShowBalanceEditor(true);
            }}
          >
            ⚙️ Atur
          </button>
        </div>

        <h2>{formatRupiah(currentBalance)}</h2>

        <div className="balance-info-grid">
          <div>
            <span>🌿 Keuntungan</span>
            <strong className={keuntunganHariIni >= 0 ? "positive" : "negative"}>
              {keuntunganHariIni >= 0 ? "+" : "-"}{formatRupiah(keuntunganHariIni)}
            </strong>
          </div>

          <div>
            <span>💰 Merchant</span>
            <strong className="positive">{formatRupiah(merchantToday)}</strong>
          </div>

          <div>
            <span>💳 Saldo Akhir</span>
            <strong>{formatRupiah(saldoAkhirHariIni)}</strong>
          </div>

          <div>
            <span>💸 Saldo Keluar</span>
            <strong className="negative">{formatRupiah(saldoKeluarHariIni)}</strong>
          </div>
        </div>
      </section>

      {showBalanceEditor && (
        <section className="input-card balance-editor">
          <div className="input-heading">
            <div>
              <p>SALDO AWAL SISTEM</p>
              <h2>💰 Atur Saldo Awal</h2>
            </div>

            <button
              className="close-button"
              onClick={() => setShowBalanceEditor(false)}
            >
              ×
            </button>
          </div>

          <label htmlFor="initial-balance">
            Saldo pertama sebelum mulai mencatat
          </label>

          <input
            id="initial-balance"
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 500000"
            value={balanceInput}
            onChange={(event) =>
              setBalanceInput(event.target.value)
            }
          />

          <button
            className="save-button"
            onClick={saveInitialBalance}
          >
            SIMPAN SALDO AWAL
          </button>
        </section>
      )}


      <section className="quick-section">
        <div className="category-summary">
          {categories.map((item) => {
            const total = todayByCategory(item.name);
            return (
              <button
                key={item.name}
                className={`category-summary-button ${item.type} ${selectedCategory === item.name ? "selected" : ""}`}
                onClick={() => {
                  setSelectedCategory(item.name);
                  setEntryDate(today);
                  setAmount("");
                  setDescription("");
                  setEditingId(null);
                }}
              >
                <span className="category-summary-icon">{item.emoji}</span>
                <span className="category-summary-name">{item.name}</span>
                <strong>{formatRupiah(total)}</strong>
              </button>
            );
          })}

          <div className="category-decoration" aria-hidden="true">
            <div className="category-decoration-art">
              <span>🍣</span><span>🧋</span><span>🍰</span><span>🍜</span>
            </div>
            <div className="category-decoration-copy">
              <strong>Jajan dulu<br />Catat kemudian</strong>
              <small>🍣 🧋 🍰 🍜</small>
            </div>
          </div>
        </div>

        <div className="command-box">
          <div className="command-box-heading">
            <div>
              <h2>🌱 Masukkan Transaksi</h2>
            </div>

            {selectedCategory && (
              <button
                className="close-button"
                onClick={() => {
                  setSelectedCategory(null);
                  setEntryDate(today);
                  setAmount("");
                  setDescription("");
                  setEditingId(null);
                }}
              >
                ×
              </button>
            )}
          </div>

          <label htmlFor="entry-date" className="date-input-label">
            📅 Tanggal transaksi
          </label>
          <input
            id="entry-date"
            type="date"
            value={entryDate}
            max={today}
            onChange={(event) => setEntryDate(event.target.value)}
          />

          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoFocus
            placeholder=""
            value={amount}
            onChange={(event) => {
              const value = event.target.value;
              const command = value.trim().split(/\s+/)[0]?.toUpperCase();
              const detected = commandMap[command];

              if (detected) {
                setSelectedCategory(detected);
              }

              setAmount(value);
            }}
          />

          <label htmlFor="description" className="date-input-label">
            📝 Keterangan transaksi
          </label>
          <input
            id="description"
            type="text"
            inputMode="text"
            placeholder={
              selectedCategory === "Cash Out"
                ? "Contoh: beli brownies"
                : "Contoh: keterangan transaksi"
            }
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <button
            className="save-button"
            onClick={saveTransaction}
            disabled={
              !amount ||
              !parseTransactionCommand(amount, selectedCategory).amount ||
              parseTransactionCommand(amount, selectedCategory).amount <= 0
            }
          >
            SIMPAN TRANSAKSI
          </button>
        </div>
      </section>

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
            <small>
              Pilih kategori di atas, lalu masukkan nominalnya.
            </small>
          </div>
        ) : (
          <div className="transaction-list">
            {todayTransactions.map((item) => {
              const type = getCategoryType(item.category);

              const categoryInfo = categories.find(
                (category) =>
                  category.name === item.category,
              );

              return (
                <div
                  className="transaction-item"
                  key={item.id}
                >
                  <div className="transaction-left">
                    <span className="transaction-emoji">
                      {categoryInfo?.emoji}
                    </span>

                    <div className="transaction-main">
                      <strong>{item.note || item.category}</strong>

                      <small>
                        {item.note
                          ? item.category + " · " + formatDate(item.date)
                          : formatDate(item.date)}
                      </small>
                    </div>
                  </div>

                  <div className="transaction-right">
                    <strong
                      className={
                        type === "income"
                          ? "positive"
                          : "negative"
                      }
                    >
                      {type === "income" ? "+" : "-"}
                      {formatRupiah(item.amount)}
                    </strong>

                    <div className="transaction-actions">
                      <button
                        onClick={() =>
                          editTransaction(item)
                        }
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          deleteTransaction(item.id)
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="chart-card">
        <div className="section-title">
          <div>
            <h2>Naik-Naik Ke Puncak Gunung</h2>
            <p>Pemasukan Merchant • mulai 5 Oktober 2026</p>
          </div>
        </div>

        <div className="chart-summary">
          <strong>
            {formatRupiah(
              chartDays.reduce(
                (total, item) =>
                  total + item.value,
                0,
              ),
            )}
          </strong>

          <span>
            {chartPeriod === "7hari"
              ? "Merchant 7 hari • dari terlama → hari ini"
              : chartPeriod === "14hari"
                ? "Merchant 14 hari • dari terlama → hari ini"
                : "Merchant 30 hari • dari terlama → hari ini"}
          </span>
        </div>

        <div className="chart-wrapper">
          <svg
            className="merchant-chart"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Grafik pemasukan Merchant"
          >
            <defs>
              <linearGradient id="merchantFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b7caae" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#b7caae" stopOpacity="0" />
              </linearGradient>
            </defs>

            {chartDays.map((item, index) => {
              const y =
                chartDays.length === 1
                  ? plotBottom
                  : plotTop + (index / (chartDays.length - 1)) * plotHeight;
              return (
                <line
                  key={`horizontal-${item.date}`}
                  x1={plotLeft}
                  x2={plotRight}
                  y1={y}
                  y2={y}
                  stroke="#dfe7d9"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                />
              );
            })}

            {chartDays.map((item, index) => {
              const x =
                plotLeft +
                ((index + 0.5) / Math.max(chartDays.length, 1)) * plotWidth;
              return (
                <line
                  key={`vertical-${item.date}`}
                  x1={x}
                  x2={x}
                  y1={plotTop}
                  y2={plotBottom}
                  stroke="#e3e8de"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                />
              );
            })}

            <rect
              x={plotLeft}
              y={plotTop}
              width={plotWidth}
              height={plotHeight}
              rx="9"
              fill="none"
              stroke="#d8e1d2"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />

            <polyline
              points={`${plotLeft},${plotBottom} ${chartPoints.join(" ")} ${plotRight},${plotBottom}`}
              fill="url(#merchantFill)"
              stroke="none"
            />

            <polyline
              points={chartPoints.join(" ")}
              fill="none"
              stroke="#6f8b67"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chartDays.map((item, index) => {
              const point = chartPoints[index].split(",").map(Number);
              return (
                <circle
                  key={item.date}
                  cx={point[0]}
                  cy={point[1]}
                  r={chartDays.length <= 14 ? "4" : "2.7"}
                  fill="#fffdf8"
                  stroke="#6f8b67"
                  strokeWidth={chartDays.length <= 14 ? "2.5" : "2"}
                />
              );
            })}
          </svg>

          <div className="chart-scale" aria-hidden="true">
            {chartScaleLabels.map((value) => (
              <span key={value}>{formatChartScale(value)}</span>
            ))}
          </div>
        </div>

        <div
          className="chart-labels"
          style={{
            gridTemplateColumns: `repeat(${chartDays.length}, minmax(0, 1fr))`,
          }}
        >
          {chartDays.map((item) => (
            <span key={item.date}>{item.label}</span>
          ))}
        </div>
        <div className="chart-periods" aria-label="Periode grafik">
          <button
            className={chartPeriod === "7hari" ? "active" : ""}
            onClick={() => setChartPeriod("7hari")}
          >
            7 Hari
          </button>
          <button
            className={chartPeriod === "14hari" ? "active" : ""}
            onClick={() => setChartPeriod("14hari")}
          >
            14 Hari
          </button>
          <button
            className={chartPeriod === "30hari" ? "active" : ""}
            onClick={() => setChartPeriod("30hari")}
          >
            30 Hari
          </button>
        </div>
      </section>

      <section className="recap-card">
        <div className="section-title">
          <div>
            <h2>Rekap Keuangan 📊</h2>
            <p>Lihat perkembangan Jasdor</p>
          </div>
        </div>

        <div className="recap-tabs">
          <button
            className={
              activeTab === "harian" ? "active" : ""
            }
            onClick={() => setActiveTab("harian")}
          >
            Harian
          </button>

          <button
            className={
              activeTab === "mingguan" ? "active" : ""
            }
            onClick={() => setActiveTab("mingguan")}
          >
            Mingguan
          </button>

          <button
            className={
              activeTab === "bulanan" ? "active" : ""
            }
            onClick={() => setActiveTab("bulanan")}
          >
            Bulanan
          </button>
        </div>

        <div className="recap-grid">
          <div>
            <span>💰 Merchant</span>
            <strong className="positive">
              {formatRupiah(recapIncome)}
            </strong>
          </div>

          <div>
            <span>📦 Modal Merchant</span>
            <strong>
              {formatRupiah(recapModal)}
            </strong>
          </div>

          <div>
            <span>🔐 OTP</span>
            <strong>
              {formatRupiah(recapOtp)}
            </strong>
          </div>

          <div>
            <span>📱 VSPhone</span>
            <strong>
              {formatRupiah(recapVsphone)}
            </strong>
          </div>

          <div>
            <span>💸 Cash Out</span>
            <strong>
              {formatRupiah(recapCashOut)}
            </strong>
          </div>

          <div className="net-box">
            <span>🌿 Bersih</span>
            <strong
              className={
                recapNet >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {recapNet >= 0 ? "+" : "-"}
              {formatRupiah(recapNet)}
            </strong>
          </div>
        </div>
      </section>

      <section className="all-history-card">
        <div className="section-title">
          <div>
            <h2>Riwayat Semua Hari 🌷</h2>
            <p>Transaksi sebelumnya tetap tersimpan</p>
          </div>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="empty-state">
            <span>🪴</span>
            <p>Belum ada riwayat.</p>
          </div>
        ) : (
          <div className="date-history">
            {Array.from(
              new Set(
                sortedTransactions.map(
                  (item) => item.date,
                ),
              ),
            ).map((date) => {
              const dayTransactions =
                sortedTransactions.filter(
                  (item) => item.date === date,
                );

              const net = getNet(dayTransactions);

              return (
                <div
                  className="date-history-group"
                  key={date}
                >
                  <div className="date-history-heading">
                    <div>
                      <strong>{formatDate(date)}</strong>
                      <small>{dayTransactions.length} transaksi</small>
                    </div>

                    <strong
                      className={
                        net >= 0
                          ? "positive"
                          : "negative"
                      }
                    >
                      {net >= 0 ? "+" : "-"}
                      {formatRupiah(net)}
                    </strong>
                  </div>

                  <div className="date-history-transactions">
                    {dayTransactions.map((item) => {
                      const categoryInfo = categories.find(
                        (category) => category.name === item.category,
                      );
                      const type = getCategoryType(item.category);

                      return (
                        <div className="date-history-transaction" key={item.id}>
                          <span className="date-history-emoji">
                            {categoryInfo?.emoji}
                          </span>

                          <div className="date-history-detail">
                            <strong>{item.note || item.category}</strong>
                            <small>{item.note ? item.category : "Transaksi"}</small>
                          </div>

                          <div className="date-history-transaction-right">
                            <strong
                              className={type === "income" ? "positive" : "negative"}
                            >
                              {type === "income" ? "+" : "-"}
                              {formatRupiah(item.amount)}
                            </strong>

                            <div className="date-history-actions">
                              <button
                                type="button"
                                aria-label="Edit transaksi"
                                onClick={() => editTransaction(item)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                aria-label="Hapus transaksi"
                                onClick={() => deleteTransaction(item.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
                       }
