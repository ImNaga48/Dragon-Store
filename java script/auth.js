import { supabase } from "./supabase.js";

/* =========================
   MESSAGE
========================= */

const message =
  document.getElementById("authMessage");


function showMessage(text, error = false) {
  if (!message) return;

  message.textContent = text;

  message.classList.toggle(
    "error",
    error
  );
}


/* =========================
   LOGIN
========================= */

const loginForm =
  document.getElementById("loginForm");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document.getElementById("loginEmail")
          .value
          .trim();

      const password =
        document.getElementById("loginPassword")
          .value;

      showMessage("Memproses...");

      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {

        showMessage(
          error.message,
          true
        );

        return;
      }

      if (!data.session) {

        showMessage(
          "Login berhasil, tetapi session belum tersedia.",
          true
        );

        return;
      }

      window.location.href =
        "../index.html";
    }
  );

}


/* =========================
   REGISTER
========================= */

const registerForm =
  document.getElementById("registerForm");


if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document.getElementById("registerEmail")
          .value
          .trim();

      const password =
        document.getElementById("registerPassword")
          .value;

      const confirmation =
        document.getElementById(
          "registerPasswordConfirm"
        ).value;


      if (password !== confirmation) {

        showMessage(
          "Konfirmasi password tidak cocok.",
          true
        );

        return;
      }


      showMessage("Membuat akun...");


      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,

        options: {
          emailRedirectTo:
            "https://dragonstore.biz.id/index/login.html"
        }
      });


      if (error) {

        showMessage(
          error.message,
          true
        );

        return;
      }


      if (data.session) {

        window.location.href =
          "../index.html";

        return;
      }


      showMessage(
        "Akun berhasil dibuat. Silakan cek email untuk verifikasi."
      );

    }
  );

}