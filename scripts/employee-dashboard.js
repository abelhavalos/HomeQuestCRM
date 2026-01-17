// ======================================================
// GLOBAL CONSTANTS
// ======================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxn6G7l5mLFQ8pKDCjCoPivwpoiDCyqjIfsCjU4abHmzWBTxMvoGGJCnIybnh6VR3IhMg/exec";

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
// INITIALIZATION (MERGED)
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("hq_email");
  const role  = sessionStorage.getItem("hq_role");

  if (!email || !role) {
    window.location.href = "index.html";
    return;
  }

  // Load leads first
  loadLeads(email, role);

  // Lead CRUD
  safeOn("saveNewLead", "click", addLead);
  safeOn("updateLead", "click", updateLead);
  safeOn("deleteLead", "click", deleteLead);
  safeOn("clearLead", "click", clearForm);
  safeOn("searchLead", "click", searchLeads);

  // Navigation + Profile
  initNavigation();
});

// ======================================================
// NAVIGATION + PROFILE INIT
// ======================================================
function initNavigation() {
  const btnDashboard = document.querySelector(".hq-menu button:nth-child(1)");
  const btnLeads     = document.querySelector(".hq-menu button:nth-child(2)");
  const btnTasks     = document.querySelector(".hq-menu button:nth-child(3)");
  const btnProfile   = document.querySelector(".hq-menu button:nth-child(4)");

  const leadForm       = document.querySelector(".hq-lead-form");
  const leadTable      = document.querySelector(".hq-lead-table");
  const profileSection = document.getElementById("profileSection");

  const btnSaveProfile    = document.getElementById("saveProfile");
  const btnChangePassword = document.getElementById("changePassword");

  if (btnProfile) {
    btnProfile.addEventListener("click", () => {
      leadForm?.classList.add("hidden");
      leadTable?.classList.add("hidden");
      profileSection?.classList.remove("hidden");
      loadProfile();
    });
  }

  if (btnLeads) {
    btnLeads.addEventListener("click", () => {
      leadForm?.classList.remove("hidden");
      leadTable?.classList.remove("hidden");
      profileSection?.classList.add("hidden");
    });
  }

  if (btnSaveProfile) btnSaveProfile.addEventListener("click", saveProfile);
  if (btnChangePassword) btnChangePassword.addEventListener("click", changePassword);
}

// ======================================================
// LOAD LEADS
// ======================================================
async function loadLeads(email, role) {
  try {
    const url = `${WEB_APP_URL}?action=getLeads&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
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
  const end   = start + pageSize;
  renderLeads(filteredLeads.slice(start, end));

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

    // Row click loads lead
    row.addEventListener("click", () => {
      currentLeadID = lead.LeadID;
      loadLeadIntoForm(lead);
    });

    // Edit button (prevent row click)
    const editBtn = row.querySelector(".edit-btn");
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      currentLeadID = lead.LeadID;
      loadLeadIntoForm(lead);
    });

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
    document.querySelector(".hq-lead-table")?.appendChild(container);
  }

  container.innerHTML = "";
  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => { currentPage--; renderPaginated(); };
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.style.fontWeight = i === currentPage ? "bold" : "normal";
    btn.onclick = () => { currentPage = i; renderPaginated(); };
    container.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === totalPages;
  next.onclick = () => { currentPage++; renderPaginated(); };
  container.appendChild(next);
}

// ======================================================
// LOAD LEAD INTO FORM
// ======================================================
function loadLeadIntoForm(lead) {
  currentLeadID = lead.LeadID;

  document.getElementById("FullName").value = lead.FullName || "";
  document.getElementById("Email").value    = lead.Email || "";
  document.getElementById("Phone").value    = lead.Phone || "";
  document.getElementById("Source").value   = lead.Source || "";
  document.getElementById("Status").value   = lead.Status || "New";
}

// ======================================================
// ADD LEAD
// ======================================================
async function addLead() {
  const FullName = document.getElementById("FullName").value.trim();
  const Email    = document.getElementById("Email").value.trim();
  const Phone    = document.getElementById("Phone").value.trim();
  const Source   = document.getElementById("Source").value.trim();
  const Status   = document.getElementById("Status").value.trim() || "New";

  if (!FullName || !Email) {
    alert("FullName and Email are required.");
    return;
  }

  const AssignedTo = sessionStorage.getItem("hq_email");
  const role       = sessionStorage.getItem("hq_role");

  try {
    const url =
      `${WEB_APP_URL}?action=addLead` +
      `&FullName=${encodeURIComponent(FullName)}` +
      `&Email=${encodeURIComponent(Email)}` +
      `&Phone=${encodeURIComponent(Phone)}` +
      `&Source=${encodeURIComponent(Source)}` +
      `&Status=${encodeURIComponent(Status)}` +
      `&AssignedTo=${encodeURIComponent(AssignedTo)}` +
      `&Notes=`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(AssignedTo, role);
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// UPDATE LEAD
// ======================================================
async function updateLead() {
  if (!currentLeadID) {
    alert("Select a lead to update.");
    return;
  }

  const FullName = document.getElementById("FullName").value.trim();
  const Email    = document.getElementById("Email").value.trim();
  const Phone    = document.getElementById("Phone").value.trim();
  const Source   = document.getElementById("Source").value.trim();
  const Status   = document.getElementById("Status").value.trim() || "New";

  const email = sessionStorage.getItem("hq_email");
  const role  = sessionStorage.getItem("hq_role");

  try {
    const url =
      `${WEB_APP_URL}?action=updateLead` +
      `&leadId=${encodeURIComponent(currentLeadID)}` +
      `&FullName=${encodeURIComponent(FullName)}` +
      `&Email=${encodeURIComponent(Email)}` +
      `&Phone=${encodeURIComponent(Phone)}` +
      `&Source=${encodeURIComponent(Source)}` +
      `&Status=${encodeURIComponent(Status)}`;

    const res = await fetch(url);
    const result = await res.json();

    if (result.success) {
      clearForm();
      loadLeads(email, role);
    }
  } catch (err) {
    console.error(err);
  }
}

// ======================================================
// DELETE LEAD
// ======================================================
async function deleteLead() {
  if (!currentLeadID) return alert("Select a lead to delete.");
  if (!confirm("Are you sure?")) return;

  const email = sessionStorage.getItem("hq_email");
  const role  = sessionStorage.getItem("hq_role");

  try {
    const url = `${WEB_APP_URL}?action=deleteLead&leadId=${encodeURIComponent(currentLeadID)}`;
    const res = await fetch(url);
    const result = await res.json();

    if (result.success) {
      clearForm();
      loadLeads(email, role);
    }
  } catch (err) {
    console.error(err);
  }
}

// ======================================================
// SEARCH LEADS
// ======================================================
function searchLeads() {
  const qName   = document.getElementById("FullName").value.trim().toLowerCase();
  const qEmail  = document.getElementById("Email").value.trim().toLowerCase();
  const qPhone  = document.getElementById("Phone").value.trim().toLowerCase();
  const qSource = document.getElementById("Source").value.trim().toLowerCase();
  const qStatus = document.getElementById("Status").value.trim().toLowerCase();

  filteredLeads = allLeads.filter((lead) =>
    (lead.FullName || "").toLowerCase().includes(qName) &&
    (lead.Email || "").toLowerCase().includes(qEmail) &&
    (lead.Phone || "").toLowerCase().includes(qPhone) &&
    (lead.Source || "").toLowerCase().includes(qSource) &&
    (lead.Status || "").toLowerCase().includes(qStatus)
  );

  currentPage = 1;
  renderPaginated();
}

// ======================================================
// CLEAR FORM
// ======================================================
function clearForm() {
  currentLeadID = null;

  document.getElementById("FullName").value = "";
  document.getElementById("Email").value    = "";
  document.getElementById("Phone").value    = "";
  document.getElementById("Source").value   = "";
  document.getElementById("Status").value   = "New";

  filteredLeads = [...allLeads];
  currentPage = 1;
  renderPaginated();
}

// ======================================================
// PROFILE FUNCTIONS
// ======================================================
async function saveProfile() {
  const name  = document.getElementById("profileName")?.value.trim();
  const phone = document.getElementById("profilePhone")?.value.trim();
  const email = sessionStorage.getItem("hq_email");

  if (!email) return console.error("No session email found");

  try {
    const url =
      `${WEB_APP_URL}?action=updateEmployeeProfile` +
      `&email=${email}&name=${name}&phone=${phone}`;

    const response = await fetch(url);
    const result   = await response.json();

    if (result.success) {
      sessionStorage.setItem("hq_name", name);
      sessionStorage.setItem("hq_phone", phone);
      alert("Profile updated");
    }
  } catch (err) {
    console.error(err);
  }
}

async function changePassword() {
  const email = sessionStorage.getItem("hq_email");
  if (!email) return;

  const newPassword = prompt("Enter new password");
  if (!newPassword) return;

  try {
    const url =
      `${WEB_APP_URL}?action=changePassword` +
      `&email=${email}&newPassword=${encodeURIComponent(newPassword.trim())}`;

    const response = await fetch(url);
    const result   = await response.json();

    if (result.success) alert("Password updated");
  } catch (err) {
    console.error(err);
  }
}

function loadProfile() {
  document.getElementById("profileName").value  = sessionStorage.getItem("hq_name")  || "";
  document.getElementById("profileEmail").value = sessionStorage.getItem("hq_email") || "";
  document.getElementById("profilePhone").value = sessionStorage.getItem("hq_phone") || "";
}