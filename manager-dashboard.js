document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("hq_email");
  const role = sessionStorage.getItem("hq_role");

  // Only managers allowed here
  if (!email || role !== "manager") {
    window.location.href = "index.html";
    return;
  }

  initManagerDashboard(email, role);

  document.getElementById("saveNewLead").addEventListener("click", addLead);
  document.getElementById("updateLead").addEventListener("click", updateLead);
  document.getElementById("deleteLead").addEventListener("click", deleteLead);
  document.getElementById("clearLead").addEventListener("click", clearForm);
  document.getElementById("searchLead").addEventListener("click", searchLeads);
});

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbz3GahBLJn2z5SiIZ8Lew86ps3Fj8QuAZyoHHrxfhmPc3BgRaibv-2acalz4v45_ODf3g/exec";

let currentLeadID = null;
let allLeads = [];
let filteredLeads = [];
let currentPage = 1;
let pageSize = 10;
let employees = [];

// ======================================================
// INITIAL LOAD: employees + leads
// ======================================================
async function initManagerDashboard(email, role) {
  await loadEmployees();
  await loadLeads(email, role);
}

// ======================================================
// LOAD EMPLOYEES FOR ASSIGNEDTO DROPDOWN
// ======================================================
async function loadEmployees() {
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getEmployees"
      })
    });

    const result = await response.json();

    if (!result.success) return;

    employees = result.employees || [];
    populateAssignedToDropdown();

  } catch (err) {
    console.error("Error loading employees:", err);
  }
}

function populateAssignedToDropdown() {
  const select = document.getElementById("AssignedTo");
  if (!select) return;

  select.innerHTML = "";

  // Optional "Unassigned" option
  const optNone = document.createElement("option");
  optNone.value = "";
  optNone.textContent = "Unassigned";
  select.appendChild(optNone);

  employees
    .filter(emp => emp.Role === "employee" || emp.role === "employee")
    .forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.Email;
      option.textContent = emp.FullName || emp.Name || emp.Email;
      select.appendChild(option);
    });
}

// ======================================================
// LOAD LEADS (MANAGER: SEES ALL)
// ======================================================
async function loadLeads(email, role) {
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getLeads",
        email,
        role
      })
    });

    const result = await response.json();

    if (result.success) {
      allLeads = result.leads;
      filteredLeads = [...allLeads];
      currentPage = 1;
      renderPaginated();
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
  renderPaginationControls();
}

// ======================================================
// RENDER LEADS TABLE
// ======================================================
function renderLeads(leads) {
  const tbody = document.getElementById("leadsBody");
  tbody.innerHTML = "";

  leads.forEach((lead) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${lead.FullName || ""}</td>
      <td>${lead.Email || ""}</td>
      <td>${lead.Phone || ""}</td>
      <td>${lead.Source || ""}</td>
      <td>${lead.Status || ""}</td>
      <td>${lead.AssignedTo || ""}</td>
      <td>
        <button class="edit-btn" data-id="${lead.LeadID}">Edit</button>
      </td>
    `;

    row.querySelector(".edit-btn").addEventListener("click", () => {
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
    document.querySelector(".hq-lead-table").appendChild(container);
  }

  container.innerHTML = "";

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;

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
// LOAD LEAD INTO FORM FOR EDITING / REASSIGN
// ======================================================
function loadLeadIntoForm(lead) {
  currentLeadID = lead.LeadID;

  document.getElementById("FullName").value = lead.FullName || "";
  document.getElementById("Email").value = lead.Email || "";
  document.getElementById("Phone").value = lead.Phone || "";
  document.getElementById("Source").value = lead.Source || "";
  document.getElementById("Status").value = lead.Status || "New";

  const assignedSelect = document.getElementById("AssignedTo");
  if (assignedSelect) {
    assignedSelect.value = lead.AssignedTo || "";
  }
}

// ======================================================
// ADD LEAD (MANAGER CAN ASSIGN TO ANY EMPLOYEE)
// ======================================================
async function addLead() {
  const FullName = document.getElementById("FullName").value.trim();
  const Email = document.getElementById("Email").value.trim();
  const Phone = document.getElementById("Phone").value.trim();
  const Source = document.getElementById("Source").value.trim();
  const Status = document.getElementById("Status").value.trim();
  const AssignedTo = document.getElementById("AssignedTo").value.trim();

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
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addLead",
        leadData
      })
    });

    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(sessionStorage.getItem("hq_email"), "manager");
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// UPDATE LEAD (INCLUDING REASSIGNED AssignedTo)
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
  const AssignedTo = document.getElementById("AssignedTo").value.trim();

  const leadData = {
    FullName,
    Email,
    Phone,
    Source,
    Status,
    AssignedTo
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateLead",
        leadId: currentLeadID,
        leadData
      })
    });

    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(sessionStorage.getItem("hq_email"), "manager");
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
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteLead",
        leadId: currentLeadID
      })
    });

    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(sessionStorage.getItem("hq_email"), "manager");
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

// ======================================================
// MULTI-FIELD SEARCH (ACROSS ALL LEADS)
// ======================================================
function searchLeads() {
  const qName = document.getElementById("FullName").value.trim().toLowerCase();
  const qEmail = document.getElementById("Email").value.trim().toLowerCase();
  const qPhone = document.getElementById("Phone").value.trim().toLowerCase();
  const qSource = document.getElementById("Source").value.trim().toLowerCase();
  const qStatus = document.getElementById("Status").value.trim().toLowerCase();
  const qAssigned = document.getElementById("AssignedTo").value.trim().toLowerCase();

  filteredLeads = allLeads.filter((lead) => {
    return (
      (lead.FullName || "").toLowerCase().includes(qName) &&
      (lead.Email || "").toLowerCase().includes(qEmail) &&
      (lead.Phone || "").toLowerCase().includes(qPhone) &&
      (lead.Source || "").toLowerCase().includes(qSource) &&
      (lead.Status || "").toLowerCase().includes(qStatus) &&
      (lead.AssignedTo || "").toLowerCase().includes(qAssigned)
    );
  });

  currentPage = 1;
  renderPaginated();
}

// ======================================================
// CLEAR FORM + RESET FILTER
// ======================================================
function clearForm() {
  currentLeadID = null;

  document.getElementById("FullName").value = "";
  document.getElementById("Email").value = "";
  document.getElementById("Phone").value = "";
  document.getElementById("Source").value = "";
  document.getElementById("Status").value = "New";

  const assignedSelect = document.getElementById("AssignedTo");
  if (assignedSelect) assignedSelect.value = "";

  filteredLeads = [...allLeads];
  currentPage = 1;
  renderPaginated();
}