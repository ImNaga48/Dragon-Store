// ========================================
// DRAGON STORE - INDEX
// ========================================

import { supabase } from "./java script/supabase.js";


// ========================================
// STATE
// ========================================

const state = {
  session: null,
  user: null,
  profile: null,

  isLoggedIn: false,

  coins: 0,

  selectedCoins: 1,
  bonusCoins: 0,

  isCustom: false
};


// ========================================
// ELEMENT
// ========================================

// NAVBAR
const coinBalance =
  document.getElementById("coinBalance");

const loginNavBtn =
  document.getElementById("loginNavBtn");


// PROFILE
const profileCard =
  document.getElementById("profileCard");

const profileImage =
  document.getElementById("profileImage");

const profileName =
  document.getElementById("profileName");

const profileId =
  document.getElementById("profileId");

const profileEmail =
  document.getElementById("profileEmail");

const profileRole =
  document.getElementById("profileRole");

const profileCoins =
  document.getElementById("profileCoins");

const profileSince =
  document.getElementById("profileSince");


// PROFILE MODAL
const profileModal =
  document.getElementById("profileModal");

const closeProfileModal =
  document.getElementById("closeProfileModal");

const guestProfileActions =
  document.getElementById("guestProfileActions");

const logoutProfileActions =
  document.getElementById("logoutProfileActions");

const profileLoginBtn =
  document.getElementById("profileLoginBtn");

const profileRegisterBtn =
  document.getElementById("profileRegisterBtn");

const confirmLogoutBtn =
  document.getElementById("confirmLogoutBtn");

const cancelLogoutBtn =
  document.getElementById("cancelLogoutBtn");


// LOGIN REQUIRED MODAL
const loginRequiredModal =
  document.getElementById("loginRequiredModal");

const closeLoginRequired =
  document.getElementById("closeLoginRequired");

const requiredLoginBtn =
  document.getElementById("requiredLoginBtn");

const requiredRegisterBtn =
  document.getElementById("requiredRegisterBtn");

const cancelLoginRequired =
  document.getElementById("cancelLoginRequired");


// TOP UP
const topupModal =
  document.getElementById("topupModal");

const modalBalance =
  document.getElementById("modalBalance");

const topupTotal =
  document.getElementById("topupTotal");

const topupReward =
  document.getElementById("topupReward");

const customCoins =
  document.getElementById("customCoins");

const customBonus =
  document.getElementById("customBonus");

const toast =
  document.getElementById("toast");


// ========================================
// QRIS ELEMENT
// ========================================

const checkoutBtn =
  document.getElementById("checkoutBtn");

const topupForm =
  document.getElementById("topupForm");

const qrisPayment =
  document.getElementById("qrisPayment");

const qrisImage =
  document.getElementById("qrisImage");

const qrisAmount =
  document.getElementById("qrisAmount");

const qrisCoins =
  document.getElementById("qrisCoins");

const qrisCountdown =
  document.getElementById("qrisCountdown");

const qrisStatus =
  document.getElementById("qrisStatus");

const cancelQris =
  document.getElementById("cancelQris");

const refreshQrisStatus =
  document.getElementById("refreshQrisStatus");

const refreshQrisStatusText =
  document.getElementById("refreshQrisStatusText");

// ========================================
// BACKEND
// ========================================

const BACKEND_URL =
  "https://dragon-store-api.gunawanstanlie.workers.dev";


// ========================================
// QRIS STATE
// ========================================

let currentTransactionId = null;

let qrisStatusTimer = null;

let qrisCountdownTimer = null;


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
  ).format(value);

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(date) {

  if (!date) {
    return "Tidak ditemukan";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Tidak ditemukan";
  }

  return parsedDate.toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


// ========================================
// CALCULATE BONUS
// ========================================

function calculateBonus(coins) {

  if (coins < 10) {
    return 0;
  }

  return Math.floor(
    coins * 0.10
  );

}


// ========================================
// TOAST
// ========================================

function showToast(message) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove("show");

      },
      2600
    );

}


// ========================================
// UPDATE TOP UP DISPLAY
// ========================================

function updateTopupDisplay(coins) {

  const bonus =
    calculateBonus(coins);

  const totalCoins =
    coins + bonus;

  const price =
    coins * 1000;


  state.selectedCoins =
    coins;

  state.bonusCoins =
    bonus;


  if (topupTotal) {

    topupTotal.textContent =
      formatRupiah(price);

  }


  if (topupReward) {

    topupReward.textContent =
      `${totalCoins} Koin`;

  }


  if (customBonus) {

    if (bonus > 0) {

      customBonus.textContent =
        `+${bonus} bonus • Total ${totalCoins} koin`;

    } else {

      customBonus.textContent =
        "Tidak ada bonus untuk jumlah ini.";

    }

  }

}


// ========================================
// RESET QRIS VIEW
// ========================================

function resetQrisView() {

  stopQrisTimers();

  currentTransactionId =
    null;


  if (qrisPayment) {

    qrisPayment.hidden =
      true;

    qrisPayment.style.display =
      "";

  }


  if (topupForm) {

    topupForm.hidden =
      false;

    topupForm.style.display =
      "";

  }


  if (qrisImage) {

    qrisImage.removeAttribute("src");

  }


  if (qrisAmount) {

    qrisAmount.textContent =
      "Rp0";

  }


  if (qrisCoins) {

    qrisCoins.textContent =
      "0 Koin";

  }


  if (qrisCountdown) {

    qrisCountdown.textContent =
      "Menunggu pembayaran...";

  }


  if (qrisStatus) {

    qrisStatus.textContent =
      "Silakan selesaikan pembayaran melalui QRIS.";

  }
  if (refreshQrisStatus) {
  refreshQrisStatus.disabled = false;
  refreshQrisStatus.classList.remove("success");
}

if (refreshQrisStatusText) {
  refreshQrisStatusText.textContent =
    "Cek Status Pembayaran";
}
}


// ========================================
// RENDER BALANCE
// ========================================

function renderBalance() {

  let displayCoins = 0;


  // GUEST
  if (!state.isLoggedIn) {

    displayCoins = 0;

  }


  // OWNER
  else if (
    state.profile &&
    String(state.profile.role).toLowerCase() === "owner"
  ) {

    displayCoins = "∞";

  }


  // USER
  else {

    displayCoins =
      state.coins;

  }


  if (coinBalance) {

    coinBalance.textContent =
      displayCoins;

  }


  if (modalBalance) {

    modalBalance.textContent =
      displayCoins;

  }


  if (profileCoins) {

    profileCoins.textContent =
      displayCoins;

  }

}


// ========================================
// RENDER GUEST
// ========================================

function renderGuestProfile() {

  state.session = null;

  state.isLoggedIn = false;

  state.user = null;

  state.profile = null;

  state.coins = 0;


  resetQrisView();


  if (profileImage) {

    profileImage.src =
      "assets/tamu.jpg";

    profileImage.alt =
      "Profile Tamu";

  }


  if (profileName) {

    profileName.textContent =
      "Tamu";

  }


  if (profileId) {

    profileId.textContent =
      "Tamu";

  }


  if (profileEmail) {

    profileEmail.textContent =
      "Tamu";

  }


  if (profileRole) {

    profileRole.textContent =
      "Tamu";

  }


  if (profileCoins) {

    profileCoins.textContent =
      "0";

  }


  if (profileSince) {

    profileSince.textContent =
      "Tidak ditemukan";

  }


  if (loginNavBtn) {

    loginNavBtn.textContent =
      "Login";

  }


  renderBalance();

}


// ========================================
// RENDER USER
// ========================================

function renderUserProfile(
  user,
  profile
) {

  state.isLoggedIn =
    true;

  state.user =
    user;

  state.profile =
    profile;


  const role =
    profile.role || "user";


  const coins =
    Number(
      profile.coin_balance || 0
    );


  state.coins =
    coins;


  if (profileImage) {

    if (
      String(role).toLowerCase() ===
      "owner"
    ) {

      profileImage.src =
        "assets/owner.jpg";

      profileImage.alt =
        "Profile Owner";

    } else {

      profileImage.src =
        "assets/user.jpg";

      profileImage.alt =
        "Profile User";

    }

  }


  if (profileName) {

    profileName.textContent =
      String(role).toLowerCase() ===
      "owner"
        ? "Owner"
        : "User";

  }


  if (profileId) {

    profileId.textContent =
      user.id;

  }


  if (profileEmail) {

    profileEmail.textContent =
      profile.email ||
      user.email ||
      "-";

  }


  if (profileRole) {

    profileRole.textContent =
      String(role).toLowerCase() ===
      "owner"
        ? "owner"
        : "User";

  }


  if (profileCoins) {

    profileCoins.textContent =
      String(role).toLowerCase() ===
      "owner"
        ? "∞"
        : coins;

  }


  if (profileSince) {

    profileSince.textContent =
      formatDate(
        profile.created_at
      );

  }


  if (loginNavBtn) {

    loginNavBtn.textContent =
      "Akun";

  }


  if (coinBalance) {

    coinBalance.textContent =
      String(role).toLowerCase() ===
      "owner"
        ? "∞"
        : coins;

  }

}


// ========================================
// LOAD ACCOUNT
// ========================================

async function loadAccount() {

  const {
    data: {
      session
    },
    error: sessionError
  } =
    await supabase.auth.getSession();


  if (sessionError) {

    console.error(
      "Gagal mengambil session:",
      sessionError
    );

    renderGuestProfile();

    return;

  }


  if (!session) {

    renderGuestProfile();

    return;

  }


  state.session =
    session;

  state.user =
    session.user;


  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from("profiles")
      .select(
        "id, email, role, coin_balance, created_at"
      )
      .eq(
        "id",
        session.user.id
      )
      .single();


  if (profileError) {

    console.error(
      "Gagal mengambil profile:",
      profileError
    );

    showToast(
      "Data profile tidak dapat dimuat."
    );

    return;

  }


  renderUserProfile(
    session.user,
    profile
  );


  setupTopupRealtime(
    session.user
  );

}


// ========================================
// TOP UP REALTIME
// ========================================

let topupRealtimeChannel = null;

function setupTopupRealtime(user) {

  if (topupRealtimeChannel) {

    supabase.removeChannel(
      topupRealtimeChannel
    );

    topupRealtimeChannel =
      null;

  }


  if (!user) {
    return;
  }


  topupRealtimeChannel =
    supabase
      .channel(
        `topup-realtime-${user.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "topup_transactions",
          filter:
            `user_id=eq.${user.id}`
        },
        async (payload) => {

          const transaction =
            payload.new;


          if (
            String(
              transaction.status
            ).toLowerCase() === "paid"
          ) {

            if (
              currentTransactionId &&
              transaction.id ===
                currentTransactionId
            ) {

              stopQrisTimers();


              if (qrisStatus) {

                qrisStatus.textContent =
                  "Pembayaran berhasil. Koin sudah ditambahkan.";

              }


              if (qrisCountdown) {

                qrisCountdown.textContent =
                  "Pembayaran berhasil ✓";

              }


              await loadAccount();


              showToast(
                `Pembayaran berhasil. +${transaction.total_coins} Koin`
              );

            }

          }


          if (
            String(
              transaction.status
            ).toLowerCase() === "expired"
          ) {

            if (
              currentTransactionId &&
              transaction.id ===
                currentTransactionId
            ) {

              stopQrisTimers();


              if (qrisStatus) {

                qrisStatus.textContent =
                  "Pembayaran sudah kedaluwarsa.";

              }


              if (qrisCountdown) {

                qrisCountdown.textContent =
                  "QRIS kedaluwarsa";

              }

            }

          }

        }
      )
      .subscribe(
        (status) => {

          console.log(
            "TOP UP REALTIME STATUS:",
            status
          );

        }
      );

}


// ========================================
// PROFILE MODAL
// ========================================

function openProfileModal() {

  if (!profileModal) {
    return;
  }


  if (state.isLoggedIn) {

    if (guestProfileActions) {

      guestProfileActions.hidden =
        true;

    }


    if (logoutProfileActions) {

      logoutProfileActions.hidden =
        false;

    }

  } else {

    if (guestProfileActions) {

      guestProfileActions.hidden =
        false;

    }


    if (logoutProfileActions) {

      logoutProfileActions.hidden =
        true;

    }

  }


  profileModal.classList.add(
    "open"
  );

}


function closeProfileModalWindow() {

  if (!profileModal) {
    return;
  }

  profileModal.classList.remove(
    "open"
  );

}


// ========================================
// LOGIN REQUIRED MODAL
// ========================================

function openLoginRequiredModal() {

  if (!loginRequiredModal) {
    return;
  }

  loginRequiredModal.classList.add(
    "open"
  );

}


function closeLoginRequiredModal() {

  if (!loginRequiredModal) {
    return;
  }

  loginRequiredModal.classList.remove(
    "open"
  );

}


// ========================================
// TOP UP MODAL
// ========================================

function openTopupModal() {

  if (!state.isLoggedIn) {

    openLoginRequiredModal();

    return;

  }


  if (!topupModal) {
    return;
  }


  resetQrisView();


  topupModal.classList.add(
    "open"
  );


  renderBalance();

}


// ========================================
// CLOSE TOP UP
// ========================================

function closeTopupModal() {

  if (!topupModal) {
    return;
  }


  stopQrisTimers();


  topupModal.classList.remove(
    "open"
  );

}


// ========================================
// PROFILE CLICK
// ========================================

if (profileCard) {

  profileCard.addEventListener(
    "click",
    openProfileModal
  );


  profileCard.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openProfileModal();

      }

    }
  );

}


// ========================================
// LOGIN / ACCOUNT
// ========================================

if (loginNavBtn) {

  loginNavBtn.addEventListener(
    "click",
    () => {

      if (state.isLoggedIn) {

        openProfileModal();

      } else {

        window.location.href =
          "./index/login.html";

      }

    }
  );

}


// ========================================
// PROFILE MODAL BUTTONS
// ========================================

if (closeProfileModal) {

  closeProfileModal.addEventListener(
    "click",
    closeProfileModalWindow
  );

}


if (profileLoginBtn) {

  profileLoginBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "./index/login.html";

    }
  );

}


if (profileRegisterBtn) {

  profileRegisterBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "./index/register.html";

    }
  );

}


if (cancelLogoutBtn) {

  cancelLogoutBtn.addEventListener(
    "click",
    closeProfileModalWindow
  );

}


// ========================================
// LOGOUT
// ========================================

if (confirmLogoutBtn) {

  confirmLogoutBtn.addEventListener(
    "click",
    async () => {

      confirmLogoutBtn.disabled =
        true;

      confirmLogoutBtn.textContent =
        "Keluar...";


      const {
        error
      } =
        await supabase.auth.signOut();


      if (error) {

        console.error(
          "Logout gagal:",
          error
        );


        confirmLogoutBtn.disabled =
          false;

        confirmLogoutBtn.textContent =
          "Lanjutkan";


        showToast(
          "Gagal keluar dari akun."
        );

        return;

      }


      closeProfileModalWindow();

      renderGuestProfile();

      showToast(
        "Berhasil keluar dari akun."
      );

    }
  );

}


// ========================================
// PROFILE MODAL OUTSIDE CLICK
// ========================================

if (profileModal) {

  profileModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        profileModal
      ) {

        closeProfileModalWindow();

      }

    }
  );

}


// ========================================
// LOGIN REQUIRED BUTTONS
// ========================================

if (closeLoginRequired) {

  closeLoginRequired.addEventListener(
    "click",
    closeLoginRequiredModal
  );

}


if (cancelLoginRequired) {

  cancelLoginRequired.addEventListener(
    "click",
    closeLoginRequiredModal
  );

}


if (requiredLoginBtn) {

  requiredLoginBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "./index/login.html";

    }
  );

}


if (requiredRegisterBtn) {

  requiredRegisterBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "./index/register.html";

    }
  );

}


// ========================================
// LOGIN REQUIRED OUTSIDE CLICK
// ========================================

if (loginRequiredModal) {

  loginRequiredModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        loginRequiredModal
      ) {

        closeLoginRequiredModal();

      }

    }
  );

}


// ========================================
// TOP UP BUTTONS
// ========================================

const openTopup =
  document.getElementById("openTopup");

const heroTopup =
  document.getElementById("heroTopup");


if (openTopup) {

  openTopup.addEventListener(
    "click",
    openTopupModal
  );

}


if (heroTopup) {

  heroTopup.addEventListener(
    "click",
    openTopupModal
  );

}


// ========================================
// CLOSE TOP UP
// ========================================

const closeTopup =
  document.getElementById("closeTopup");


if (closeTopup) {

  closeTopup.addEventListener(
    "click",
    closeTopupModal
  );

}


if (topupModal) {

  topupModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        topupModal
      ) {

        closeTopupModal();

      }

    }
  );

}


// ========================================
// PACKAGE BUTTONS
// ========================================

document
  .querySelectorAll(".package")
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".package")
            .forEach(
              (item) => {

                item.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          state.isCustom =
            false;


          if (customCoins) {

            customCoins.value =
              "";

          }


          const coins =
            Number(
              button.dataset.coins
            );


          updateTopupDisplay(
            coins
          );

        }
      );

    }
  );


// ========================================
// CUSTOM COINS
// ========================================

if (customCoins) {

  customCoins.addEventListener(
    "input",
    () => {

      const coins =
        Number(
          customCoins.value
        );


      if (
        !coins ||
        coins < 1
      ) {

        if (topupTotal) {

          topupTotal.textContent =
            formatRupiah(0);

        }


        if (topupReward) {

          topupReward.textContent =
            "0 Koin";

        }


        if (customBonus) {

          customBonus.textContent =
            "Masukkan jumlah koin untuk melihat bonus.";

        }


        state.selectedCoins =
          0;

        state.bonusCoins =
          0;

        return;

      }


      document
        .querySelectorAll(".package")
        .forEach(
          (item) => {

            item.classList.remove(
              "active"
            );

          }
        );


      state.isCustom =
        true;


      updateTopupDisplay(
        coins
      );

    }
  );

}


// ========================================
// STOP QRIS TIMERS
// ========================================

function stopQrisTimers() {

  if (qrisStatusTimer) {

    clearInterval(
      qrisStatusTimer
    );

    qrisStatusTimer =
      null;

  }


  if (qrisCountdownTimer) {

    clearInterval(
      qrisCountdownTimer
    );

    qrisCountdownTimer =
      null;

  }

}


// ========================================
// SHOW QRIS
// ========================================

function showQrisPayment(payment) {

  if (
    !topupForm ||
    !qrisPayment
  ) {
    return;
  }


  if (qrisImage) {

    qrisImage.src =
      payment.qris_image ||
      payment.qris_url ||
      "";

  }


  if (qrisAmount) {

    qrisAmount.textContent =
      formatRupiah(
        payment.total_amount
      );

  }


  if (qrisCoins) {

    qrisCoins.textContent =
      `${payment.total_coins} Koin`;

  }


  if (qrisStatus) {

    qrisStatus.textContent =
      "Silakan selesaikan pembayaran melalui QRIS.";

  }


  if (qrisCountdown) {

    qrisCountdown.textContent =
      "Menunggu pembayaran...";

  }


  /*
   * Penting:
   * QRIS baru dibuka setelah backend
   * berhasil membuat transaksi.
   */

  topupForm.hidden =
    true;

  topupForm.style.display =
    "none";


  qrisPayment.hidden =
    false;

  qrisPayment.style.display =
    "block";

}


// ========================================
// COUNTDOWN
// ========================================

const TOPUP_EXPIRE_MINUTES = 61;

function startQrisCountdown(payment) {

  if (!qrisCountdown) {
    return;
  }

  if (qrisCountdownTimer) {
    clearInterval(qrisCountdownTimer);
  }

  let expiryTime = null;

  // ========================================
  // PRIORITAS 1: created_at + 61 menit
  // (paling reliable — konsisten sama backend)
  // ========================================

  if (payment && payment.created_at) {

    const created =
      new Date(payment.created_at).getTime();

    if (!Number.isNaN(created)) {
      expiryTime =
        created + TOPUP_EXPIRE_MINUTES * 60 * 1000;
    }

  }

  // ========================================
  // PRIORITAS 2: expired_at (asumsi UTC)
  // ========================================

  if (!expiryTime && payment && payment.expired_at) {

    const parsed =
      new Date(
        String(payment.expired_at)
          .replace(" ", "T") + "Z"
      );

    if (!Number.isNaN(parsed.getTime())) {
      expiryTime = parsed.getTime();
    }

  }

  // ========================================
  // PRIORITAS 3: fallback now + 61 menit
  // ========================================

  if (!expiryTime) {
    expiryTime =
      Date.now() + TOPUP_EXPIRE_MINUTES * 60 * 1000;
  }

  function updateCountdown() {

    const remaining = expiryTime - Date.now();

    if (remaining <= 0) {

      clearInterval(qrisCountdownTimer);
      qrisCountdownTimer = null;

      qrisCountdown.textContent =
        "QRIS sudah kedaluwarsa.";

      if (qrisStatus) {
        qrisStatus.textContent =
          "Silakan buat pembayaran baru.";
      }

      return;
    }

    const totalSeconds =
      Math.floor(remaining / 1000);

    const minutes =
      Math.floor(totalSeconds / 60);

    const seconds =
      totalSeconds % 60;

    qrisCountdown.textContent =
      `Berlaku ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  }

  updateCountdown();

  qrisCountdownTimer =
    setInterval(updateCountdown, 1000);

}


// ========================================
// CHECK PAYMENT STATUS
// ========================================

async function checkPaymentStatus() {

  if (
    !currentTransactionId ||
    !state.session
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        `${BACKEND_URL}/topup/status/${encodeURIComponent(currentTransactionId)}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${state.session.access_token}`
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

      console.error(
        "Gagal mengecek status pembayaran:",
        result
      );

      return;

    }


    const payment =
      result.data;


    // PAID
    if (
      String(
        payment.status
      ).toUpperCase() ===
      "PAID"
    ) {

      stopQrisTimers();


      if (qrisStatus) {

        qrisStatus.textContent =
          "Pembayaran berhasil. Koin sudah ditambahkan.";

      }


      if (qrisCountdown) {

        qrisCountdown.textContent =
          "Pembayaran berhasil ✓";

      }


      await loadAccount();


      showToast(
        `Pembayaran berhasil. +${payment.total_coins} Koin`
      );


      return;

    }


    // EXPIRED
    if (
      String(
        payment.status
      ).toUpperCase() ===
      "EXPIRED"
    ) {

      stopQrisTimers();


      if (qrisStatus) {

        qrisStatus.textContent =
          "Pembayaran sudah kedaluwarsa.";

      }


      if (qrisCountdown) {

        qrisCountdown.textContent =
          "QRIS kedaluwarsa";

      }

    }

  } catch (error) {

    console.error(
      "PAYMENT STATUS ERROR:",
      error
    );

  }

}


// ========================================
// START PAYMENT CHECK
// ========================================

function startPaymentStatusCheck() {

  /*
   * Cek sekali langsung.
   * Realtime Supabase menangani perubahan
   * status berikutnya.
   */

  checkPaymentStatus();

}


// ========================================
// CHECKOUT
// ========================================

if (checkoutBtn) {

  checkoutBtn.addEventListener(
    "click",
    async () => {

      if (!state.isLoggedIn) {

        closeTopupModal();

        openLoginRequiredModal();

        return;

      }


      const coins =
        Number(
          state.selectedCoins
        );


      if (
        !Number.isSafeInteger(coins) ||
        coins < 1
      ) {

        showToast(
          "Masukkan jumlah koin terlebih dahulu."
        );

        return;

      }


      if (
        !state.session ||
        !state.session.access_token
      ) {

        showToast(
          "Session login tidak ditemukan."
        );

        return;

      }


      checkoutBtn.disabled =
        true;

      checkoutBtn.textContent =
        "Membuat Pembayaran...";


      try {

        const response =
          await fetch(
            `${BACKEND_URL}/topup/create`,
            {
              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${state.session.access_token}`

              },

              body:
                JSON.stringify({
                  coins: coins
                })

            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          !result.status ||
          !result.data
        ) {

          console.error(
            "CREATE PAYMENT ERROR:",
            result
          );


          showToast(
            result.message ||
            "Gagal membuat pembayaran."
          );

          return;

        }


        const payment =
          result.data;


        currentTransactionId =
          payment.transaction_id;


        showQrisPayment(
          payment
        );


        startQrisCountdown(payment);


        startPaymentStatusCheck();

      } catch (error) {

        console.error(
          "CHECKOUT ERROR:",
          error
        );


        showToast(
          "Tidak dapat terhubung ke server pembayaran."
        );

      } finally {

        checkoutBtn.disabled =
          false;

        checkoutBtn.textContent =
          "Lanjutkan Pembayaran";

      }

    }
  );

}


// ========================================
// CANCEL / BACK QRIS
// ========================================

if (cancelQris) {

  cancelQris.addEventListener(
    "click",
    () => {

      resetQrisView();

    }
  );

}


// ========================================
// BSTATION
// ========================================

const bstationBtn =
  document.getElementById("bstationBtn");

if (bstationBtn) {

  bstationBtn.addEventListener(
    "click",
    () => {

      if (!state.isLoggedIn) {
        const loginRequiredModal =
          document.getElementById("loginRequiredModal");

        if (loginRequiredModal) {
          loginRequiredModal.classList.add("open");
        }

        return;
      }

      window.location.href =
        "index/bstation.html";

    }
  );

}


// ========================================
// PREMIUM PRODUCTS
// ========================================

document
  .querySelectorAll(
    ".buy-btn:not(.disabled)"
  )
  .forEach(
    (button) => {

      /*
       * BStation memakai handler sendiri.
       */

      if (
        button.id ===
        "bstationBtn"
      ) {
        return;
      }


      button.addEventListener(
        "click",
        (event) => {

          if (!state.isLoggedIn) {

            event.preventDefault();

            openLoginRequiredModal();

            return;

          }


          const product =
            button.dataset.product;

          const price =
            Number(
              button.dataset.price
            );


          /*
           * Alight Motion adalah halaman
           * tersendiri, jadi jangan ditahan
           * oleh handler demo ini.
           */

          if (
            button.tagName === "A" &&
            button.getAttribute("href")
          ) {

            return;

          }


          // OWNER
          if (
            state.profile &&
            String(
              state.profile.role
            ).toLowerCase() ===
            "owner"
          ) {

            showToast(
              `${product} siap digunakan.`
            );

            return;

          }


          // USER
          if (
            state.coins < price
          ) {

            openTopupModal();

            showToast(
              `Koin tidak cukup untuk ${product}.`
            );

            return;

          }


          showToast(
            `${product} akan diproses setelah sistem produk tersambung.`
          );

        }
      );

    }
  );


// ========================================
// AUTH STATE CHANGE
// ========================================

supabase.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Auth event:",
      event
    );


    if (
      event === "SIGNED_OUT"
    ) {

      if (topupRealtimeChannel) {

        supabase.removeChannel(
          topupRealtimeChannel
        );

        topupRealtimeChannel =
          null;

      }


      renderGuestProfile();

      return;

    }


    if (
      session &&
      (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION"
      )
    ) {

      setTimeout(
        () => {
          loadAccount();
        },
        0
      );

    }

  }
);


// ========================================
// INITIALIZE
// ========================================

async function initialize() {

  /*
   * Halaman selalu mulai dari
   * kondisi form top up normal.
   */

  resetQrisView();

  updateTopupDisplay(1);


  /*
   * Tunggu account selesai dimuat.
   * Ini penting supaya state.session
   * dan state.isLoggedIn sudah tersedia.
   */

  await loadAccount();


  // ========================================
  // URL PARAMETER
  // ========================================

  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  // ========================================
  // OPEN TOP UP NORMAL
  // ========================================

  if (
    urlParams.get("open_topup") === "1"
  ) {

    openTopupModal();

  }


  // ========================================
  // REOPEN QRIS DARI RIWAYAT
  // ========================================

  if (
    urlParams.get("reopen_topup") === "1"
  ) {

    const savedPayment =
      sessionStorage.getItem(
        "dragon_reopen_topup"
      );


    if (!savedPayment) {

      showToast(
        "Data pembayaran tidak ditemukan."
      );

    } else {

      try {

        const payment =
          JSON.parse(
            savedPayment
          );


        /*
         * Pastikan user masih login.
         */

        if (
          !state.isLoggedIn ||
          !state.session
        ) {

          openLoginRequiredModal();

        } else {

          /*
           * Ambil ID transaksi.
           *
           * Bisa berasal dari:
           * payment.id
           * atau
           * payment.transaction_id
           */

          const transactionId =
            payment.id ||
            payment.transaction_id;


          if (!transactionId) {

            console.error(
              "DATA PAYMENT REOPEN:",
              payment
            );

            showToast(
              "ID transaksi tidak ditemukan."
            );

          } else {

            /*
             * Simpan ID transaksi lama.
             *
             * JANGAN membuat transaksi baru.
             */

            currentTransactionId =
              transactionId;


            /*
             * Tampilkan QRIS lama.
             */

            showQrisPayment(
              payment
            );


            /*
             * Jalankan countdown berdasarkan
             * waktu expired transaksi lama.
             */

            startQrisCountdown(payment);


            /*
             * Cek status pembayaran langsung.
             */

            startPaymentStatusCheck();

          }

        }


        /*
         * Data sessionStorage tidak perlu
         * disimpan terus setelah berhasil
         * dipindahkan ke state halaman.
         */

        sessionStorage.removeItem(
          "dragon_reopen_topup"
        );


      } catch (error) {

        console.error(
          "REOPEN QRIS ERROR:",
          error
        );


        sessionStorage.removeItem(
          "dragon_reopen_topup"
        );


        showToast(
          "Data pembayaran tidak valid."
        );

      }

    }

  }


  // ========================================
  // BERSIHKAN URL
  // ========================================

  if (
    urlParams.get("open_topup") === "1" ||
    urlParams.get("reopen_topup") === "1"
  ) {

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

  }

}


// ========================================
// START
// ========================================

initialize();