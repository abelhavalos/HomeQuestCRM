// =====================================
// Manager Dashboard JS
// =====================================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwu6-aIdFleh8oZdQjRtmv4tsbelsPLS1v2fVMCjDvS_nE7RzWbRQ7Gtpk56sFS8VtwtA/exec"; // Replace with your Apps Script URL

// -------------------------------
// GLOBAL STATE
// -------------------------------
let allLeads = [];
let filteredLeads = [];
let currentLeadID = null;

let employees = [];
let allEmployees = [];
let filteredEmployees = [];
let currentEmployeeID = null;

let leadPage = 1;
let leadPageSize = 10;

let employeePage = 1;
let employeePageSize = 10;

// =====================================
// INITIALIZATION
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("hq_email");
  const role = sessionStorage.getItem("hq_role");

  if (!email || role !== "manager") {
    window.location.href = "index.html";
    return;
  }

  initManagerDashboard();

  // Lead buttons
  document.getElementById("saveNewLead").addEventListener("click", addLead);
  document.getElementById("updateLead").addEventListener("click", updateLead);
  document.getElementById("deleteLead").addEventListener("click", deleteLead);
  document.getElementById("searchLead").addEventListener("click", searchLeads);
  document.getElementById("clearLead").addEventListener("click", clearLeadForm);

  // Employee buttons
  document.getElementById("addEmployeeBtn").addEventListener("click", addEmployee);
  document.getElementById("updateEmployeeBtn").addEventListener("click", updateEmployee);
  document.getElementById("deleteEmployeeBtn").addEventListener("click", deleteEmployee);
  document.getElementById("searchEmployeeBtn").addEventListener("click", searchEmployees);
  document.getElementById("clearEmployeeBtn").addEventListener("click", clearEmployeeForm);

  // Navbar switching
  document.getElementById("navLeads").addEventListener("click", () => {
    document.getElementById("leadPanel").style.display = "flex";
    document.getElementById("employeePanel").style.display = "none";
  });

  document.getElementById("navEmployees").addEventListener("click", () => {
    document.getElementById("leadPanel").style.display = "none";
    document.getElementById("employeePanel").style.display = "flex";
    loadEmployeesForTable();
  });
});

// =====================================
// DASHBOARD INIT
// =====================================
async function initManagerDashboard() {
  await loadEmployees();              // Load employees first
  populateAssignedToDropdown();       // Populate AssignedTo dropdown
  await loadLeads();                  // Then load leads
}

// =====================================
// POPULATE ASSIGNED TO DROPDOWN
// =====================================
function populateAssignedToDropdown() {
  const dropdown = document.getElementById("AssignedTo");
  dropdown.innerHTML = "";

  employees.forEach(emp => {
    const fullName =
      emp.FullName && emp.FullName.trim() !== "" ? emp.FullName : emp.Name;

    const option = document.createElement("option");
    option.value = emp.Email;
    option.textContent = fullName;
    dropdown.appendChild(option);
  });
}

// =====================================
// LOAD LEADS
// =====================================
async function loadLeads() {
  try {
    const url = `${WEB_APP_URL}?action=getLeads`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      allLeads = Array.isArray(result.leads) ? result.leads : [];
      filteredLeads = [...allLeads];
      leadPage = 1;
      renderLeadPaginated();
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// =====================================
// LOAD EMPLOYEES
// =====================================
async function loadEmployees() {
  try {
    const url = `${WEB_APP_URL}?action=getEmployees`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      employees = Array.isArray(result.employees) ? result.employees : [];
      renderEmployees();
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// =====================================
// LEAD TABLE RENDERING
// =====================================
function renderLeadTable(list) {
  const tbody = document.getElementById("leadTableBody");
  tbody.innerHTML = "";

  list.forEach(lead => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${lead.FullName}</td>
      <td>${lead.Email}</td>
      <td>${lead.Phone}</td>
      <td>${lead.Source}</td>
      <td>${lead.Status}</td>
      <td>${lead.AssignedTo}</td>
      <td><button class="edit-btn">Edit</button></td>
    `;

    row.addEventListener("click", () => {
      currentLeadID = lead.LeadID;
      loadLeadIntoForm(lead);
    });

    row.querySelector(".edit-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      currentLeadID = lead.LeadID;
      loadLeadIntoForm(lead);
    });

    tbody.appendChild(row);
  });
}

function renderLeadPaginated() {
  const start = (leadPage - 1) * leadPageSize;
  const end = start + leadPageSize;

  const pageItems = filteredLeads.slice(start, end);

  renderLeadTable(pageItems);
  renderLeadPaginationControls();
}

function renderLeadPaginationControls() {
  const container = document.getElementById("leadPagination");
  container.innerHTML = "";

  const totalPages = Math.ceil(filteredLeads.length / leadPageSize);

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = leadPage === 1;
  prev.onclick = () => {
    leadPage--;
    renderLeadPaginated();
  };
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.style.fontWeight = i === leadPage ? "bold" : "normal";
    btn.onclick = () => {
      leadPage = i;
      renderLeadPaginated();
    };
    container.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = leadPage === totalPages;
  next.onclick = () => {
    leadPage++;
    renderLeadPaginated();
  };
  container.appendChild(next);
}

// =====================================
// LEAD FORM LOGIC
// =====================================
function loadLeadIntoForm(lead) {
  currentLeadID = lead.LeadID;   // ⭐ MUST BE HERE

  document.getElementById("FullName").value = lead.FullName;
  document.getElementById("Email").value = lead.Email;
  document.getElementById("Phone").value = lead.Phone;
  document.getElementById("Source").value = lead.Source;
  document.getElementById("Status").value = lead.Status;
  document.getElementById("AssignedTo").value = lead.AssignedTo;
}

function clearLeadForm() {
  currentLeadID = null;

  document.getElementById("FullName").value = "";
  document.getElementById("Email").value = "";
  document.getElementById("Phone").value = "";
  document.getElementById("Source").value = "";
  document.getElementById("Status").value = "";
  document.getElementById("AssignedTo").value = "";

  // ⭐ Reset table
  filteredLeads = [...allLeads];
  leadPage = 1;
  renderLeadPaginated();
}

// =====================================
// LEAD CRUD (backend added in Step D)
// =====================================
async function addLead() {}
async function updateLead() {}
async function deleteLead() {}

async function addLead() {
  const leadData = {
    FullName: document.getElementById("FullName").value.trim(),
    Email: document.getElementById("Email").value.trim(),
    Phone: document.getElementById("Phone").value.trim(),
    Source: document.getElementById("Source").value.trim(),
    Status: document.getElementById("Status").value.trim(),
    AssignedTo: document.getElementById("AssignedTo").value.trim()
  };

  // Build GET URL with encoded JSON
  const url = `${WEB_APP_URL}?action=addLead&leadData=${encodeURIComponent(JSON.stringify(leadData))}`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Lead added successfully.");
      clearLeadForm();
      loadLeads();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}

async function updateLead() {
  if (!currentLeadID) {
    alert("Select a lead to update.");
    return;
  }

  const leadData = {
    FullName: document.getElementById("FullName").value.trim(),
    Email: document.getElementById("Email").value.trim(),
    Phone: document.getElementById("Phone").value.trim(),
    Source: document.getElementById("Source").value.trim(),
    Status: document.getElementById("Status").value.trim(),
    AssignedTo: document.getElementById("AssignedTo").value.trim()
  };

  try {
    const url = `${WEB_APP_URL}?action=updateLead&leadId=${encodeURIComponent(currentLeadID)}&leadData=${encodeURIComponent(JSON.stringify(leadData))}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Lead updated successfully.");
      clearLeadForm();
      loadLeads();
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}
async function deleteLead() {
  if (!currentLeadID) {
    alert("Select a lead to delete.");
    return;
  }

  if (!confirm("Are you sure you want to delete this lead?")) return;

  try {
    const url = `${WEB_APP_URL}?action=deleteLead&leadId=${encodeURIComponent(currentLeadID)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Lead deleted successfully.");
      clearLeadForm();
      loadLeads();
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}

function searchLeads() {
  const name = document.getElementById("FullName").value.trim().toLowerCase();
  const email = document.getElementById("Email").value.trim().toLowerCase();
  const phone = document.getElementById("Phone").value.trim().toLowerCase();
  const source = document.getElementById("Source").value.trim().toLowerCase();
  const status = document.getElementById("Status").value.trim().toLowerCase();

  // Find the first matching lead
  const match = allLeads.find(lead => {
    return (
      (name ? lead.FullName.toLowerCase().includes(name) : true) &&
      (email ? lead.Email.toLowerCase().includes(email) : true) &&
      (phone ? lead.Phone.toLowerCase().includes(phone) : true) &&
      (source ? lead.Source.toLowerCase().includes(source) : true) &&
      (status ? lead.Status.toLowerCase().includes(status) : true)
    );
  });

  if (!match) {
    alert("Lead not found.");
    return;
  }

  // ⭐ Populate form
  currentLeadID = match.LeadID;
  loadLeadIntoForm(match);

  // ⭐ Update table to show ONLY the found lead
  filteredLeads = [match];
  leadPage = 1;

  // ⭐ Re-render table + pagination
  renderLeadPaginated();
}

async function loadEmployees() {
  try {
    const url = `${WEB_APP_URL}?action=getEmployees`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      employees = result.employees;
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// =====================================
// EMPLOYEE TABLE LOAD
// =====================================
async function loadEmployeesForTable() {
  try {
    const url = `${WEB_APP_URL}?action=getEmployees`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      allEmployees = result.employees;
      filteredEmployees = [...allEmployees];
      employeePage = 1;
      renderEmployeePaginated();
    } else {
      console.error("Backend error:", result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

// =====================================
// EMPLOYEE TABLE RENDERING
// =====================================
function renderEmployeeTable(list) {
  const tbody = document.getElementById("employeeTableBody");
  tbody.innerHTML = "";

  list.forEach(emp => {
    const fullName =
      emp.FullName && emp.FullName.trim() !== "" ? emp.FullName : emp.Name;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${fullName}</td>
      <td>${emp.Email}</td>
      <td>${emp.Role}</td>
      <td>${emp.Status}</td>
      <td><button class="edit-emp-btn">Edit</button></td>
    `;

    row.querySelector(".edit-emp-btn").addEventListener("click", () => {
      loadEmployeeIntoForm(emp);
    });

    tbody.appendChild(row);
  });
}

function renderEmployeePaginated() {
  const start = (employeePage - 1) * employeePageSize;
  const end = start + employeePageSize;

  const pageItems = filteredEmployees.slice(start, end);

  renderEmployeeTable(pageItems);
  renderEmployeePaginationControls();
}

function renderEmployeePaginationControls() {
  const container = document.getElementById("employeePagination");
  container.innerHTML = "";

  const totalPages = Math.ceil(filteredEmployees.length / employeePageSize);

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = employeePage === 1;
  prev.onclick = () => {
    employeePage--;
    renderEmployeePaginated();
  };
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.style.fontWeight = i === employeePage ? "bold" : "normal";
    btn.onclick = () => {
      employeePage = i;
      renderEmployeePaginated();
    };
    container.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = employeePage === totalPages;
  next.onclick = () => {
    employeePage++;
    renderEmployeePaginated();
  };
  container.appendChild(next);
}

// =====================================
// EMPLOYEE FORM LOGIC
// =====================================
function loadEmployeeIntoForm(emp) {
  currentEmployeeID = emp.Id;

  document.getElementById("EmpFullName").value =
    emp.FullName && emp.FullName.trim() !== "" ? emp.FullName : emp.Name;

  document.getElementById("EmpEmail").value = emp.Email;
  document.getElementById("EmpRole").value = emp.Role;
  document.getElementById("EmpStatus").value = emp.Status;
}

function clearEmployeeForm() {
  currentEmployeeID = null;

  document.getElementById("EmpFullName").value = "";
  document.getElementById("EmpEmail").value = "";
  document.getElementById("EmpRole").value = "";
  document.getElementById("EmpStatus").value = "";

  // ⭐ Reset table to show ALL employees
  filteredEmployees = [...allEmployees];
  employeePage = 1;
  renderEmployeePaginated();
}

// =====================================
// ADD EMPLOYEE (GET VERSION)
// =====================================
async function addEmployee() {
  const FullName = document.getElementById("EmpFullName").value.trim();
  const Email = document.getElementById("EmpEmail").value.trim();
  const Role = document.getElementById("EmpRole").value.trim();
  const Status = document.getElementById("EmpStatus").value.trim();

  if (!FullName || !Email || !Role) {
    alert("Full Name, Email, and Role are required.");
    return;
  }

  try {
    const url = `${WEB_APP_URL}?action=addEmployee`
      + `&FullName=${encodeURIComponent(FullName)}`
      + `&Email=${encodeURIComponent(Email)}`
      + `&Role=${encodeURIComponent(Role)}`
      + `&Status=${encodeURIComponent(Status)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Employee added successfully.");
      clearEmployeeForm();
      loadEmployeesForTable();
      populateAssignedToDropdown();
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}
async function updateEmployee() {
  if (!currentEmployeeID) {
    alert("Select an employee to update.");
    return;
  }

  const FullName = document.getElementById("EmpFullName").value.trim();
  const Email = document.getElementById("EmpEmail").value.trim();
  const Role = document.getElementById("EmpRole").value.trim();
  const Status = document.getElementById("EmpStatus").value.trim();

  try {
    const url =
      `${WEB_APP_URL}?action=updateEmployee` +
      `&Id=${encodeURIComponent(currentEmployeeID)}` +
      `&FullName=${encodeURIComponent(FullName)}` +
      `&Email=${encodeURIComponent(Email)}` +
      `&Role=${encodeURIComponent(Role)}` +
      `&Status=${encodeURIComponent(Status)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Employee updated successfully.");
      clearEmployeeForm();
      loadEmployeesForTable();
      populateAssignedToDropdown();
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}
async function deleteEmployee() {
  if (!currentEmployeeID) {
    alert("Select an employee to delete.");
    return;
  }

  if (!confirm("Are you sure you want to delete this employee?")) return;

  try {
    const url = `${WEB_APP_URL}?action=deleteEmployee&Id=${encodeURIComponent(currentEmployeeID)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Employee deleted successfully.");
      clearEmployeeForm();
      loadEmployeesForTable();
      populateAssignedToDropdown();
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}
function searchEmployees() {
  const fullName = document.getElementById("EmpFullName").value.trim().toLowerCase();
  const email = document.getElementById("EmpEmail").value.trim().toLowerCase();
  const role = document.getElementById("EmpRole").value.trim().toLowerCase();
  const status = document.getElementById("EmpStatus").value.trim().toLowerCase();

  // Find the first matching employee
  const match = allEmployees.find(emp => {
    const empName = (emp.FullName || emp.Name || "").toLowerCase();
    const empEmail = (emp.Email || "").toLowerCase();
    const empRole = (emp.Role || "").toLowerCase();
    const empStatus = (emp.Status || "").toLowerCase();

    return (
      (fullName ? empName.includes(fullName) : true) &&
      (email ? empEmail.includes(email) : true) &&
      (role ? empRole.includes(role) : true) &&
      (status ? empStatus.includes(status) : true)
    );
  });

  if (!match) {
    alert("Employee not found.");
    return;
  }

  // Populate form
  loadEmployeeIntoForm(match);

  // ⭐ Update table to show ONLY the found record
  filteredEmployees = [match];
  employeePage = 1;
  renderEmployeePaginated();
}


document.addEventListener("DOMContentLoaded", () => {

  // NAV BUTTONS
  const btnLeads     = document.getElementById("navLeads");
  const btnEmployees = document.getElementById("navEmployees");
  const btnProfile   = document.getElementById("navProfile");

  // PANELS
  const leadPanel     = document.getElementById("leadPanel");
  const employeePanel = document.getElementById("employeePanel");
  const profileSection = document.getElementById("profileSection");

  // PROFILE BUTTONS
  const btnSaveProfile    = document.getElementById("saveProfile");
  const btnChangePassword = document.getElementById("changePassword");

  // SHOW LEADS
  btnLeads.addEventListener("click", () => {
    leadPanel.style.display = "flex";
    employeePanel.style.display = "none";
    profileSection.classList.add("hidden");
  });

  // SHOW EMPLOYEES
  btnEmployees.addEventListener("click", () => {
    leadPanel.style.display = "none";
    employeePanel.style.display = "flex";
    profileSection.classList.add("hidden");
  });

  // SHOW PROFILE
  btnProfile.addEventListener("click", () => {
    leadPanel.style.display = "none";
    employeePanel.style.display = "none";
    profileSection.classList.remove("hidden");
    loadProfile();
  });

  // SAVE PROFILE
  btnSaveProfile.addEventListener("click", saveProfile);

  // CHANGE PASSWORD
  btnChangePassword.addEventListener("click", changePassword);

});

async function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();
  const email = sessionStorage.getItem("hq_email");

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
      alert(result.message);
    }

  } catch (err) {
    console.error("Network error:", err);
  }
}

async function changePassword() {
  const email = sessionStorage.getItem("hq_email");
  const newPassword = prompt("Enter new password");

  if (!newPassword) return;

  try {
    const url =
      `${WEB_APP_URL}?action=changePassword` +
      `&email=${encodeURIComponent(email)}` +
      `&newPassword=${encodeURIComponent(newPassword)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      alert("Password updated successfully");
    } else {
      alert(result.message);
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
