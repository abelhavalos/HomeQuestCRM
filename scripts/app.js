document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".hq-tab");
  const roleInput = document.getElementById("role");
  const roleHint = document.getElementById("roleHint");
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const loginMessage = document.getElementById("loginMessage");
  loginMessage.textContent = "";

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwWucdADa4KYOx5XH9pJ5gvqVGBv36jP-VDgL0t4jD8VWiDaHaF_S8yjdUO2cKNoVymKA/exec";

  // -----------------------------
  // ROLE TAB SWITCHING
  // -----------------------------
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      const selectedRole = tab.dataset.role;
      roleInput.value = selectedRole;

      roleHint.innerHTML = `You are signing in as <strong>${capitalize(selectedRole)}</strong>.`;

      clearMessages();
    });
  });

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // -----------------------------
  // FORM SUBMISSION (GET VERSION)
  // -----------------------------
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = roleInput.value;

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    try {
      const url = `${WEB_APP_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&role=${encodeURIComponent(role)}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        showError(result.message || "Invalid credentials.");
        return;
      }

      // Save session
      sessionStorage.setItem("hq_email", result.email);
      sessionStorage.setItem("hq_name", result.fullName);
      sessionStorage.setItem("hq_role", result.role);
      sessionStorage.setItem("hq_phone", result.phone);

      showSuccess("Access granted. Redirecting…");

      setTimeout(() => {
        if (result.role === "manager") {
          window.location.href = "manager-dashboard.html";
        } else {
          window.location.href = "employee-dashboard.html";
        }
      }, 900);

    } catch (err) {
      showError("Network error. Please try again.");
    }
  });

  // -----------------------------
  // UI HELPERS
  // -----------------------------
  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = "block";
  }

  function showSuccess(msg) {
    successMessage.textContent = msg;
    successMessage.style.display = "block";
  }

  function clearMessages() {
    errorMessage.textContent = "";
    successMessage.textContent = "";
    errorMessage.style.display = "none";
    successMessage.style.display = "none";
  }
});
