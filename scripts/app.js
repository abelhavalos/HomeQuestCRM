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
