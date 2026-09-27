// ========================================
// DRAGON STORE - TOP UP HISTORY
// ========================================

import { supabase } from "./supabase.js";


// ========================================
// ELEMENT
// ========================================

const historyList =
  document.getElementById(
    "topupHistoryList"
  );

const historyLoading =
  document.getElementById(
    "historyLoading"
  );

const historyEmpty =
  document.getElementById(
    "historyEmpty"
  );
// ========================================
// QRIS MODAL
// ========================================

const qrisHistoryModal =
  document.getElementById(
    "qrisHistoryModal"
  );

const qrisHistoryOverlay =
  document.getElementById(
    "qrisHistoryOverlay"
  );

const closeQrisHistory =
  document.getElementById(
    "closeQrisHistory"
  );

const qrisHistoryImage =
  document.getElementById(
    "qrisHistoryImage"
  );

const qrisHistoryAmount =
  document.getElementById(
    "qrisHistoryAmount"
  );

const qrisHistoryCoins =
  document.getElementById(
    "qrisHistoryCoins"
  );

const qrisHistoryStatus =
  document.getElementById(
    "qrisHistoryStatus"
  );

const qrisHistoryCountdown =
  document.getElementById(
    "qrisHistoryCountdown"
  );

let qrisHistoryTimer =
  null;

let currentQrisTransaction =
  null;
const toast =
  document.getElementById(
    "toast"
  );


// ========================================
// BACKEND
// ========================================

const BACKEND_URL =
  "https://dragon-store-api.gunawanstanlie.workers.dev/";


// ========================================
// STATE
// ========================================

let session =
  null;

let historyChannel =
  null;

let historyLoadRequest =
  0;


// ========================================
// TOAST
// ========================================

function showToast(message) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


// ========================================
// FORMAT RUPIAH
// ========================================

function formatRupiah(value) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value) || 0
  );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(date) {

  if (!date) {
    return "-";
  }

  const parsed =
    new Date(date);


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return "-";

  }


  return parsed.toLocaleString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// ========================================
// STATUS TEXT
// ========================================

function getStatusText(status) {

  const normalized =
    String(
      status || ""
    ).toLowerCase();


  if (
    normalized === "paid"
  ) {

    return "Pembayaran Berhasil";

  }


  if (
    normalized === "expired"
  ) {

    return "Kedaluwarsa";

  }


  if (
    normalized === "pending"
  ) {

    return "Menunggu Pembayaran";

  }


  return "Tidak Diketahui";

}


// ========================================
// STATUS CLASS
// ========================================

function getStatusClass(status) {

  const normalized =
    String(
      status || ""
    ).toLowerCase();


  if (
    normalized === "paid"
  ) {

    return "success";

  }


  if (
    normalized === "expired"
  ) {

    return "expired";

  }


  if (
    normalized === "pending"
  ) {

    return "pending";

  }


  return "";

}


// ========================================
// CEK APAKAH QRIS MASIH AKTIF
// ========================================

function isQrisStillActive(
  transaction
) {

  if (
    String(
      transaction.status || ""
    ).toLowerCase() !==
    "pending"
  ) {

    return false;

  }


  if (!transaction.created_at) {

    return false;

  }


  const createdAt =
    new Date(
      transaction.created_at
    ).getTime();


  if (
    Number.isNaN(
      createdAt
    )
  ) {

    return false;

  }


  const age =
    Date.now() -
    createdAt;


  const expireTime =
    61 *
    60 *
    1000;


  return age < expireTime;

}

// ========================================
// OPEN QRIS MODAL
// ========================================

function openQrisModal(payment) {

  if (!qrisHistoryModal) {
    return;
  }


  currentQrisTransaction =
    payment;


  const qrImage =
    payment.qris_image ||
    payment.qris_url ||
    "";


  if (qrisHistoryImage) {

    qrisHistoryImage.src =
      qrImage;

  }


  if (qrisHistoryAmount) {

    qrisHistoryAmount.textContent =
      formatRupiah(
        payment.total_amount
      );

  }


  if (qrisHistoryCoins) {

    qrisHistoryCoins.textContent =
      `${payment.total_coins} Koin`;

  }


  if (qrisHistoryStatus) {

    qrisHistoryStatus.textContent =
      "Silakan selesaikan pembayaran melalui QRIS.";

  }


  qrisHistoryModal.hidden =
    false;


  startQrisHistoryCountdown(
    payment.expired_at
  );

}


// ========================================
// CLOSE QRIS MODAL
// ========================================

function closeQrisModal() {

  if (!qrisHistoryModal) {
    return;
  }


  if (qrisHistoryTimer) {

    clearInterval(
      qrisHistoryTimer
    );

    qrisHistoryTimer =
      null;

  }


  qrisHistoryModal.hidden =
    true;


  currentQrisTransaction =
    null;


  if (qrisHistoryImage) {

    qrisHistoryImage.removeAttribute(
      "src"
    );

  }

}


// ========================================
// QRIS COUNTDOWN
// ========================================

function startQrisHistoryCountdown(
  expiredAt
) {

  if (!qrisHistoryCountdown) {
    return;
  }


  if (qrisHistoryTimer) {

    clearInterval(
      qrisHistoryTimer
    );

  }


  if (!expiredAt) {

    qrisHistoryCountdown.textContent =
      "Batas waktu tidak tersedia.";

    return;

  }


  const expiryTime =
    new Date(
      String(expiredAt).replace(
        " ",
        "T"
      )
    ).getTime();


  if (
    Number.isNaN(expiryTime)
  ) {

    qrisHistoryCountdown.textContent =
      "Batas waktu tidak tersedia.";

    return;

  }


  function updateCountdown() {

    const remaining =
      expiryTime -
      Date.now();


    if (remaining <= 0) {

      clearInterval(
        qrisHistoryTimer
      );

      qrisHistoryTimer =
        null;


      qrisHistoryCountdown.textContent =
        "QRIS sudah kedaluwarsa.";


      if (qrisHistoryStatus) {

        qrisHistoryStatus.textContent =
          "Pembayaran ini sudah kedaluwarsa.";

      }

      return;

    }


    const totalSeconds =
      Math.floor(
        remaining / 1000
      );


    const minutes =
      Math.floor(
        totalSeconds / 60
      );


    const seconds =
      totalSeconds % 60;


    qrisHistoryCountdown.textContent =
      `Berlaku ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  }


  updateCountdown();


  qrisHistoryTimer =
    setInterval(
      updateCountdown,
      1000
    );

}
if (closeQrisHistory) {

  closeQrisHistory.addEventListener(
    "click",
    closeQrisModal
  );

}


if (qrisHistoryOverlay) {

  qrisHistoryOverlay.addEventListener(
    "click",
    closeQrisModal
  );

}
// ========================================
// OPEN QRIS
// ========================================

async function openQris(
  transaction
) {

  if (!session) {

    showToast(
      "Session login tidak ditemukan."
    );

    return;

  }


  if (
    !isQrisStillActive(
      transaction
    )
  ) {

    showToast(
      "QRIS transaksi ini sudah kedaluwarsa."
    );

    await loadHistory();

    return;

  }


  try {

    const response =
      await fetch(
        `${BACKEND_URL}/topup/status/${encodeURIComponent(transaction.id)}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      !result.status ||
      !result.data
    ) {

      showToast(
        "Transaksi tidak dapat ditemukan."
      );

      return;

    }


    const payment =
      result.data;


    if (
      String(
        payment.status
      ).toLowerCase() !==
      "pending"
    ) {

      showToast(
        getStatusText(
          payment.status
        )
      );

      await loadHistory();

      return;

    }


    // ========================================
    // SIMPAN DATA QRIS
    // ========================================

openQrisModal({
  ...payment,

  id: transaction.id,
  transaction_id: transaction.id
});


  } catch (error) {

    console.error(
      "OPEN QRIS ERROR:",
      error
    );

    showToast(
      "Gagal membuka pembayaran."
    );

  }

}


// ========================================
// CREATE HISTORY ITEM
// ========================================

function createHistoryItem(
  transaction
) {

  const item =
    document.createElement(
      "article"
    );


  item.className =
    "topup-history-item";


  const status =
    String(
      transaction.status || ""
    ).toLowerCase();


  const statusText =
    getStatusText(
      status
    );


  const statusClass =
    getStatusClass(
      status
    );


  const coins =
    Number(
      transaction.coins || 0
    );


  const bonus =
    Number(
      transaction.bonus_coins || 0
    );


  const totalCoins =
    Number(
      transaction.total_coins ||
      coins + bonus
    );


  const amount =
    Number(
      transaction.total_amount ??
      transaction.amount ??
      coins * 1000
    );


  item.innerHTML = `
    <div class="topup-history-main">

      <div class="topup-history-info">

        <h3>
          +${totalCoins} Koin
        </h3>

        <p>
          ${formatRupiah(amount)}
        </p>

        ${
          bonus > 0
            ? `
              <span class="topup-history-bonus">
                Bonus +${bonus} Koin
              </span>
            `
            : ""
        }

      </div>


      <div class="topup-history-status">

        <span
          class="topup-status ${statusClass}"
        >
          ${statusText}
        </span>

        <span class="topup-history-date">
          ${formatDate(
            transaction.created_at
          )}
        </span>

      </div>

    </div>


    ${
      status === "pending" &&
      isQrisStillActive(transaction)
        ? `
          <div class="topup-history-action">

            <button
              type="button"
              class="buy-btn history-qris-btn"
            >
              Lihat QRIS
            </button>

          </div>
        `
        : ""
    }
  `;


  // ========================================
  // QRIS BUTTON
  // ========================================

  if (
    status === "pending" &&
    isQrisStillActive(transaction)
  ) {

    const button =
      item.querySelector(
        ".history-qris-btn"
      );


    if (button) {

      button.addEventListener(
        "click",
        () => {

          openQris(
            transaction
          );

        }
      );

    }

  }


  return item;

}


// ========================================
// LOAD HISTORY
// ========================================

async function loadHistory() {

  // ========================================
  // REQUEST ID
  // ========================================

  const requestId =
    ++historyLoadRequest;


  if (!historyList) {
    return;
  }


  // ========================================
  // LOADING
  // ========================================

  if (historyLoading) {

    historyLoading.hidden =
      false;

  }


  if (historyEmpty) {

    historyEmpty.hidden =
      true;

  }


  // ========================================
  // HAPUS HASIL LAMA
  // ========================================

  historyList
    .querySelectorAll(
      ".topup-history-item"
    )
    .forEach(
      (item) => {

        item.remove();

      }
    );


  try {

    // ========================================
    // GET SESSION
    // ========================================

    const {
      data: {
        session: currentSession
      },
      error: sessionError
    } =
      await supabase.auth.getSession();


    // Request ini sudah tidak terbaru
    if (
      requestId !==
      historyLoadRequest
    ) {

      return;

    }


    // ========================================
    // BELUM LOGIN
    // ========================================

    if (
      sessionError ||
      !currentSession
    ) {

      if (historyLoading) {

        historyLoading.hidden =
          true;

      }


      if (historyEmpty) {

        historyEmpty.hidden =
          false;


        const title =
          historyEmpty.querySelector(
            "h2"
          );


        const description =
          historyEmpty.querySelector(
            "p"
          );


        if (title) {

          title.textContent =
            "Belum Login";

        }


        if (description) {

          description.textContent =
            "Login terlebih dahulu untuk melihat riwayat Top Up.";

        }

      }


      return;

    }


    session =
      currentSession;


    // ========================================
    // 24 JAM TERAKHIR
    // ========================================

    const twentyFourHoursAgo =
      new Date(
        Date.now() -
        24 * 60 * 60 * 1000
      ).toISOString();


    // ========================================
    // QUERY SUPABASE
    // ========================================

    const {
      data: transactions,
      error
    } =
      await supabase
        .from(
          "topup_transactions"
        )
        .select(
          `
            id,
            user_id,
            coins,
            bonus_coins,
            total_coins,
            amount,
            total_amount,
            status,
            order_id,
            created_at,
            paid_at
          `
        )
        .eq(
          "user_id",
          currentSession.user.id
        )
        .gte(
          "created_at",
          twentyFourHoursAgo
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    // ========================================
    // ABAIKAN REQUEST LAMA
    // ========================================

    if (
      requestId !==
      historyLoadRequest
    ) {

      return;

    }


    if (error) {

      console.error(
        "LOAD HISTORY ERROR:",
        error
      );

      throw error;

    }


    // ========================================
    // STOP LOADING
    // ========================================

    if (historyLoading) {

      historyLoading.hidden =
        true;

    }


    // ========================================
    // EMPTY
    // ========================================

    if (
      !transactions ||
      transactions.length === 0
    ) {

      if (historyEmpty) {

        historyEmpty.hidden =
          false;

      }

      return;

    }


    // ========================================
    // RENDER
    // ========================================

    transactions.forEach(
      (transaction) => {

        const item =
          createHistoryItem(
            transaction
          );


        historyList.appendChild(
          item
        );

      }
    );


  } catch (error) {

    console.error(
      "HISTORY ERROR:",
      error
    );


    // Jangan tampilkan error
    // dari request lama.

    if (
      requestId !==
      historyLoadRequest
    ) {

      return;

    }


    if (historyLoading) {

      historyLoading.hidden =
        true;

    }


    if (historyEmpty) {

      historyEmpty.hidden =
        false;


      const title =
        historyEmpty.querySelector(
          "h2"
        );


      const description =
        historyEmpty.querySelector(
          "p"
        );


      if (title) {

        title.textContent =
          "Gagal Memuat Riwayat";

      }


      if (description) {

        description.textContent =
          "Terjadi kesalahan saat mengambil transaksi.";

      }

    }

  }

}


// ========================================
// REALTIME
// ========================================

function setupRealtime() {

  if (!session) {
    return;
  }


  // Jangan membuat channel
  // berkali-kali.

  if (historyChannel) {
    return;
  }


  historyChannel =
    supabase
      .channel(
        `topup-history-${session.user.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",

          schema: "public",

          table: "topup_transactions",

          filter:
            `user_id=eq.${session.user.id}`
        },
        () => {

          loadHistory();

        }
      )
      .subscribe(
        (status) => {

          console.log(
            "TOP UP HISTORY REALTIME:",
            status
          );

        }
      );

}


// ========================================
// AUTH STATE CHANGE
// ========================================

supabase.auth.onAuthStateChange(
  async (
    event,
    newSession
  ) => {

    console.log(
      "History auth event:",
      event
    );


    // ========================================
    // LOGOUT
    // ========================================

    if (
      event === "SIGNED_OUT"
    ) {

      session =
        null;


      // Batalkan request lama

      historyLoadRequest++;


      // Hapus realtime channel

      if (historyChannel) {

        supabase.removeChannel(
          historyChannel
        );

        historyChannel =
          null;

      }


      loadHistory();

      return;

    }


    // ========================================
    // LOGIN
    // ========================================

    if (
      event === "SIGNED_IN" &&
      newSession
    ) {

      session =
        newSession;


      await loadHistory();


      setupRealtime();

    }

  }
);


// ========================================
// INITIALIZE
// ========================================

async function initialize() {

  const {
    data: {
      session: currentSession
    }
  } =
    await supabase.auth.getSession();


  // ========================================
  // SUDAH LOGIN
  // ========================================

  if (currentSession) {

    session =
      currentSession;


    await loadHistory();


    setupRealtime();


    return;

  }


  // ========================================
  // GUEST
  // ========================================

  await loadHistory();

}


// ========================================
// START
// ========================================

initialize();