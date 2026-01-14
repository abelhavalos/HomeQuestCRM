document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("hq_email");
  const role = sessionStorage.getItem("hq_role");

  // Redirect if not logged in
  if (!email || !role) {
    window.location.href = "index.html";
    return;
  }

  // Load leads immediately
  loadLeads(email, role);

  // Safely attach event listeners
  attachEvent("saveNewLead", "click", addLead);
  attachEvent("updateLead", "click", updateLead);
  attachEvent("deleteLead", "click", deleteLead);
  attachEvent("clearLead", "click", clearForm);
  attachEvent("searchLead", "click", searchLeads);
});

// Helper to avoid null element errors
function attachEvent(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzufjHOh1GDq9RrghDcXZ5qvF4Vp_sC3sl3_JA0HBP81cmrC8I-QOn82LvFG4zhpjSABg/exec";

let currentLeadID = null;
let allLeads = [];
let filteredLeads = [];
let currentPage = 1;
let pageSize = 10;

// ======================================================
// LOAD LEADS (EMPLOYEE VERSION)
// ======================================================
async function loadLeads(email, role) {
  try {
    const url = `${WEB_APP_URL}?action=getLeads&email=${encodeURIComponent(
      email
    )}&role=${encodeURIComponent(role)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      allLeads = result.leads || [];
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
// ======================================================
// PAGINATION CONTROLLER
// ======================================================
function renderPaginated() {
  if (!Array.isArray(filteredLeads)) filteredLeads = [];

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  // Prevent out-of-range pages
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  const pageItems = filteredLeads.slice(start, end);

  renderLeads(pageItems);
  renderPaginationControls();
}

// ======================================================
// RENDER LEADS TABLE
// ======================================================
function renderLeads(leads) {
  const tbody = document.getElementById("leadsBody");
  if (!tbody) return; // Prevent crashes

  tbody.innerHTML = "";

  if (!Array.isArray(leads) || leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:10px;">
          No leads found.
        </td>
      </tr>
    `;
    return;
  }

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

    // Entire row selects the lead
    row.addEventListener("click", () => {
      currentLeadID = lead.LeadID;
      loadLeadIntoForm(lead);
    });

    // Edit button (prevent row click)
    const editBtn = row.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        currentLeadID = lead.LeadID;
        loadLeadIntoForm(lead);
      });
    }

    tbody.appendChild(row);
  });
}

// ======================================================
// PAGINATION BUTTONS
// ======================================================
function renderPaginationControls() {
  const tableWrapper = document.querySelector(".hq-lead-table");
  if (!tableWrapper) return;

  let container = document.getElementById("pagination");

  // Create container if missing
  if (!container) {
    container = document.createElement("div");
    container.id = "pagination";
    container.style.marginTop = "15px";
    container.style.display = "flex";
    container.style.gap = "8px";
    tableWrapper.appendChild(container);
  }

  container.innerHTML = "";

  // Handle empty list
  if (!Array.isArray(filteredLeads) || filteredLeads.length === 0) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  // Ensure currentPage stays valid
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  // Prev button
  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPaginated();
    }
  };
  container.appendChild(prev);

  // Numbered buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.style.fontWeight = i === currentPage ? "bold" : "normal";
    btn.onclick = () => {
      if (currentPage !== i) {
        currentPage = i;
        renderPaginated();
      }
    };
    container.appendChild(btn);
  }

  // Next button
  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === totalPages;
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPaginated();
    }
  };
  container.appendChild(next);
}

// ======================================================
// LOAD LEAD INTO FORM
// ======================================================
function loadLeadIntoForm(lead) {
  if (!lead || typeof lead !== "object") return;

  currentLeadID = lead.LeadID || null;

  setValue("FullName", lead.FullName);
  setValue("Email", lead.Email);
  setValue("Phone", lead.Phone);
  setValue("Source", lead.Source);
  setValue("Status", lead.Status || "New");
}

// Safe setter to avoid crashes
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

// ======================================================
// ADD LEAD
// ======================================================
async function addLead() {
  const FullName = document.getElementById("FullName").value.trim();
  const Email = document.getElementById("Email").value.trim();
  const Phone = document.getElementById("Phone").value.trim();
  const Source = document.getElementById("Source").value.trim();
  const Status = document.getElementById("Status").value.trim();

  const AssignedTo = sessionStorage.getItem("hq_email");

  if (!FullName || !Email) {
    alert("FullName and Email are required.");
    return;
  }

  const leadData = {
    FullName,
    Email,
    Phone,
    Source,
    Status,
    AssignedTo,
    Notes: ""
  };

  try {
    const url = `${WEB_APP_URL}?action=addLead&leadData=${encodeURIComponent(JSON.stringify(leadData))}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(AssignedTo, sessionStorage.getItem("hq_role"));
    } else {
      console.error("Backend error:", result.message);
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
  const Email = document.getElementById("Email").value.trim();
  const Phone = document.getElementById("Phone").value.trim();
  const Source = document.getElementById("Source").value.trim();
  const Status = document.getElementById("Status").value.trim();

  const leadData = {
    FullName,
    Email,
    Phone,
    Source,
    Status
  };

  try {
    const url = `${WEB_APP_URL}?action=updateLead&leadId=${encodeURIComponent(currentLeadID)}&leadData=${encodeURIComponent(JSON.stringify(leadData))}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(
        sessionStorage.getItem("hq_email"),
        sessionStorage.getItem("hq_role")
      );
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}
// ======================================================
// DELETE LEAD
// ======================================================
async function deleteLead() {
  if (!currentLeadID) {
    alert("Select a lead to delete.");
    return;
  }

  const confirmDelete = confirm("Are you sure you want to delete this lead?");
  if (!confirmDelete) return;

  try {
    const url = `${WEB_APP_URL}?action=deleteLead&leadId=${encodeURIComponent(currentLeadID)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(
        sessionStorage.getItem("hq_email"),
        sessionStorage.getItem("hq_role")
      );
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}
// ======================================================
// SEARCH LEADS (Improved)
// ======================================================
function searchLeads() {
  const qName = document.getElementById("FullName").value.trim().toLowerCase();
  const qEmail = document.getElementById("Email").value.trim().toLowerCase();
  const qPhone = document.getElementById("Phone").value.trim().toLowerCase();
  const qSource = document.getElementById("Source").value.trim().toLowerCase();
  const qStatus = document.getElementById("Status").value.trim().toLowerCase();

  filteredLeads = allLeads.filter((lead) => {
    return (
      (!qName   || (lead.FullName || "").toLowerCase().includes(qName)) &&
      (!qEmail  || (lead.Email || "").toLowerCase().includes(qEmail)) &&
      (!qPhone  || (lead.Phone || "").toLowerCase().includes(qPhone)) &&
      (!qSource || (lead.Source || "").toLowerCase().includes(qSource)) &&
      (!qStatus || (lead.Status || "").toLowerCase().includes(qStatus))
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

// ======================================================
// SAVE PROFILE
// ======================================================
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

// ======================================================
// LOAD PROFILE
// ======================================================
function loadProfile() {
  setValue("profileName", sessionStorage.getItem("hq_name"));
  setValue("profileEmail", sessionStorage.getItem("hq_email"));
  setValue("profilePhone", sessionStorage.getItem("hq_phone"));
}

// Safe setter to avoid crashes
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}
