// --- CONFIGURATION ---
const NETLIFY_ACCESS_TOKEN = 'YOUR_NETLIFY_TOKEN';
const FORM_ID = 'YOUR_FORM_ID';
const SUPABASE_URL = 'https://YOUR_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
// ---------------------
// Idle Timeout (e.g., 10 minutes = 10 * 60 * 1000)
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; 
// ---------------------

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const tableBody = document.getElementById('table-body');
const loadingState = document.getElementById('loading-state');
const tableArea = document.getElementById('table-area');

let idleTimer;

/**
 * 1. IDLE TIMEOUT SYSTEM
 */
function resetIdleTimer() {
    // Clear the existing timer
    if (idleTimer) clearTimeout(idleTimer);

    // If logged in, set a new timer to logout
    idleTimer = setTimeout(() => {
        const { data: { session } } = _supabase.auth.getSession().then(({data}) => {
            if (data.session) {
                console.log("User idle for too long. Logging out...");
                alert("Logged out due to inactivity.");
                handleLogout();
            }
        });
    }, IDLE_TIMEOUT_MS);
}

// Events that indicate the user is active
const activeEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

function startIdleTracking() {
    activeEvents.forEach(evt => {
        document.addEventListener(evt, resetIdleTimer, false);
    });
    resetIdleTimer(); // Start the first timer
}

function stopIdleTracking() {
    activeEvents.forEach(evt => {
        document.removeEventListener(evt, resetIdleTimer, false);
    });
    if (idleTimer) clearTimeout(idleTimer);
}

/**
 * 2. AUTHENTICATION
 */
async function checkAuth() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    stopIdleTracking(); // No need to track idle on login screen
    loginContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
}

function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    startIdleTracking(); // Start tracking inactivity
    fetchLeads();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.innerText = "Authenticating...";
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        loginError.innerText = "Login failed: " + error.message;
    } else {
        showDashboard();
    }
});

async function handleLogout() {
    stopIdleTracking();
    await _supabase.auth.signOut();
    location.reload();
}

/**
 * 3. DATA MANAGEMENT (Netlify)
 */
async function fetchLeads() {
    try {
        const response = await fetch(`https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`, {
            headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
        });
        if (!response.ok) throw new Error("Could not connect to Netlify API");
        const data = await response.json();
        renderTable(data);
    } catch (err) {
        loadingState.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    }
}

function renderTable(submissions) {
    loadingState.style.display = 'none';
    tableArea.style.display = 'block';
    tableBody.innerHTML = '';

    submissions.forEach(s => {
        const tr = document.createElement('tr');
        tr.setAttribute('id', `row-${s.id}`);
        tr.innerHTML = `
            <td>${new Date(s.created_at).toLocaleDateString()}</td>
            <td style="font-weight:600">${s.data.full_name || 'N/A'}</td>
            <td>${s.data.email || 'N/A'}</td>
            <td>${s.data.phone || 'N/A'}</td>
            <td title="${s.data.message || ''}" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${s.data.message || ''}
            </td>
            <td>
                <button class="btn-delete" onclick="deleteEntry('${s.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

async function deleteEntry(id) {
    if (!confirm("Delete this lead permanently?")) return;

    const row = document.getElementById(`row-${id}`);
    row.style.opacity = "0.5";

    try {
        const response = await fetch(`https://api.netlify.com/api/v1/submissions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
        });

        if (response.ok || response.status === 204) {
            row.classList.add('fade-out');
            setTimeout(() => row.remove(), 500);
        } else {
            throw new Error("Deletion failed on Netlify side");
        }
    } catch (err) {
        alert(err.message);
        row.style.opacity = "1";
    }
}

/**
 * 4. EXPORTING
 */
document.getElementById('export-excel-btn').addEventListener('click', () => {
    const table = document.getElementById('submissions-table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Leads" });
    XLSX.writeFile(wb, `Flight_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
    const rows = Array.from(document.querySelectorAll('table tr'));
    const csv = rows.map(r => Array.from(r.querySelectorAll('th,td'))
                .slice(0, 5) // Exclude Actions/Delete column
                .map(c => `"${c.innerText.trim()}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'flight_leads.csv'; a.click();
});

// Run check on page load
window.onload = checkAuth;
