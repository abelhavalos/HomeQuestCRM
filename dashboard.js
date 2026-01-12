document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("hq_email");
  const role = sessionStorage.getItem("hq_role");

  if (!email || !role) {
    window.location.href = "index.html";
    return;
  }

  loadLeads(email, role);

  document.getElementById("saveNewLead").addEventListener("click", addLead);
  document.getElementById("updateLead").addEventListener("click", updateLead);
  document.getElementById("deleteLead").addEventListener("click", deleteLead);
  document.getElementById("clearLead").addEventListener("click", clearForm);
  document.getElementById("searchLead").addEventListener("click", searchLeads);
});

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwNNFPfDM3s9iYqET9YNm5mUc-SmHc9qU2rIQpT7VxfqeRvj0_P4kU5OTT1P75iwHjIOA/exec";

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
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getLeads",
        role,
        email
      })
    });

    const result = await response.json();

    if (result.success) {
      allLeads = result.leads;
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
      <td><button class="edit-btn">Edit</button></td>
    `;

    // Row click selects lead
    row.addEventListener("click", () => {
      currentLeadID = lead.LeadID;
      loadLeadIntoForm(lead);
    });

    // Edit button (prevent row click bubbling)
    row.querySelector(".edit-btn").addEventListener("click", (event) => {
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
    Notes: "",
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addLead",
        leadData,
      }),
    });

    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(AssignedTo, sessionStorage.getItem("hq_role"));
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
    Status,
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateLead",
        leadId: currentLeadID,
        leadData,
      }),
    });

    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(sessionStorage.getItem("hq_email"), sessionStorage.getItem("hq_role"));
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
        leadId: currentLeadID,
      }),
    });

    const result = await response.json();

    if (result.success) {
      clearForm();
      loadLeads(sessionStorage.getItem("hq_email"), sessionStorage.getItem("hq_role"));
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