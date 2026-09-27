import { supabase } from "./supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const BACKEND_URL =
    "https://dragon-store-api.gunawanstanlie.workers.dev/";

const VIU_PRICE = 3;


/* =========================================================
   STATE
========================================================= */

let currentSession = null;
let currentRole = "user";
let currentCoinBalance = 0;

let selectedPurchase = false;
let purchaseRunning = false;

let currentPasswordVisible = false;
let currentAccountPassword = "";


/* =========================================================
   ELEMENTS
========================================================= */

const coinBalanceEl =
    document.getElementById("coinBalance");

const heroCoinBalanceEl =
    document.getElementById("heroCoinBalance");

const viuStockEl =
    document.getElementById("viuStock");

const viuBuyBtn =
    document.getElementById("viuBuyBtn");

const viuHistoryEl =
    document.getElementById("viuHistory");

const viuHistoryCountEl =
    document.getElementById("viuHistoryCount");


/* Purchase modal */

const viuPurchaseModal =
    document.getElementById("viuPurchaseModal");

const viuModalText =
    document.getElementById("viuModalText");

const viuModalClose =
    document.getElementById("viuModalClose");

const viuCancelBtn =
    document.getElementById("viuCancelBtn");

const viuConfirmBtn =
    document.getElementById("viuConfirmBtn");


/* Account modal */

const viuAccountModal =
    document.getElementById("viuAccountModal");

const viuAccountClose =
    document.getElementById("viuAccountClose");

const viuAccountLogin =
    document.getElementById("viuAccountLogin");

const viuAccountPassword =
    document.getElementById("viuAccountPassword");

const viuAccountDate =
    document.getElementById("viuAccountDate");

const viuAccountOrderId =
    document.getElementById("viuAccountOrderId");

const viuPasswordToggle =
    document.getElementById("viuPasswordToggle");


/* Toast */

const viuToast =
    document.getElementById("viuToast");


/* =========================================================
   HELPERS
========================================================= */

function showToast(message) {

    if (!viuToast) return;

    viuToast.textContent = message;

    viuToast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        viuToast.classList.remove("show");
    }, 3000);
}


function formatNumber(number) {

    if (!Number.isFinite(Number(number))) {
        return "∞";
    }

    return Number(number).toLocaleString("id-ID");
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   MODAL HELPERS
========================================================= */

function openModal(modal) {

    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("viu-modal-open");
}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (
        !viuPurchaseModal.classList.contains("is-open") &&
        !viuAccountModal.classList.contains("is-open")
    ) {
        document.body.classList.remove("viu-modal-open");
    }
}


/* =========================================================
   AUTH
========================================================= */

async function loadSession() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error(
            "[Viu] Gagal mengambil session:",
            error
        );

        return null;
    }

    currentSession = data.session;

    return currentSession;
}


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!currentSession?.user?.id) {
        currentRole = "guest";
        currentCoinBalance = 0;

        updateBalanceUI();

        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("role, coin_balance")
        .eq("id", currentSession.user.id)
        .single();

    if (error) {

        console.error(
            "[Viu] Gagal mengambil profile:",
            error
        );

        currentRole = "user";
        currentCoinBalance = 0;

        updateBalanceUI();

        return;
    }

    currentRole =
        data?.role || "user";

    if (currentRole === "owner") {

        currentCoinBalance = Infinity;

    } else {

        currentCoinBalance =
            Number(data?.coin_balance || 0);
    }

    updateBalanceUI();
}


function updateBalanceUI() {

    const balanceText =
        currentRole === "owner"
            ? "∞"
            : formatNumber(currentCoinBalance);

    if (coinBalanceEl) {
        coinBalanceEl.textContent =
            balanceText;
    }

    if (heroCoinBalanceEl) {
        heroCoinBalanceEl.textContent =
            balanceText;
    }
}


/* =========================================================
   BACKEND FETCH
========================================================= */

async function backendFetch(
    endpoint,
    options = {},
    retry = true
) {

    let session =
        currentSession;

    if (!session) {
        session = await loadSession();
    }

    const headers = new Headers(
        options.headers || {}
    );

    headers.set(
        "Content-Type",
        "application/json"
    );

    if (session?.access_token) {

        headers.set(
            "Authorization",
            `Bearer ${session.access_token}`
        );
    }

    let response;

    try {

        response = await fetch(
            `${BACKEND_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    } catch (error) {

        console.error(
            "[Viu] Backend tidak dapat dihubungi:",
            error
        );

        throw new Error(
            "Server sedang tidak dapat dihubungi."
        );
    }


    /* Refresh token jika 401 */

    if (
        response.status === 401 &&
        retry
    ) {

        const {
            data,
            error
        } = await supabase.auth.refreshSession();

        if (
            !error &&
            data?.session
        ) {

            currentSession =
                data.session;

            return backendFetch(
                endpoint,
                options,
                false
            );
        }
    }


    let result = null;

    try {
        result =
            await response.json();
    } catch {
        result = null;
    }


    if (!response.ok) {

        throw new Error(
            result?.error ||
            result?.message ||
            `Request gagal (${response.status})`
        );
    }


    return result;
}


/* =========================================================
   LOAD PRODUCT
========================================================= */

async function loadViuProduct() {

    if (!viuStockEl || !viuBuyBtn) {
        return;
    }

    viuStockEl.textContent =
        "Memuat...";

    viuBuyBtn.disabled = true;
    viuBuyBtn.textContent =
        "Memuat...";


    try {

        const result =
            await backendFetch(
                "/viu/products",
                {
                    method: "GET"
                }
            );


const stock =
    Number(result?.data?.stock || 0);


        viuStockEl.textContent =
            formatNumber(stock);


        if (stock <= 0) {

            viuBuyBtn.disabled = true;

            viuBuyBtn.textContent =
                "Stok Habis";

            return;
        }


        if (!currentSession) {

            viuBuyBtn.disabled = true;

            viuBuyBtn.textContent =
                "Login untuk Membeli";

            return;
        }


        if (
            currentRole !== "owner" &&
            currentCoinBalance < VIU_PRICE
        ) {

            viuBuyBtn.disabled = true;

            viuBuyBtn.textContent =
                "Koin Tidak Cukup";

            return;
        }


        viuBuyBtn.disabled = false;

        viuBuyBtn.textContent =
            `Beli ${VIU_PRICE} Koin`;

    } catch (error) {

        console.error(
            "[Viu] Gagal memuat produk:",
            error
        );

        viuStockEl.textContent =
            "-";

        viuBuyBtn.disabled = true;

        viuBuyBtn.textContent =
            "Gagal Memuat";

        showToast(error.message);
    }
}


/* =========================================================
   OPEN PURCHASE MODAL
========================================================= */

function openPurchaseModal() {

    if (!currentSession) {

        showToast(
            "Silakan login terlebih dahulu."
        );

        return;
    }


    if (
        currentRole !== "owner" &&
        currentCoinBalance < VIU_PRICE
    ) {

        showToast(
            "Koin kamu tidak cukup."
        );

        return;
    }


    if (viuModalText) {

        viuModalText.textContent =
            currentRole === "owner"
                ? "Sebagai owner, pembelian ini tidak akan mengurangi koin."
                : `Kamu akan membeli Viu Premium dengan harga ${VIU_PRICE} Koin.`;
    }


    selectedPurchase = true;

    openModal(viuPurchaseModal);
}


/* =========================================================
   PURCHASE VIU
========================================================= */

async function purchaseViu() {

    if (purchaseRunning) {
        return;
    }

    if (!selectedPurchase) {
        return;
    }

    if (!currentSession) {

        showToast(
            "Silakan login terlebih dahulu."
        );

        closeModal(viuPurchaseModal);

        return;
    }


    purchaseRunning = true;

    if (viuConfirmBtn) {

        viuConfirmBtn.disabled = true;

        viuConfirmBtn.textContent =
            "Memproses...";
    }


    try {

        const result =
            await backendFetch(
                "/viu/purchase",
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );


        if (!result?.status) {

    throw new Error(
        result?.message ||
        "Pembelian gagal."
    );
}


        closeModal(
            viuPurchaseModal
        );


        /*
         * Backend langsung mengirim
         * credentials akun yang dibeli.
         */

        if (result.data) {

    openAccountModal({
        login: result.data.login,
        password: result.data.password,
        order_id: result.data.order_id,
        purchased_at: result.data.purchased_at
    });

} else {

    showToast(
        "Pembelian berhasil."
    );
}

        /* Update saldo dari response */

        if (
            result.coin_balance !== undefined
        ) {

            currentCoinBalance =
                Number(result.coin_balance);

            updateBalanceUI();

        } else {

            await loadProfile();
        }


        /* Refresh stock */

        await loadViuProduct();

        /* Refresh history */

        await loadHistory();


    } catch (error) {

        console.error(
            "[Viu] Pembelian gagal:",
            error
        );

        showToast(
            error.message ||
            "Pembelian gagal."
        );

    } finally {

        purchaseRunning = false;

        if (viuConfirmBtn) {

            viuConfirmBtn.disabled = false;

            viuConfirmBtn.textContent =
                "Beli Sekarang";
        }

        selectedPurchase = false;
    }
}


/* =========================================================
   LOAD PURCHASE HISTORY
========================================================= */

async function loadHistory() {

    if (!viuHistoryEl) {
        return;
    }


    viuHistoryEl.innerHTML = `
        <div class="viu-empty-state">
            <div class="viu-empty-icon">
                V
            </div>

            <h3>Memuat riwayat...</h3>

            <p>
                Sedang mengambil akun yang pernah dibeli.
            </p>
        </div>
    `;


    try {

        const result =
            await backendFetch(
                "/viu/my-purchases",
                {
                    method: "GET"
                }
            );


        const purchases =
    Array.isArray(result?.data)
        ? result.data
        : [];
        

        if (viuHistoryCountEl) {

            viuHistoryCountEl.textContent =
                purchases.length;
        }


        if (!purchases.length) {

            renderEmptyHistory();

            return;
        }


        renderHistory(
            purchases
        );


    } catch (error) {

        console.error(
            "[Viu] Gagal memuat riwayat:",
            error
        );


        if (viuHistoryCountEl) {
            viuHistoryCountEl.textContent =
                "0";
        }


        viuHistoryEl.innerHTML = `
            <div class="viu-empty-state">
                <div class="viu-empty-icon">
                    !
                </div>

                <h3>Gagal memuat riwayat</h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


/* =========================================================
   EMPTY HISTORY
========================================================= */

function renderEmptyHistory() {

    viuHistoryEl.innerHTML = `
        <div class="viu-empty-state">

            <div class="viu-empty-icon">
                V
            </div>

            <h3>Belum ada akun</h3>

            <p>
                Akun Viu yang kamu beli akan
                muncul di sini.
            </p>

        </div>
    `;
}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderHistory(
    purchases
) {

    viuHistoryEl.innerHTML =
        purchases
            .map(
                purchase =>
                    createHistoryCard(
                        purchase
                    )
            )
            .join("");
}


function createHistoryCard(
    purchase
) {

    const orderId =
        purchase.order_id ||
        purchase.id ||
        "-";


    const date =
        formatDate(
            purchase.purchased_at
        );


    return `
        <article
            class="viu-history-card"
            data-order-id="${escapeHTML(orderId)}"
        >

            <div class="viu-history-card-header">

                <div class="viu-history-product">

                    <div class="viu-history-product-icon">
                        <img
                            src="../assets/viu.jpg"
                            alt="Viu"
                        >
                    </div>

                    <div>
                        <strong>
                            Viu Premium
                        </strong>

                        <span>
                            Lifetime
                        </span>
                    </div>

                </div>

                <span class="viu-history-price">
                    ${escapeHTML(
                        purchase.price ?? VIU_PRICE
                    )} Koin
                </span>

            </div>


            <div class="viu-history-fields">

                <div class="viu-history-field">

                    <span>
                        Tanggal
                    </span>

                    <strong>
                        ${escapeHTML(date)}
                    </strong>

                </div>


                <div class="viu-history-field">

                    <span>
                        ID Pemesanan
                    </span>

                    <strong>
                        ${escapeHTML(orderId)}
                    </strong>

                </div>

            </div>


            <button
                type="button"
                class="viu-history-view-btn"
                data-view-order="${escapeHTML(orderId)}"
            >
                Lihat Akun
            </button>

        </article>
    `;
}


/* =========================================================
   VIEW ACCOUNT
========================================================= */

async function viewAccount(
    orderId
) {

    if (!orderId) {
        return;
    }


    try {

        showToast(
            "Mengambil data akun..."
        );


        const result =
            await backendFetch(
                `/viu/account/${encodeURIComponent(orderId)}`,
                {
                    method: "GET"
                }
            );


        const account =
    result?.data ||
    result?.account ||
    result;


        if (!account) {

            throw new Error(
                "Data akun tidak ditemukan."
            );
        }


        openAccountModal(
            account
        );


    } catch (error) {

        console.error(
            "[Viu] Gagal mengambil akun:",
            error
        );

        showToast(
            error.message ||
            "Gagal mengambil akun."
        );
    }
}


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal(
    account
) {

    const login =
        account.login ||
        account.email ||
        account.phone ||
        "-";


    const password =
        account.password ||
        "-";


    const orderId =
        account.order_id ||
        account.orderId ||
        "-";


    const purchasedAt =
        account.purchased_at ||
        account.sold_at ||
        account.created_at ||
        null;


    currentAccountPassword =
        String(password);


    currentPasswordVisible = false;


    if (viuAccountLogin) {

        viuAccountLogin.textContent =
            login;

        viuAccountLogin.dataset.copyValue =
            login;
    }


    if (viuAccountPassword) {

        viuAccountPassword.textContent =
            "••••••••••";

        viuAccountPassword.classList.add(
            "viu-password-hidden"
        );

        viuAccountPassword.dataset.copyValue =
            password;
    }


    if (viuPasswordToggle) {

        viuPasswordToggle.textContent =
            "Lihat";
    }


    if (viuAccountDate) {

        viuAccountDate.textContent =
            formatDate(purchasedAt);
    }


    if (viuAccountOrderId) {

        viuAccountOrderId.textContent =
            orderId;

        viuAccountOrderId.dataset.copyValue =
            orderId;
    }


    openModal(
        viuAccountModal
    );
}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function togglePassword() {

    if (!viuAccountPassword) {
        return;
    }


    currentPasswordVisible =
        !currentPasswordVisible;


    if (currentPasswordVisible) {

        viuAccountPassword.textContent =
            currentAccountPassword;

        viuAccountPassword.classList.remove(
            "viu-password-hidden"
        );

        if (viuPasswordToggle) {
            viuPasswordToggle.textContent =
                "Sembunyikan";
        }

    } else {

        viuAccountPassword.textContent =
            "••••••••••";

        viuAccountPassword.classList.add(
            "viu-password-hidden"
        );

        if (viuPasswordToggle) {
            viuPasswordToggle.textContent =
                "Lihat";
        }
    }
}


/* =========================================================
   COPY
========================================================= */

async function copyElementValue(
    element
) {

    if (!element) {
        return;
    }


    const value =
        element.dataset.copyValue ||
        element.textContent;


    if (
        !value ||
        value === "-" ||
        value.includes("••")
    ) {

        showToast(
            "Tidak ada data untuk disalin."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            value
        );

        showToast(
            "Berhasil disalin."
        );

    } catch (error) {

        console.error(
            "[Viu] Clipboard gagal:",
            error
        );

        showToast(
            "Gagal menyalin data."
        );
    }
}


/* =========================================================
   EVENT: HISTORY
========================================================= */

viuHistoryEl?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-view-order]"
            );

        if (!button) {
            return;
        }


        const orderId =
            button.dataset.viewOrder;


        viewAccount(
            orderId
        );
    }
);


/* =========================================================
   EVENT: COPY
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-copy-target]"
            );

        if (!button) {
            return;
        }


        const targetId =
            button.dataset.copyTarget;


        const target =
            document.getElementById(
                targetId
            );


        copyElementValue(
            target
        );
    }
);


/* =========================================================
   EVENT: PURCHASE
========================================================= */

viuBuyBtn?.addEventListener(
    "click",
    openPurchaseModal
);


viuConfirmBtn?.addEventListener(
    "click",
    purchaseViu
);


/* =========================================================
   EVENT: PURCHASE MODAL
========================================================= */

viuModalClose?.addEventListener(
    "click",
    () => {
        selectedPurchase = false;

        closeModal(
            viuPurchaseModal
        );
    }
);


viuCancelBtn?.addEventListener(
    "click",
    () => {
        selectedPurchase = false;

        closeModal(
            viuPurchaseModal
        );
    }
);


/* =========================================================
   EVENT: ACCOUNT MODAL
========================================================= */

viuAccountClose?.addEventListener(
    "click",
    () => {
        closeModal(
            viuAccountModal
        );
    }
);


viuPasswordToggle?.addEventListener(
    "click",
    togglePassword
);


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

viuPurchaseModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            viuPurchaseModal
        ) {

            selectedPurchase = false;

            closeModal(
                viuPurchaseModal
            );
        }
    }
);


viuAccountModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            viuAccountModal
        ) {

            closeModal(
                viuAccountModal
            );
        }
    }
);


/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {
            return;
        }


        selectedPurchase = false;

        closeModal(
            viuPurchaseModal
        );

        closeModal(
            viuAccountModal
        );
    }
);


/* =========================================================
   AUTH STATE
========================================================= */

supabase.auth.onAuthStateChange(
    async (_event, session) => {

        currentSession =
            session;

        await loadProfile();

        await loadViuProduct();

        await loadHistory();
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function init() {

    console.log(
        "[Viu] Initializing..."
    );


    await loadSession();

    await loadProfile();

    await loadViuProduct();

    await loadHistory();


    console.log(
        "[Viu] Ready."
    );
}


init();