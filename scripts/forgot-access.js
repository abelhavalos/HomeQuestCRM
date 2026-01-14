const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby5NqX7wiNifCg9QVN8lHn1Xo4ktiqvwU-iyzofaw6AflLWMzpgrCnHQ1XzGsyF6ZKXQQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendResetRequest");
  btn.addEventListener("click", handleForgotAccess);
});

async function handleForgotAccess() {
  const emailInput = document.getElementById("forgotEmail");
  const messageEl = document.getElementById("forgotMessage");

  const email = emailInput.value.trim();

  messageEl.textContent = "";
  messageEl.style.color = "#ffffff";

  if (!email) {
    messageEl.textContent = "Please enter the email you use to log in.";
    messageEl.style.color = "#ffb3b3";
    return;
  }

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "requestPasswordReset",
        email
      })
    });

    const result = await response.json();

    if (result.success) {
      // Backend will later set this message, but we default to a friendly one
      messageEl.textContent =
        result.message || "Your reset request has been sent to your manager.";
      messageEl.style.color = "#b3ffb3";
      emailInput.value = "";
    } else {
      messageEl.textContent =
        result.message || "We could not find that email. Please check and try again.";
      messageEl.style.color = "#ffb3b3";
    }
  } catch (err) {
    console.error("Network error:", err);
    messageEl.textContent = "Network error. Please try again in a moment.";
    messageEl.style.color = "#ffb3b3";
  }
}
