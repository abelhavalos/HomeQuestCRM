// ======================================================
// GLOBAL CONSTANTS
// ======================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxQHhRsnAAmHQ5U7r0BFyPgj4teHeqtOhrOura2_inpIJdxtQo6VW0_dhA9QsTjEn1EYQ/exec";

// ======================================================
// GLOBAL STATE
// ======================================================
let currentLeadID = null;
let allLeads = [];
let filteredLeads = [];
let currentPage = 1;
let pageSize = 10;

// ======================================================
// SAFE EVENT BINDER
// ======================================================
function safeOn(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

// ======================================================
// INITIALIZATION
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("hq_email");
  const role = sessionStorage.getItem("hq_role");

  if (!email || !role) {
    window.location.href = "index.html";
    return;
  }

  loadLeads(email, role);

  safeOn("saveNewLead", "click", addLead);
  safeOn("updateLead", "click", updateLead);
  safeOn("deleteLead", "click", deleteLead);
  safeOn("clearLead", "click", clearForm);
  safeOn("searchLead", "click", searchLeads);
});

// ======================================================
// LOAD LEADS (EMPLOYEE VERSION)
// ======================================================
async function loadLeads(email, role) {
  try {
    const url =
      `${WEB_APP_URL}?action=getLeads` +
      `&email=${encodeURIComponent(email)}` +
      `&role=${encodeURIComponent(role)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      allLeads = Array.isArray(result.leads) ? result.leads : [];
      filteredLeads = [...allLeads];
      currentPage = 1;
      renderPaginated();
    } else {
      console.error("Backend error:", result.message);
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// PAGINATION CONTROLLER
// ======================================================
function renderPaginated() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  const pageItems = filteredLeads.slice(start, end);

  renderLeads(pageItems);

  if (typeof renderPaginationControls === "function") {
    renderPaginationControls();
  }
}

// ======================================================
// RENDER LEADS TABLE
// ======================================================
function renderLeads(leads) {
  const tbody = document.getElementById("leadsBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  leads.forEach((lead) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${lead.FullName || ""}</td>
      <td>${lead.Email || ""}</td>
      <td>${lead.Phone || ""}</td>
      <td>${lead.Source || ""}</td>
      <td>${lead.Status || ""}</td>
      <td><button class="edit-btn">Edit</button></td>
    `;

    row.addEventListener("click", () => {
      currentLeadID = lead.LeadID;
      if (typeof loadLeadIntoForm === "function") {
        loadLeadIntoForm(lead);
      }
    });

    const editBtn = row.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        currentLeadID = lead.LeadID;
        if (typeof loadLeadIntoForm === "function") {
          loadLeadIntoForm(lead);
        }
      });
    }

    tbody.appendChild(row);
  });
}
// ======================================================
// PAGINATION BUTTONS
// ======================================================
function renderPaginationControls() {
  let container = document.getElementById("pagination");

  if (!container) {
    container = document.createElement("div");
    container.id = "pagination";
    container.style.marginTop = "15px";
    container.style.display = "flex";
    container.style.gap = "8px";
    document.querySelector(".hq-lead-table").appendChild(container);
  }

  container.innerHTML = "";

  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    currentPage--;
    renderPaginated();
  };
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.style.fontWeight = i === currentPage ? "bold" : "normal";
    btn.onclick = () => {
      currentPage = i;
      renderPaginated();
    };
    container.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === totalPages;
  next.onclick = () => {
    currentPage++;
    renderPaginated();
  };
  container.appendChild(next);
}

// ======================================================
// LOAD LEAD INTO FORM
// ======================================================
function loadLeadIntoForm(lead) {
  currentLeadID = lead.LeadID;

  document.getElementById("FullName").value = lead.FullName || "";
  document.getElementById("Email").value = lead.Email || "";
  document.getElementById("Phone").value = lead.Phone || "";
  document.getElementById("Source").value = lead.Source || "";
  document.getElementById("Status").value = lead.Status || "New";
}

// ======================================================
// ADD LEAD (EMPLOYEE VERSION)
// ======================================================
async function addLead() {
  const FullNameEl = document.getElementById("FullName");
  const EmailEl = document.getElementById("Email");
  const PhoneEl = document.getElementById("Phone");
  const SourceEl = document.getElementById("Source");
  const StatusEl = document.getElementById("Status");

  if (!FullNameEl || !EmailEl) {
    console.error("Lead form elements missing");
    return;
  }

  const FullName = FullNameEl.value.trim();
  const Email = EmailEl.value.trim();
  const Phone = PhoneEl ? PhoneEl.value.trim() : "";
  const Source = SourceEl ? SourceEl.value.trim() : "";
  const Status = StatusEl ? StatusEl.value.trim() : "New";

  const AssignedTo = sessionStorage.getItem("hq_email");
  const role = sessionStorage.getItem("hq_role");

  if (!FullName || !Email) {
    alert("FullName and Email are required.");
    return;
  }

  try {
    const url =
      `${WEB_APP_URL}?action=addLead` +
      `&FullName=${encodeURIComponent(FullName)}` +
      `&Email=${encodeURIComponent(Email)}` +
      `&Phone=${encodeURIComponent(Phone)}` +
      `&Source=${encodeURIComponent(Source)}` +
      `&Status=${encodeURIComponent(Status)}` +
      `&AssignedTo=${encodeURIComponent(AssignedTo)}` +
      `&Notes=${encodeURIComponent("")}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(AssignedTo, role);
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// UPDATE LEAD (EMPLOYEE VERSION)
// ======================================================
async function updateLead() {
  if (!currentLeadID) {
    alert("Select a lead to update.");
    return;
  }

  const FullNameEl = document.getElementById("FullName");
  const EmailEl = document.getElementById("Email");
  const PhoneEl = document.getElementById("Phone");
  const SourceEl = document.getElementById("Source");
  const StatusEl = document.getElementById("Status");

  if (!FullNameEl || !EmailEl) {
    console.error("Lead form elements missing");
    return;
  }

  const FullName = FullNameEl.value.trim();
  const Email = EmailEl.value.trim();
  const Phone = PhoneEl ? PhoneEl.value.trim() : "";
  const Source = SourceEl ? SourceEl.value.trim() : "";
  const Status = StatusEl ? StatusEl.value.trim() : "New";

  const userEmail = sessionStorage.getItem("hq_email");
  const userRole = sessionStorage.getItem("hq_role");

  try {
    const url =
      `${WEB_APP_URL}?action=updateLead` +
      `&leadId=${encodeURIComponent(currentLeadID)}` +
      `&FullName=${encodeURIComponent(FullName)}` +
      `&Email=${encodeURIComponent(Email)}` +
      `&Phone=${encodeURIComponent(Phone)}` +
      `&Source=${encodeURIComponent(Source)}` +
      `&Status=${encodeURIComponent(Status)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(userEmail, userRole);
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// DELETE LEAD (EMPLOYEE VERSION)
// ======================================================
async function deleteLead() {
  if (!currentLeadID) {
    alert("Select a lead to delete.");
    return;
  }

  const confirmDelete = confirm("Are you sure you want to delete this lead?");
  if (!confirmDelete) return;

  const userEmail = sessionStorage.getItem("hq_email");
  const userRole = sessionStorage.getItem("hq_role");

  try {
    const url =
      `${WEB_APP_URL}?action=deleteLead` +
      `&leadId=${encodeURIComponent(currentLeadID)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(userEmail, userRole);
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// SEARCH LEADS
// ======================================================
function searchLeads() {
  const qName = document.getElementById("FullName").value.trim().toLowerCase();
  const qEmail = document.getElementById("Email").value.trim().toLowerCase();
  const qPhone = document.getElementById("Phone").value.trim().toLowerCase();
  const qSource = document.getElementById("Source").value.trim().toLowerCase();
  const qStatus = document.getElementById("Status").value.trim().toLowerCase();

  filteredLeads = allLeads.filter((lead) => {
    return (
      (lead.FullName || "").toLowerCase().includes(qName) &&
      (lead.Email || "").toLowerCase().includes(qEmail) &&
      (lead.Phone || "").toLowerCase().includes(qPhone) &&
      (lead.Source || "").toLowerCase().includes(qSource) &&
      (lead.Status || "").toLowerCase().includes(qStatus)
    );
  });

  currentPage = 1;
  renderPaginated();
}

// ======================================================
// CLEAR FORM
// ======================================================
function clearForm() {
  currentLeadID = null;

  document.getElementById("FullName").value = "";
  document.getElementById("Email").value = "";
  document.getElementById("Phone").value = "";
  document.getElementById("Source").value = "";
  document.getElementById("Status").value = "New";

  filteredLeads = [...allLeads];
  currentPage = 1;
  renderPaginated();
}

document.addEventListener("DOMContentLoaded", () => {

  // NAV BUTTONS
  const btnDashboard = document.querySelector(".hq-menu button:nth-child(1)");
  const btnLeads     = document.querySelector(".hq-menu button:nth-child(2)");
  const btnTasks     = document.querySelector(".hq-menu button:nth-child(3)");
  const btnProfile   = document.querySelector(".hq-menu button:nth-child(4)");

  // SECTIONS
  const leadForm       = document.querySelector(".hq-lead-form");
  const leadTable      = document.querySelector(".hq-lead-table");
  const profileSection = document.getElementById("profileSection");

  // PROFILE BUTTONS
  const btnSaveProfile    = document.getElementById("saveProfile");
  const btnChangePassword = document.getElementById("changePassword");

  // SHOW PROFILE
  btnProfile.addEventListener("click", () => {
    leadForm.classList.add("hidden");
    leadTable.classList.add("hidden");
    profileSection.classList.remove("hidden");
    loadProfile();
  });

  // SHOW LEADS
  btnLeads.addEventListener("click", () => {
    leadForm.classList.remove("hidden");
    leadTable.classList.remove("hidden");
    profileSection.classList.add("hidden");
  });

  // SAVE PROFILE
  btnSaveProfile.addEventListener("click", () => {
    saveProfile();
  });

  // CHANGE PASSWORD
  btnChangePassword.addEventListener("click", () => {
    changePassword();
  });

});


async function saveProfile() {
  const nameEl = document.getElementById("profileName");
  const phoneEl = document.getElementById("profilePhone");

  if (!nameEl || !phoneEl) {
    console.error("Profile form elements missing");
    return;
  }

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const email = sessionStorage.getItem("hq_email");

  if (!email) {
    console.error("No email found in session. User not logged in.");
    return;
  }

  try {
    const url =
      `${WEB_APP_URL}?action=updateEmployeeProfile` +
      `&email=${encodeURIComponent(email)}` +
      `&name=${encodeURIComponent(name)}` +
      `&phone=${encodeURIComponent(phone)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      sessionStorage.setItem("hq_name", name);
      sessionStorage.setItem("hq_phone", phone);
      alert("Profile updated successfully");
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}
 async function changePassword() {
  const email = sessionStorage.getItem("hq_email");
  if (!email) {
    console.error("No email found in session. User not logged in.");
    return;
  }

  const newPassword = prompt("Enter new password");
  if (!newPassword || newPassword.trim() === "") return;

  try {
    const url =
      `${WEB_APP_URL}?action=changePassword` +
      `&email=${encodeURIComponent(email)}` +
      `&newPassword=${encodeURIComponent(newPassword.trim())}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Password updated successfully");
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

function loadProfile() {
  document.getElementById("profileName").value  = sessionStorage.getItem("hq_name") || "";
  document.getElementById("profileEmail").value = sessionStorage.getItem("hq_email") || "";
  document.getElementById("profilePhone").value = sessionStorage.getItem("hq_phone") || "";
}
                          
