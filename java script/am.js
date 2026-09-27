import { supabase } from "./supabase.js";


/* =========================
   BACKEND
========================= */

const BACKEND_URL =
  "http://sg.ypnode.my.id:4020";


/* =========================
   ELEMENTS
========================= */

const coinBalance =
  document.getElementById("coinBalance");

const emailInput =
  document.getElementById("email");

const magicLinkInput =
  document.getElementById("magicLink");

const sendBtn =
  document.getElementById("sendBtn");

const verifyBtn =
  document.getElementById("verifyBtn");

const purchaseBtn =
  document.getElementById("purchaseBtn");

const backEmailBtn =
  document.getElementById("backEmailBtn");

const errorBox =
  document.getElementById("errorBox");

const errorText =
  document.getElementById("errorText");

const verifiedEmail =
  document.getElementById("verifiedEmail");

const loadingTitle =
  document.getElementById("loadingTitle");

const loadingText =
  document.getElementById("loadingText");


/* =========================
   PANELS
========================= */

const panels = {

  email:
    document.getElementById("stepEmail"),

  link:
    document.getElementById("stepLink"),

  verify:
    document.getElementById("stepVerify"),

  purchase:
    document.getElementById("stepPurchase"),

  loading:
    document.getElementById("stepLoading")

};


/* =========================
   INDICATORS
========================= */

const indicators = {

  email:
    document.getElementById("indicatorEmail"),

  link:
    document.getElementById("indicatorLink"),

  verify:
    document.getElementById("indicatorVerify"),

  purchase:
    document.getElementById("indicatorPurchase")

};


/* =========================
   STATE
========================= */

let verified = false;

let verifiedIdToken = null;


/* =========================
   GET SESSION
========================= */

async function getSession() {

  const {
    data,
    error
  } = await supabase.auth.getSession();


  if (error) {

    throw new Error(
      "Gagal mengambil sesi login."
    );

  }


  if (!data?.session?.access_token) {

    throw new Error(
      "Silakan login terlebih dahulu."
    );

  }


  return data.session;

}


/* =========================
   LOAD COIN BALANCE
========================= */

async function loadCoinBalance() {

  if (!coinBalance) {
    return;
  }


  try {

    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();


    if (!session) {

      coinBalance.textContent = "0";

      return;

    }


    const {
      data: profile,
      error
    } = await supabase
      .from("profiles")
      .select(
        "coin_balance, role"
      )
      .eq(
        "id",
        session.user.id
      )
      .single();


    if (error) {

      throw error;

    }


    if (
      profile?.role === "owner"
    ) {

      coinBalance.textContent = "∞";

      return;

    }


    coinBalance.textContent =
      String(
        Number(
          profile?.coin_balance || 0
        )
      );

  } catch (error) {

    console.error(
      "Gagal mengambil saldo koin:",
      error
    );

    coinBalance.textContent = "0";

  }

}


/* =========================
   BACKEND REQUEST
========================= */

async function backendRequest(
  endpoint,
  options = {}
) {

  const session =
    await getSession();


  const response =
    await fetch(
      `${BACKEND_URL}${endpoint}`,
      {
        ...options,

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${session.access_token}`,

          ...(options.headers || {})

        }

      }
    );


  let data;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      "Server mengirim response yang tidak valid."
    );

  }


  if (
    !response.ok ||
    data?.status === false
  ) {

    throw new Error(
      data?.message ||
      "Terjadi kesalahan pada server."
    );

  }


  return data;

}


/* =========================
   SHOW STEP
========================= */

function showStep(step) {

  Object.values(panels).forEach(
    panel => {

      if (panel) {

        panel.classList.remove(
          "active"
        );

      }

    }
  );


  if (panels[step]) {

    panels[step].classList.add(
      "active"
    );

  }


  Object.values(indicators).forEach(
    indicator => {

      if (indicator) {

        indicator.classList.remove(
          "active"
        );

      }

    }
  );


  if (indicators[step]) {

    indicators[step].classList.add(
      "active"
    );

  }


  hideError();

}


/* =========================
   ERROR
========================= */

function showError(message) {

  if (errorText) {

    errorText.textContent =
      message;

  }


  if (errorBox) {

    errorBox.classList.add(
      "show"
    );

  }

}


function hideError() {

  if (errorBox) {

    errorBox.classList.remove(
      "show"
    );

  }

}


/* =========================
   LOADING
========================= */

function showLoading(
  title,
  text
) {

  if (loadingTitle) {

    loadingTitle.textContent =
      title;

  }


  if (loadingText) {

    loadingText.textContent =
      text;

  }


  showStep("loading");

}


/* =========================
   STEP 1
   SEND MAGIC LINK
========================= */

sendBtn?.addEventListener(
  "click",
  async () => {

    hideError();


    const email =
      emailInput.value.trim();


    if (!email) {

      showError(
        "Masukkan email terlebih dahulu."
      );

      return;

    }


    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {

      showError(
        "Format email tidak valid."
      );

      return;

    }


    sendBtn.disabled = true;

    sendBtn.textContent =
      "Mengirim...";


    try {

      await backendRequest(
        "/alight/request",
        {
          method: "POST",

          body: JSON.stringify({
            email
          })

        }
      );


      sessionStorage.setItem(
        "dragon_alight_email",
        email
      );


      sessionStorage.removeItem(
        "dragon_alight_token"
      );


      sessionStorage.removeItem(
        "dragon_alight_link"
      );


      verified = false;

      verifiedIdToken = null;


      showStep("link");

    } catch (error) {

      showError(
        error.message ||
        "Gagal mengirim Magic Link."
      );

    } finally {

      sendBtn.disabled = false;

      sendBtn.textContent =
        "Kirim Magic Link";

    }

  }
);


/* =========================
   STEP 2
   VERIFY MAGIC LINK
========================= */

verifyBtn?.addEventListener(
  "click",
  async () => {

    hideError();


    const email =
      emailInput.value.trim();


    const rawLink =
      magicLinkInput.value.trim();


    if (!email) {

      showError(
        "Email tidak ditemukan."
      );

      return;

    }


    if (!rawLink) {

      showError(
        "Masukkan Magic Link terlebih dahulu."
      );

      return;

    }


    verifyBtn.disabled = true;

    verifyBtn.textContent =
      "Memverifikasi...";


    try {

      showLoading(
        "Memverifikasi akun...",
        "Sedang memeriksa Magic Link."
      );


      const result =
        await backendRequest(
          "/alight/verify",
          {
            method: "POST",

            body: JSON.stringify({
              email,
              rawLink
            })

          }
        );


      const idToken =
        result?.idToken ||
        result?.data?.idToken ||
        null;


      if (!idToken) {

        throw new Error(
          "Verifikasi berhasil tetapi token aktivasi tidak ditemukan."
        );

      }


      verified = true;

      verifiedIdToken =
        idToken;


      sessionStorage.setItem(
        "dragon_alight_email",
        email
      );


      sessionStorage.setItem(
        "dragon_alight_link",
        rawLink
      );


      sessionStorage.setItem(
        "dragon_alight_token",
        idToken
      );


      if (verifiedEmail) {

        verifiedEmail.textContent =
          email;

      }


      showStep("verify");

    } catch (error) {

      showStep("link");

      showError(
        error.message ||
        "Verifikasi Magic Link gagal."
      );

    } finally {

      verifyBtn.disabled = false;

      verifyBtn.textContent =
        "Verifikasi Link";

    }

  }
);


/* =========================
   BACK TO EMAIL
========================= */

backEmailBtn?.addEventListener(
  "click",
  () => {

    hideError();

    showStep("email");

  }
);


/* =========================
   STEP 3
   DRAGON MAGIC
========================= */

purchaseBtn?.addEventListener(
  "click",
  async () => {

    hideError();


    const email =
      sessionStorage.getItem(
        "dragon_alight_email"
      ) ||
      emailInput.value.trim();


    const idToken =
      verifiedIdToken ||
      sessionStorage.getItem(
        "dragon_alight_token"
      );


    if (
      !verified ||
      !idToken
    ) {

      showError(
        "Akun belum berhasil diverifikasi."
      );

      return;

    }


    const confirmed =
      window.confirm(
        "Aktifkan Alight Motion Prem dengan 1 koin?"
      );


    if (!confirmed) {
      return;
    }


    purchaseBtn.disabled = true;

    purchaseBtn.textContent =
      "Memproses...";


    try {

      showLoading(
        "Memproses Dragon Magic...",
        "Sedang mengaktifkan Alight Motion Prem."
      );


      const result =
        await backendRequest(
          "/alight/purchase",
          {
            method: "POST",

            body: JSON.stringify({
              email,
              idToken
            })

          }
        );


      if (
        result?.status !== true
      ) {

        throw new Error(
          result?.message ||
          "Aktivasi premium gagal."
        );

      }


      sessionStorage.removeItem(
        "dragon_alight_token"
      );


      sessionStorage.removeItem(
        "dragon_alight_link"
      );


      verified = false;

      verifiedIdToken = null;


      /*
       * Refresh saldo setelah
       * pembelian berhasil.
       */
      await loadCoinBalance();


      showStep("purchase");

    } catch (error) {

      showStep("verify");

      showError(
        error.message ||
        "Gagal mengaktifkan Alight Motion Prem."
      );

    } finally {

      purchaseBtn.disabled = false;

      purchaseBtn.textContent =
        "Dragon Magic";

    }

  }
);


/* =========================
   RESTORE EMAIL
========================= */

const savedEmail =
  sessionStorage.getItem(
    "dragon_alight_email"
  );


if (savedEmail) {

  emailInput.value =
    savedEmail;

}


/* =========================
   INITIALIZE
========================= */

showStep("email");

loadCoinBalance();
