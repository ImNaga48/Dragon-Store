import { supabase } from "./supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const BACKEND_URL =
    "https://dragon-store-api.gunawanstanlie.workers.dev/";


/* =========================================================
   STATE
========================================================= */

let selectedAccountId = null;

let selectedAccountPrice = 0;

let currentCoinBalance = 0;

let currentRole = "user";

let ownedAccountIds = new Set();

let ownedAccounts = [];

let productsData = [];

let pageLoading = false;

let refreshRunning = false;


/* =========================================================
   DOM
========================================================= */

let productsContainer;

let productCount;

let modal;
let modalText;

let cancelBtn;
let confirmBtn;

let coinBalance;
let heroCoinBalance;


/* =========================================================
   GET ELEMENTS
========================================================= */

function getElements() {

    productsContainer =
        document.getElementById(
            "bstationProducts"
        );

    productCount =
        document.getElementById(
            "productCount"
        );

    modal =
        document.getElementById(
            "bstationModal"
        );

    modalText =
        document.getElementById(
            "bstationModalText"
        );

    cancelBtn =
        document.getElementById(
            "bstationCancelBtn"
        );

    confirmBtn =
        document.getElementById(
            "bstationConfirmBtn"
        );

    coinBalance =
        document.getElementById(
            "coinBalance"
        );

    heroCoinBalance =
        document.getElementById(
            "heroCoinBalance"
        );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   SESSION
========================================================= */

async function getSession() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();

        if (error) {

            console.error(
                "[Bstation] Session error:",
                error
            );

            return null;
        }

        return (
            data?.session ||
            null
        );

    } catch (error) {

        console.error(
            "[Bstation] Session exception:",
            error
        );

        return null;
    }
}


/* =========================================================
   REFRESH SESSION
========================================================= */

async function refreshSession() {

    try {

        console.log(
            "[Bstation] Refreshing Supabase session..."
        );

        const {
            data,
            error
        } =
            await supabase.auth.refreshSession();

        if (error) {

            console.error(
                "[Bstation] Session refresh error:",
                error
            );

            return null;
        }

        return (
            data?.session ||
            null
        );

    } catch (error) {

        console.error(
            "[Bstation] Session refresh exception:",
            error
        );

        return null;
    }
}


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadProfile() {

    const session =
        await getSession();


    /*
     * Belum login
     */

    if (!session) {

        currentCoinBalance = 0;

        currentRole = "guest";

        updateBalanceUI();

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
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

            console.error(
                "[Bstation] Profile error:",
                error
            );

            currentCoinBalance = 0;

            currentRole = "user";

            updateBalanceUI();

            return;
        }


        currentRole =
            String(
                data?.role ||
                "user"
            ).toLowerCase();


        /*
         * Owner = infinite
         */

        if (
            currentRole === "owner"
        ) {

            currentCoinBalance =
                Infinity;

        } else {

            currentCoinBalance =
                Number(
                    data?.coin_balance ||
                    0
                );
        }


        updateBalanceUI();

    } catch (error) {

        console.error(
            "[Bstation] Load profile error:",
            error
        );

        currentCoinBalance = 0;

        currentRole = "user";

        updateBalanceUI();
    }
}


/* =========================================================
   UPDATE BALANCE UI
========================================================= */

function updateBalanceUI() {

    let text;


    if (
        currentRole === "owner"
    ) {

        text = "∞";

    } else {

        text =
            Number.isFinite(
                currentCoinBalance
            )
                ? currentCoinBalance.toLocaleString(
                    "id-ID"
                )
                : "0";
    }


    if (coinBalance) {

        coinBalance.textContent =
            text;
    }


    if (heroCoinBalance) {

        heroCoinBalance.textContent =
            text;
    }
}


/* =========================================================
   BACKEND FETCH
========================================================= */

async function backendFetch(
    endpoint,
    options = {},
    requireAuth = false,
    retryAfter401 = true
) {

    const headers = {

        Accept:
            "application/json",

        "Content-Type":
            "application/json",

        ...(options.headers || {})
    };


    /*
     * AUTH
     */

    if (requireAuth) {

        const session =
            await getSession();


        if (!session) {

            throw new Error(
                "Silakan login terlebih dahulu."
            );
        }


        if (
            !session.access_token
        ) {

            throw new Error(
                "Session login tidak memiliki access token."
            );
        }


        headers.Authorization =
            `Bearer ${session.access_token}`;
    }


    const url =
        `${BACKEND_URL}${endpoint}`;


    console.log(
        "[Bstation] Request:",
        url
    );


    if (requireAuth) {

        console.log(
            "[Bstation] Auth:",
            "Bearer token dikirim"
        );
    }


    let response;


    try {

        response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        console.error(
            "[Bstation] Fetch error:",
            error
        );

        throw new Error(
            "Tidak dapat terhubung ke server Bstation."
        );
    }


    /*
     * RESPONSE
     */

    let data = {};

    let rawText = "";


    try {

        rawText =
            await response.text();


        if (rawText) {

            try {

                data =
                    JSON.parse(
                        rawText
                    );

            } catch {

                data = {

                    message:
                        rawText

                };
            }

        }

    } catch (error) {

        console.error(
            "[Bstation] Response parse error:",
            error
        );
    }


    console.log(
        "[Bstation] HTTP:",
        response.status,
        response.statusText
    );


    console.log(
        "[Bstation] Response:",
        data
    );


    /*
     * 401
     */

    if (
        response.status === 401 &&
        requireAuth &&
        retryAfter401
    ) {

        console.warn(
            "[Bstation] 401 detected. Trying session refresh..."
        );


        const refreshedSession =
            await refreshSession();


        if (
            refreshedSession &&
            refreshedSession.access_token
        ) {

            console.log(
                "[Bstation] Retrying request with refreshed token..."
            );


            return backendFetch(
                endpoint,
                {
                    ...options,

                    headers: {

                        ...(options.headers || {}),

                        Authorization:
                            `Bearer ${refreshedSession.access_token}`

                    }
                },
                requireAuth,
                false
            );
        }


        throw new Error(
            "Session login sudah tidak valid. Silakan login kembali."
        );
    }


    /*
     * HTTP ERROR
     */

    if (!response.ok) {

        const backendMessage =
            data?.error ||
            data?.message ||
            data?.detail ||
            data?.reason;


        console.error(
            "[Bstation] Backend error:",
            {
                status:
                    response.status,

                statusText:
                    response.statusText,

                response:
                    data,

                endpoint:
                    endpoint
            }
        );


        throw new Error(
            backendMessage ||
            `Server error HTTP ${response.status}`
        );
    }


    return data;
}


/* =========================================================
   NORMALIZE PRODUCTS
========================================================= */

function normalizeProducts(data) {

    if (Array.isArray(data)) {

        return data;
    }


    if (
        data &&
        Array.isArray(data.products)
    ) {

        return data.products;
    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;
    }


    if (
        data &&
        Array.isArray(data.accounts)
    ) {

        return data.accounts;
    }


    return [];
}


/* =========================================================
   NORMALIZE ACCESS
========================================================= */

function normalizeAccess(data) {

    if (Array.isArray(data)) {

        return data;
    }


    if (
        data &&
        Array.isArray(data.access)
    ) {

        return data.access;
    }


    if (
        data &&
        Array.isArray(data.accesses)
    ) {

        return data.accesses;
    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;
    }


    return [];
}


/* =========================================================
   ACCOUNT ID
========================================================= */

function getAccountId(account) {

    return (
        account?.account_id ??
        account?.accountId ??
        account?.id ??
        "-"
    );
}


/* =========================================================
   EXPIRY
========================================================= */

function getExpiry(account) {

    return (
        account?.expires_at ??
        account?.expiresAt ??
        account?.expiry ??
        account?.expiration ??
        "-"
    );
}


/* =========================================================
   PRICE
========================================================= */

function getPrice(account) {

    const price =
        Number(
            account?.price ??
            0
        );


    return Number.isFinite(price)
        ? price
        : 0;
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {

        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    );
}


/* =========================================================
   GET PURCHASED ACCOUNT
========================================================= */

function findOwnedAccount(
    accountId
) {

    return ownedAccounts.find(
        access =>
            String(
                getAccountId(access)
            ) ===
            String(accountId)
    );
}


/* =========================================================
   LOAD MY ACCESS
========================================================= */

async function loadMyAccess() {

    ownedAccounts = [];

    ownedAccountIds =
        new Set();


    const session =
        await getSession();


    /*
     * Guest
     */

    if (!session) {

        return [];
    }


    try {

        const response =
            await backendFetch(
                "/bstation/my-access",
                {},
                true
            );


        const accesses =
            normalizeAccess(
                response
            );


        ownedAccounts =
            accesses;


        ownedAccountIds =
            new Set(
                accesses.map(
                    access =>
                        String(
                            getAccountId(
                                access
                            )
                        )
                )
            );


        console.log(
            "[Bstation] Owned accounts:",
            [...ownedAccountIds]
        );


        return accesses;

    } catch (error) {

        console.error(
            "[Bstation] Access error:",
            error
        );

        ownedAccounts = [];

        ownedAccountIds =
            new Set();

        return [];
    }
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    if (!productsContainer) {

        return [];
    }


    productsContainer.innerHTML = `
        <div class="bstation-loading">
            Memuat akun Bstation...
        </div>
    `;


    try {

        const response =
            await backendFetch(
                "/bstation/products"
            );


        const products =
            normalizeProducts(
                response
            );


        productsData =
            products;


        if (productCount) {

            productCount.textContent =
                `${products.length} akun`;
        }


        if (!products.length) {

            productsContainer.innerHTML = `
                <div class="bstation-empty">
                    Tidak ada akun Bstation
                    yang tersedia saat ini.
                </div>
            `;

            return products;
        }


        renderProducts(
            products
        );


        return products;

    } catch (error) {

        console.error(
            "[Bstation] Products error:",
            error
        );


        productsData = [];


        if (productCount) {

            productCount.textContent =
                "Error";
        }


        productsContainer.innerHTML = `
            <div class="bstation-empty">

                <strong>
                    Gagal memuat akun Bstation
                </strong>

                <br><br>

                ${escapeHTML(
                    error.message
                )}

            </div>
        `;


        return [];
    }
}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(
    products
) {

    if (!productsContainer) {

        return;
    }


    /*
     * Semua akun sekarang berada
     * dalam satu list.
     *
     * ownedAccountIds menentukan
     * tombol:
     *
     * Belum beli -> Beli
     * Sudah beli -> Lihat Akun
     */

    productsContainer.innerHTML =
        products.map(
            account => {

                const accountId =
                    getAccountId(
                        account
                    );


                const expiry =
                    getExpiry(
                        account
                    );


                const price =
                    getPrice(
                        account
                    );


                const owned =
                    ownedAccountIds.has(
                        String(
                            accountId
                        )
                    );


                /*
                 * Status akun
                 */

                let buttonText;

                let buttonClass;


                if (owned) {

                    buttonText =
                        "Lihat Akun";

                    buttonClass =
                        "bstation-view-btn";

                } else if (
                    currentRole === "guest"
                ) {

                    buttonText =
                        "Login untuk Membeli";

                    buttonClass =
                        "bstation-buy-btn";

                } else {

                    buttonText =
                        `Beli ${price} Koin`;

                    buttonClass =
                        "bstation-buy-btn";
                }


                /*
                 * Guest atau saldo kurang
                 *
                 * Kalau sudah punya akun,
                 * tetap bisa Lihat Akun.
                 */

                let disabled = "";


                if (
                    !owned &&
                    currentRole !== "owner" &&
                    currentRole !== "guest" &&
                    currentCoinBalance <
                    price
                ) {

                    buttonText =
                        `Koin Kurang ${
                            price -
                            currentCoinBalance
                        }`;

                    disabled =
                        "disabled";
                }


                return `
                    <article
                        class="bstation-card"
                    >

                        <div
                            class="bstation-card-top"
                        >

                            <img
                                src="../assets/bstation.jpg"
                                alt="Bstation"
                                class="bstation-card-logo"
                            >

                            <div
                                class="bstation-card-title"
                            >

                                <strong>
                                    Bstation Premium
                                </strong>

                                <span>
                                    Akun
                                    ${escapeHTML(
                                        accountId
                                    )}
                                </span>

                            </div>

                        </div>


                        <div
                            class="bstation-info"
                        >

                            <div
                                class="bstation-info-row"
                            >

                                <span>
                                    ID Produk
                                </span>

                                <span>
                                    ${escapeHTML(
                                        accountId
                                    )}
                                </span>

                            </div>


                            <div
                                class="bstation-info-row"
                            >

                                <span>
                                    Masa berlaku
                                </span>

                                <span>
                                    ${escapeHTML(
                                        formatDate(
                                            expiry
                                        )
                                    )}
                                </span>

                            </div>


                            <div
                                class="bstation-info-row"
                            >

                                <span>
                                    Harga
                                </span>

                                <span
                                    class="bstation-price"
                                >
                                    ${price} Koin
                                </span>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="${buttonClass}"
                            data-account-id="${escapeHTML(
                                accountId
                            )}"
                            data-price="${price}"
                            data-owned="${owned}"
                            ${disabled}
                        >
                            ${buttonText}
                        </button>

                    </article>
                `;
            }
        ).join("");


    /*
     * EVENT BUTTON
     */

    productsContainer
        .querySelectorAll(
            ".bstation-buy-btn, .bstation-view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const accountId =
                            button.dataset.accountId;

                        const owned =
                            button.dataset.owned ===
                            "true";


                        /*
                         * Sudah membeli
                         */

                        if (owned) {

                            viewAccess(
                                accountId
                            );

                            return;
                        }


                        /*
                         * Guest
                         */

                        if (
                            currentRole ===
                            "guest"
                        ) {

                            window.location.href =
                                "./login.html";

                            return;
                        }


                        /*
                         * Disabled
                         */

                        if (
                            button.disabled
                        ) {

                            return;
                        }


                        openPurchaseModal(
                            accountId,

                            Number(
                                button.dataset.price
                            )
                        );

                    }
                );

            }
        );
}


/* =========================================================
   REFRESH ALL DATA
========================================================= */

async function refreshAll() {

    if (refreshRunning) {

        console.log(
            "[Bstation] Refresh already running."
        );

        return;
    }


    refreshRunning =
        true;


    try {

        await loadProfile();


        /*
         * Load ownership dulu,
         * baru render product.
         */

        await loadMyAccess();


        await loadProducts();

    } catch (error) {

        console.error(
            "[Bstation] Refresh error:",
            error
        );

    } finally {

        refreshRunning =
            false;
    }
}


/* =========================================================
   PURCHASE MODAL
========================================================= */

function openPurchaseModal(
    accountId,
    price
) {

    selectedAccountId =
        accountId;

    selectedAccountPrice =
        price;


    if (!modal) {

        return;
    }


    const remaining =
        currentRole === "owner"
            ? "∞"
            : Math.max(
                0,
                currentCoinBalance -
                price
            );


    if (modalText) {

        modalText.innerHTML = `
            Kamu akan membeli akun
            <strong>
                ${escapeHTML(
                    accountId
                )}
            </strong>
            dengan harga
            <strong>
                ${price} Koin
            </strong>.

            <br><br>

            Saldo saat ini:
            <strong>
                ${
                    currentRole === "owner"
                        ? "∞"
                        : currentCoinBalance
                } Koin
            </strong>

            <br>

            Sisa setelah pembelian:
            <strong>
                ${remaining} Koin
            </strong>
        `;
    }


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   CLOSE PURCHASE MODAL
========================================================= */

function closePurchaseModal() {

    selectedAccountId =
        null;

    selectedAccountPrice =
        0;


    if (!modal) {

        return;
    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* =========================================================
   PURCHASE
========================================================= */

async function purchaseBstation() {

    if (!selectedAccountId) {

        return;
    }


    if (!confirmBtn) {

        return;
    }


    const accountId =
        selectedAccountId;


    confirmBtn.disabled =
        true;

    confirmBtn.textContent =
        "Memproses...";


    try {

        console.log(
            "[Bstation] Starting purchase:",
            accountId
        );


        const response =
            await backendFetch(
                "/bstation/purchase",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            account_id:
                                accountId
                        })

                },
                true
            );


        console.log(
            "[Bstation] Purchase response:",
            response
        );


        if (
            response?.success === false
        ) {

            throw new Error(
                purchaseErrorMessage(
                    response.error
                )
            );
        }


        closePurchaseModal();


        showToast(
            "Akun Bstation berhasil dibeli."
        );


        /*
         * Refresh saldo,
         * ownership,
         * dan daftar produk.
         */

        await refreshAll();


        /*
         * Setelah refresh,
         * tombol akun yang dibeli
         * otomatis berubah menjadi
         * "Lihat Akun".
         */

    } catch (error) {

        console.error(
            "[Bstation] Purchase error:",
            error
        );


        showToast(
            error.message ||
            "Pembelian Bstation gagal.",
            true
        );

    } finally {

        confirmBtn.disabled =
            false;

        confirmBtn.textContent =
            "Beli Sekarang";
    }
}


/* =========================================================
   CREATE CREDENTIAL MODAL
========================================================= */

function createCredentialModal() {

    let existing =
        document.getElementById(
            "bstationCredentialModal"
        );


    if (existing) {

        return existing;
    }


    const modalElement =
        document.createElement(
            "div"
        );


    modalElement.id =
        "bstationCredentialModal";


    modalElement.className =
        "bstation-credential-modal";


    modalElement.setAttribute(
        "aria-hidden",
        "true"
    );


    modalElement.innerHTML = `

        <div
            class="bstation-credential-backdrop"
            data-close-credential="true"
        ></div>


        <div
            class="bstation-credential-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bstationCredentialTitle"
        >

            <div
                class="bstation-credential-header"
            >

                <div>

                    <span
                        class="bstation-credential-label"
                    >
                        AKSES AKUN
                    </span>

                    <h2
                        id="bstationCredentialTitle"
                    >
                        Bstation Premium
                    </h2>

                </div>


                <button
                    type="button"
                    class="bstation-credential-close"
                    id="bstationCredentialClose"
                    aria-label="Tutup"
                >
                    ×
                </button>

            </div>


            <div
                class="bstation-credential-body"
            >

                <div
                    class="bstation-credential-field"
                >

                    <span>
                        Email
                    </span>

                    <div
                        class="bstation-credential-value"
                        id="bstationCredentialEmail"
                    >
                        -
                    </div>

                </div>


                <div
                    class="bstation-credential-field"
                >

                    <span>
                        Password
                    </span>

                    <div
                        class="bstation-password-row"
                    >

                        <div
                            class="bstation-credential-value"
                            id="bstationCredentialPassword"
                        >
                            ••••••••••••
                        </div>


                        <button
                            type="button"
                            class="bstation-icon-btn"
                            id="bstationPasswordToggle"
                            aria-label="Tampilkan password"
                            title="Tampilkan password"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                                />

                                <circle
                                    cx="12"
                                    cy="12"
                                    r="2.5"
                                />
                            </svg>
                        </button>


                        <button
                            type="button"
                            class="bstation-icon-btn"
                            id="bstationPasswordCopy"
                            aria-label="Salin password"
                            title="Salin password"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <rect
                                    x="8"
                                    y="8"
                                    width="11"
                                    height="11"
                                    rx="2"
                                />

                                <path
                                    d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                                />
                            </svg>
                        </button>

                    </div>

                </div>


                <div
                    class="bstation-credential-field"
                >

                    <span>
                        Masa berlaku
                    </span>

                    <div
                        class="bstation-credential-value"
                        id="bstationCredentialExpiry"
                    >
                        -
                    </div>

                </div>


                <div
                    class="bstation-credential-field"
                >

                    <span>
                        ID Produk
                    </span>

                    <div
                        class="bstation-credential-value"
                        id="bstationCredentialId"
                    >
                        -
                    </div>

                </div>

            </div>


            <div
                class="bstation-credential-footer"
            >

                <button
                    type="button"
                    class="bstation-credential-done"
                    id="bstationCredentialDone"
                >
                    Tutup
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modalElement
    );


    /*
     * CLOSE BUTTON
     */

    const closeBtn =
        modalElement.querySelector(
            "#bstationCredentialClose"
        );


    const doneBtn =
        modalElement.querySelector(
            "#bstationCredentialDone"
        );


    const backdrop =
        modalElement.querySelector(
            "[data-close-credential='true']"
        );


    closeBtn?.addEventListener(
        "click",
        closeCredentialModal
    );


    doneBtn?.addEventListener(
        "click",
        closeCredentialModal
    );


    backdrop?.addEventListener(
        "click",
        closeCredentialModal
    );


    /*
     * PASSWORD TOGGLE
     */

    const passwordToggle =
        modalElement.querySelector(
            "#bstationPasswordToggle"
        );


    passwordToggle?.addEventListener(
        "click",
        toggleCredentialPassword
    );


    /*
     * PASSWORD COPY
     */

    const passwordCopy =
        modalElement.querySelector(
            "#bstationPasswordCopy"
        );


    passwordCopy?.addEventListener(
        "click",
        copyCredentialPassword
    );


    return modalElement;
}


/* =========================================================
   SHOW CREDENTIAL MODAL
========================================================= */

function showCredentialModal(
    account
) {

    const modalElement =
        createCredentialModal();


    if (!modalElement) {

        return;
    }


    const email =
        String(
            account?.email ||
            "-"
        );


    const password =
        String(
            account?.password ||
            "-"
        );


    const expiry =
        account?.expires_at ??
        account?.expiresAt ??
        account?.expiry ??
        "-";


    const accountId =
        getAccountId(
            account
        );


    const emailElement =
        modalElement.querySelector(
            "#bstationCredentialEmail"
        );


    const passwordElement =
        modalElement.querySelector(
            "#bstationCredentialPassword"
        );


    const expiryElement =
        modalElement.querySelector(
            "#bstationCredentialExpiry"
        );


    const idElement =
        modalElement.querySelector(
            "#bstationCredentialId"
        );


    if (emailElement) {

        emailElement.textContent =
            email;
    }


    if (passwordElement) {

        passwordElement.textContent =
            "••••••••••••";
    }


    if (expiryElement) {

        expiryElement.textContent =
            formatDate(
                expiry
            );
    }


    if (idElement) {

        idElement.textContent =
            accountId;
    }


    /*
     * Simpan password pada modal
     * tanpa menampilkannya langsung.
     */

    modalElement.dataset.password =
        password;


    modalElement.dataset.visible =
        "false";


    const toggle =
        modalElement.querySelector(
            "#bstationPasswordToggle"
        );


    if (toggle) {

        toggle.setAttribute(
            "aria-label",
            "Tampilkan password"
        );

        toggle.setAttribute(
            "title",
            "Tampilkan password"
        );
    }


    modalElement.classList.add(
        "active"
    );


    modalElement.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "bstation-modal-open"
    );
}


/* =========================================================
   CLOSE CREDENTIAL MODAL
========================================================= */

function closeCredentialModal() {

    const modalElement =
        document.getElementById(
            "bstationCredentialModal"
        );


    if (!modalElement) {

        return;
    }


    modalElement.classList.remove(
        "active"
    );


    modalElement.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "bstation-modal-open"
    );
}


/* =========================================================
   TOGGLE PASSWORD
========================================================= */

function toggleCredentialPassword() {

    const modalElement =
        document.getElementById(
            "bstationCredentialModal"
        );


    if (!modalElement) {

        return;
    }


    const passwordElement =
        modalElement.querySelector(
            "#bstationCredentialPassword"
        );


    const toggle =
        modalElement.querySelector(
            "#bstationPasswordToggle"
        );


    if (!passwordElement) {

        return;
    }


    const password =
        modalElement.dataset.password ||
        "-";


    const visible =
        modalElement.dataset.visible ===
        "true";


    if (visible) {

        passwordElement.textContent =
            "••••••••••••";

        modalElement.dataset.visible =
            "false";


        toggle?.setAttribute(
            "aria-label",
            "Tampilkan password"
        );


        toggle?.setAttribute(
            "title",
            "Tampilkan password"
        );

    } else {

        passwordElement.textContent =
            password;

        modalElement.dataset.visible =
            "true";


        toggle?.setAttribute(
            "aria-label",
            "Sembunyikan password"
        );


        toggle?.setAttribute(
            "title",
            "Sembunyikan password"
        );
    }
}


/* =========================================================
   COPY PASSWORD
========================================================= */

async function copyCredentialPassword() {

    const modalElement =
        document.getElementById(
            "bstationCredentialModal"
        );


    if (!modalElement) {

        return;
    }


    const password =
        modalElement.dataset.password;


    if (
        !password
    ) {

        return;
    }


    try {

        await navigator.clipboard.writeText(
            password
        );


        showToast(
            "Password berhasil disalin."
        );

    } catch (error) {

        console.error(
            "[Bstation] Copy password error:",
            error
        );


        /*
         * Fallback untuk browser
         * yang tidak menyediakan
         * navigator.clipboard.
         */

        try {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                password;


            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.focus();

            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();


            showToast(
                "Password berhasil disalin."
            );

        } catch {

            showToast(
                "Password tidak dapat disalin.",
                true
            );
        }
    }
}


/* =========================================================
   VIEW ACCESS
========================================================= */

async function viewAccess(
    accountId
) {

    try {

        showToast(
            "Mengambil data akun..."
        );


        const response =
            await backendFetch(
                `/bstation/account/${encodeURIComponent(
                    accountId
                )}`,
                {},
                true
            );


        const account =
            response?.account ||
            response?.data ||
            response;


        if (
            !account ||
            !account.email ||
            !account.password
        ) {

            throw new Error(
                "Data akun tidak lengkap."
            );
        }


        showCredentialModal({
            ...account,

            id:
                account.id ||
                accountId,

            account_id:
                account.account_id ||
                accountId
        });


    } catch (error) {

        console.error(
            "[Bstation] View access error:",
            error
        );


        showToast(
            error.message ||
            "Gagal mengambil akses Bstation.",
            true
        );
    }
}


/* =========================================================
   PURCHASE ERROR
========================================================= */

function purchaseErrorMessage(
    error
) {

    const messages = {

        ALREADY_OWNED:
            "Kamu sudah memiliki akses ke akun ini.",

        INSUFFICIENT_COINS:
            "Koin kamu tidak cukup.",

        PROFILE_NOT_FOUND:
            "Profil akun tidak ditemukan.",

        ACCOUNT_NOT_FOUND:
            "Akun Bstation tidak ditemukan.",

        ACCOUNT_UNAVAILABLE:
            "Akun Bstation sudah tidak tersedia."

    };


    return (
        messages[error] ||
        error ||
        "Pembelian gagal."
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    isError = false
) {

    let toast =
        document.getElementById(
            "BstationToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "BstationToast";


        toast.className =
            "Bstation-toast";


        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;


    toast.classList.toggle(
        "error",
        isError
    );


    toast.classList.add(
        "active"
    );


    clearTimeout(
        showToast.timeout
    );


    showToast.timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "active"
                );

            },
            2800
        );
}


/* =========================================================
   HIDE OLD ACCESS SECTION
========================================================= */

function hideOldAccessSection() {

    /*
     * HTML lama kemungkinan masih punya:
     *
     * #bstationAccess
     *
     * Sekarang bagian tersebut tidak
     * diperlukan karena semua akun sudah
     * digabung ke #bstationProducts.
     */

    const accessContainer =
        document.getElementById(
            "bstationAccess"
        );


    if (!accessContainer) {

        return;
    }


    /*
     * Cari section terdekat.
     */

    const section =
        accessContainer.closest(
            "section"
        );


    if (section) {

        section.style.display =
            "none";

        return;
    }


    /*
     * Kalau tidak ada section,
     * sembunyikan container-nya.
     */

    accessContainer.style.display =
        "none";
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /*
     * Purchase modal
     */

    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            closePurchaseModal
        );
    }


    if (confirmBtn) {

        confirmBtn.addEventListener(
            "click",
            purchaseBstation
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closePurchaseModal();
                }
            }
        );
    }


    /*
     * ESC
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }


            closePurchaseModal();

            closeCredentialModal();
        }
    );
}


/* =========================================================
   AUTH STATE CHANGE
========================================================= */

supabase.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "[Bstation] Auth event:",
            event
        );


        /*
         * INITIAL_SESSION sengaja
         * tidak diproses di sini.
         *
         * init() sudah mengurusnya.
         *
         * Ini mencegah:
         *
         * /bstation/my-access
         *
         * dipanggil dua kali saat
         * halaman pertama dibuka.
         */

        if (
            event ===
            "INITIAL_SESSION"
        ) {

            return;
        }


        /*
         * SIGNED OUT
         */

        if (
            event ===
            "SIGNED_OUT"
        ) {

            currentCoinBalance =
                0;

            currentRole =
                "guest";

            ownedAccounts =
                [];

            ownedAccountIds =
                new Set();


            updateBalanceUI();


            refreshAll();


            return;
        }


        /*
         * SIGNED IN
         */

        if (
            event ===
            "SIGNED_IN"
        ) {

            setTimeout(
                () => {

                    refreshAll();

                },
                100
            );


            return;
        }


        /*
         * TOKEN REFRESH
         */

        if (
            event ===
            "TOKEN_REFRESHED"
        ) {

            setTimeout(
                () => {

                    loadProfile();

                },
                100
            );
        }
    }
);


/* =========================================================
   INIT
========================================================= */

async function init() {

    if (pageLoading) {

        return;
    }


    pageLoading =
        true;


    console.log(
        "[Bstation] Starting..."
    );


    try {

        getElements();


        setupEvents();


        /*
         * Sembunyikan section
         * "Akses Saya" lama.
         */

        hideOldAccessSection();


        /*
         * Pastikan modal credential
         * sudah tersedia.
         */

        createCredentialModal();


        /*
         * Load semua data.
         *
         * Urutan:
         *
         * 1. Profile
         * 2. Ownership
         * 3. Product
         *
         * Dengan begitu render product
         * sudah tahu akun mana yang
         * sudah dibeli.
         */

        await loadProfile();

        await loadMyAccess();

        await loadProducts();


        console.log(
            "[Bstation] Ready."
        );

    } catch (error) {

        console.error(
            "[Bstation] Init error:",
            error
        );

    } finally {

        pageLoading =
            false;
    }
}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once:
                true
        }
    );

} else {

    init();
}