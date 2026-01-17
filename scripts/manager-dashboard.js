// =====================================
// Manager Dashboard JS (FULL FIXED VERSION)
// =====================================

// ⭐ BACKEND URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxn6G7l5mLFQ8pKDCjCoPivwpoiDCyqjIfsCjU4abHmzWBTxMvoGGJCnIybnh6VR3IhMg/exec";

// =====================================
// GLOBAL STATE
// =====================================
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
// MAIN INITIALIZATION
// =====================================
document.addEventListener("DOMContentLoaded", () => {

    const email = sessionStorage.getItem("hq_email");
    const role  = sessionStorage.getItem("hq_role");

    if (!email || role !== "manager") {
        window.location.href = "index.html";
        return;
    }

    initManagerDashboard();

    // ------------------------------
    // LEAD BUTTONS
    // ------------------------------
    document.getElementById("saveNewLead").addEventListener("click", addLead);
    document.getElementById("updateLead").addEventListener("click", updateLead);
    document.getElementById("deleteLead").addEventListener("click", deleteLead);
    document.getElementById("searchLead").addEventListener("click", searchLeads);
    document.getElementById("clearLead").addEventListener("click", clearLeadForm);

    // ------------------------------
    // EMPLOYEE BUTTONS
    // ------------------------------
    document.getElementById("addEmployeeBtn").addEventListener("click", addEmployee);
    document.getElementById("updateEmployeeBtn").addEventListener("click", updateEmployee);
    document.getElementById("deleteEmployeeBtn").addEventListener("click", deleteEmployee);
    document.getElementById("searchEmployeeBtn").addEventListener("click", searchEmployees);
    document.getElementById("clearEmployeeBtn").addEventListener("click", clearEmployeeForm);

    // ------------------------------
    // NAVIGATION BUTTONS
    // ------------------------------
    const btnLeads     = document.getElementById("navLeads");
    const btnEmployees = document.getElementById("navEmployees");
    const btnProfile   = document.getElementById("navProfile");

    const leadPanel     = document.getElementById("leadPanel");
    const employeePanel = document.getElementById("employeePanel");
    const profilePanel  = document.getElementById("profilePanel");

    // Leads panel
    btnLeads.addEventListener("click", () => {
        leadPanel.style.display = "flex";
        employeePanel.style.display = "none";
        profilePanel.style.display = "none";
    });

    // Employees panel
    btnEmployees.addEventListener("click", () => {
        leadPanel.style.display = "none";
        employeePanel.style.display = "flex";
        profilePanel.style.display = "none";

        loadEmployeesForTable();
    });

    // ⭐ Profile panel FIXED
    btnProfile.addEventListener("click", () => {
        leadPanel.style.display = "none";
        employeePanel.style.display = "none";
        profilePanel.style.display = "flex";
    });
});

// =====================================
// DASHBOARD INITIALIZATION
// =====================================
async function initManagerDashboard() {
    await loadEmployees();
    populateAssignedToDropdown();
    await loadLeads();
}

// =====================================
// POPULATE ASSIGNED-TO DROPDOWN
// =====================================
function populateAssignedToDropdown() {
    const dropdown = document.getElementById("AssignedTo");
    dropdown.innerHTML = "";

    employees.forEach(emp => {
        const fullName = emp.FullName || emp.Name;

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
        const response = await fetch(`${WEB_APP_URL}?action=getLeads&role=manager`);
        const result = await response.json();

        if (result.success) {
            allLeads = result.leads;
            filteredLeads = [...allLeads];
            leadPage = 1;
            renderLeadPaginated();
        } else {
            console.error("Error:", result.message);
        }
    } catch (err) {
        console.error("Load Leads Error:", err);
    }
}

// =====================================
// RENDER LEADS TABLE
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
    const page = filteredLeads.slice(start, start + leadPageSize);

    renderLeadTable(page);
    renderLeadPaginationControls();
}

function renderLeadPaginationControls() {
    const container = document.getElementById("leadPagination");
    container.innerHTML = "";

    const totalPages = Math.ceil(filteredLeads.length / leadPageSize);

    const prev = document.createElement("button");
    prev.textContent = "Prev";
    prev.disabled = leadPage === 1;
    prev.onclick = () => { leadPage--; renderLeadPaginated(); };
    container.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.style.fontWeight = i === leadPage ? "bold" : "normal";
        btn.onclick = () => { leadPage = i; renderLeadPaginated(); };
        container.appendChild(btn);
    }

    const next = document.createElement("button");
    next.textContent = "Next";
    next.disabled = leadPage === totalPages;
    next.onclick = () => { leadPage++; renderLeadPaginated(); };
    container.appendChild(next);
}

// =====================================
// LEAD FORM FUNCTIONS
// =====================================
function loadLeadIntoForm(lead) {
    currentLeadID = lead.LeadID;

    document.getElementById("FullName").value   = lead.FullName;
    document.getElementById("Email").value      = lead.Email;
    document.getElementById("Phone").value      = lead.Phone;
    document.getElementById("Source").value     = lead.Source;
    document.getElementById("Status").value     = lead.Status;
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

    filteredLeads = [...allLeads];
    leadPage = 1;
    renderLeadPaginated();
}

// =====================================
// LEAD CRUD — ADD / UPDATE / DELETE
// =====================================
async function addLead() {
    const FullName   = document.getElementById("FullName").value.trim();
    const Email      = document.getElementById("Email").value.trim();
    const Phone      = document.getElementById("Phone").value.trim();
    const Source     = document.getElementById("Source").value.trim();
    const Status     = document.getElementById("Status").value.trim();
    const AssignedTo = document.getElementById("AssignedTo").value.trim();

    if (!FullName || !Email) {
        alert("Full Name and Email are required.");
        return;
    }

    const url =
        `${WEB_APP_URL}?action=addLead` +
        `&FullName=${encodeURIComponent(FullName)}` +
        `&Email=${encodeURIComponent(Email)}` +
        `&Phone=${encodeURIComponent(Phone)}` +
        `&Source=${encodeURIComponent(Source)}` +
        `&Status=${encodeURIComponent(Status)}` +
        `&AssignedTo=${encodeURIComponent(AssignedTo)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            alert("Lead added successfully!");
            clearLeadForm();
            loadLeads();
        } else {
            alert(result.message || "Error adding lead.");
        }
    } catch (err) {
        console.error("Add Lead Error:", err);
    }
}

async function updateLead() {
    if (!currentLeadID) {
        alert("Select a lead to update.");
        return;
    }

    const FullName   = document.getElementById("FullName").value.trim();
    const Email      = document.getElementById("Email").value.trim();
    const Phone      = document.getElementById("Phone").value.trim();
    const Source     = document.getElementById("Source").value.trim();
    const Status     = document.getElementById("Status").value.trim();
    const AssignedTo = document.getElementById("AssignedTo").value.trim();

    const url =
        `${WEB_APP_URL}?action=updateLead` +
        `&leadId=${encodeURIComponent(currentLeadID)}` +
        `&FullName=${encodeURIComponent(FullName)}` +
        `&Email=${encodeURIComponent(Email)}` +
        `&Phone=${encodeURIComponent(Phone)}` +
        `&Source=${encodeURIComponent(Source)}` +
        `&Status=${encodeURIComponent(Status)}` +
        `&AssignedTo=${encodeURIComponent(AssignedTo)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            alert("Lead updated successfully!");
            clearLeadForm();
            loadLeads();
        } else {
            alert(result.message || "Error updating lead.");
        }
    } catch (err) {
        console.error("Update Lead Error:", err);
    }
}

async function deleteLead() {
    if (!currentLeadID) {
        alert("Select a lead to delete.");
        return;
    }

    if (!confirm("Are you sure you want to delete this lead?")) return;

    const url = `${WEB_APP_URL}?action=deleteLead&leadId=${encodeURIComponent(currentLeadID)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            alert("Lead deleted successfully!");
            clearLeadForm();
            loadLeads();
        } else {
            alert(result.message || "Error deleting lead.");
        }
    } catch (err) {
        console.error("Delete Lead Error:", err);
    }
}

function searchLeads() {
    const name   = document.getElementById("FullName").value.trim().toLowerCase();
    const email  = document.getElementById("Email").value.trim().toLowerCase();
    const phone  = document.getElementById("Phone").value.trim().toLowerCase();
    const source = document.getElementById("Source").value.trim().toLowerCase();
    const status = document.getElementById("Status").value.trim().toLowerCase();

    const match = allLeads.find(lead => {
        return (
            (!name   || lead.FullName.toLowerCase().includes(name)) &&
            (!email  || lead.Email.toLowerCase().includes(email)) &&
            (!phone  || lead.Phone.toLowerCase().includes(phone)) &&
            (!source || lead.Source.toLowerCase().includes(source)) &&
            (!status || lead.Status.toLowerCase().includes(status))
        );
    });

    if (!match) {
        alert("Lead not found.");
        return;
    }

    currentLeadID = match.LeadID;
    loadLeadIntoForm(match);

    filteredLeads = [match];
    leadPage = 1;
    renderLeadPaginated();
}

// =====================================
// LOAD EMPLOYEES
// =====================================
async function loadEmployees() {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getEmployees`);
        const result = await response.json();

        if (result.success) {
            employees = result.employees;
            allEmployees = [...employees];
            filteredEmployees = [...employees];
            employeePage = 1;

            renderEmployeePaginated();
        } else {
            console.error("Error loading employees:", result.message);
        }
    } catch (err) {
        console.error("Load Employees Error:", err);
    }
}

// =====================================
// EMPLOYEE TABLE
// =====================================
function renderEmployeeTable(list) {
    const tbody = document.getElementById("employeeTableBody");
    tbody.innerHTML = "";

    list.forEach(emp => {
        const fullName = emp.FullName || emp.Name;

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
    const page = filteredEmployees.slice(start, start + employeePageSize);

    renderEmployeeTable(page);
    renderEmployeePaginationControls();
}

function renderEmployeePaginationControls() {
    const container = document.getElementById("employeePagination");
    container.innerHTML = "";

    const totalPages = Math.ceil(filteredEmployees.length / employeePageSize);

    const prev = document.createElement("button");
    prev.textContent = "Prev";
    prev.disabled = employeePage === 1;
    prev.onclick = () => { employeePage--; renderEmployeePaginated(); };
    container.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.style.fontWeight = i === employeePage ? "bold" : "normal";
        btn.onclick = () => { employeePage = i; renderEmployeePaginated(); };
        container.appendChild(btn);
    }

    const next = document.createElement("button");
    next.textContent = "Next";
    next.disabled = employeePage === totalPages;
    next.onclick = () => { employeePage++; renderEmployeePaginated(); };
    container.appendChild(next);
}

// =====================================
// EMPLOYEE FORM
// =====================================
function loadEmployeeIntoForm(emp) {
    currentEmployeeID = emp.Id;

    document.getElementById("EmpFullName").value = emp.FullName || emp.Name;
    document.getElementById("EmpEmail").value    = emp.Email;
    document.getElementById("EmpRole").value     = emp.Role;
    document.getElementById("EmpStatus").value   = emp.Status;
}

function clearEmployeeForm() {
    currentEmployeeID = null;

    document.getElementById("EmpFullName").value = "";
    document.getElementById("EmpEmail").value = "";
    document.getElementById("EmpRole").value = "";
    document.getElementById("EmpStatus").value = "";

    filteredEmployees = [...allEmployees];
    employeePage = 1;
    renderEmployeePaginated();
}

// =====================================
// EMPLOYEE CRUD
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

    const url =
        `${WEB_APP_URL}?action=addEmployee` +
        `&FullName=${encodeURIComponent(FullName)}` +
        `&Email=${encodeURIComponent(Email)}` +
        `&Role=${encodeURIComponent(Role)}` +
        `&Status=${encodeURIComponent(Status)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            alert("Employee added successfully!");
            clearEmployeeForm();
            loadEmployees();
            populateAssignedToDropdown();
        } else {
            alert(result.message || "Error adding employee.");
        }
    } catch (err) {
        console.error("Add Employee Error:", err);
    }
}

async function updateEmployee() {
    if (!currentEmployeeID) {
        alert("Select an employee to update.");
        return;
    }

    const FullName = document.getElementById("EmpFullName").value.trim();
    const Email = document.getElementById("EmpEmail").value.trim();
    const Role  = document.getElementById("EmpRole").value.trim();
    const Status = document.getElementById("EmpStatus").value.trim();

    const url =
        `${WEB_APP_URL}?action=updateEmployee` +
        `&Id=${encodeURIComponent(currentEmployeeID)}` +
        `&FullName=${encodeURIComponent(FullName)}` +
        `&Email=${encodeURIComponent(Email)}` +
        `&Role=${encodeURIComponent(Role)}` +
        `&Status=${encodeURIComponent(Status)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            alert("Employee updated successfully!");
            clearEmployeeForm();
            loadEmployees();
            populateAssignedToDropdown();
        } else {
            alert(result.message || "Error updating employee.");
        }
    } catch (err) {
        console.error("Update Employee Error:", err);
    }
}

async function deleteEmployee() {
    if (!currentEmployeeID) {
        alert("Select an employee to delete.");
        return;
    }

    if (!confirm("Are you sure you want to delete this employee?")) return;

    const url = `${WEB_APP_URL}?action=deleteEmployee&Id=${encodeURIComponent(currentEmployeeID)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            alert("Employee deleted successfully!");
            clearEmployeeForm();
            loadEmployees();
            populateAssignedToDropdown();
        } else {
            alert(result.message || "Error deleting employee.");
        }
    } catch (err) {
        console.error("Delete Employee Error:", err);
    }
}

function searchEmployees() {
    const fullName = document.getElementById("EmpFullName").value.trim().toLowerCase();
    const email = document.getElementById("EmpEmail").value.trim().toLowerCase();
    const role = document.getElementById("EmpRole").value.trim().toLowerCase();
    const status = document.getElementById("EmpStatus").value.trim().toLowerCase();

    const match = allEmployees.find(emp => {
        const name  = (emp.FullName || emp.Name || "").toLowerCase();
        const em    = (emp.Email || "").toLowerCase();
        const rl    = (emp.Role || "").toLowerCase();
        const st    = (emp.Status || "").toLowerCase();

        return (
            (!fullName || name.includes(fullName)) &&
            (!email    || em.includes(email)) &&
            (!role     || rl.includes(role)) &&
            (!status   || st.includes(status))
        );
    });

    if (!match) {
        alert("Employee not found.");
        return;
    }

    loadEmployeeIntoForm(match);

    filteredEmployees = [match];
    employeePage = 1;
    renderEmployeePaginated();
}

// =====================================
// LOADING EMPLOYEE TABLE DIRECTLY
// =====================================
function loadEmployeesForTable() {
    filteredEmployees = [...allEmployees];
    employeePage = 1;
    renderEmployeePaginated();
}