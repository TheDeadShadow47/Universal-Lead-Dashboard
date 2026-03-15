// --- CONFIGURATION ---
const NETLIFY_ACCESS_TOKEN = 'YOUR_NETLIFY_TOKEN';
const FORM_ID = 'YOUR_FORM_ID';
const SUPABASE_URL = 'https://YOUR_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
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

/**
 * 1. GUARD FUNCTION: The Entry Point
 */
async function checkAuthentication() {
    // Check if Supabase has a saved session for this user
    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error || !session) {
        // NOT LOGGED IN: Show login, hide dashboard
        showLoginUI();
    } else {
        // LOGGED IN: Show dashboard and fetch data
        showDashboardUI();
    }
}

/**
 * 2. UI TOGGLES
 */
function showLoginUI() {
    loginContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
}

function showDashboardUI() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    
    // ONLY fetch the sensitive data once we are sure the user is authenticated
    fetchNetlifyData();
}

/**
 * 3. AUTHENTICATION ACTIONS
 */

// Handle Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.innerText = "Authenticating...";
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.innerText = "Access Denied: " + error.message;
    } else {
        // Successful login will trigger UI change
        showDashboardUI();
    }
});

// Handle Logout
async function handleLogout() {
    await _supabase.auth.signOut();
    // Redirect back to login state
    location.reload(); 
}

/**
 * 4. SECURE DATA FETCHING
 */
async function fetchNetlifyData() {
    try {
        // Re-verify session right before fetching (Security Best Practice)
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`, {
            headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
        });

        if (!response.ok) throw new Error('Netlify API connection failed');

        const submissions = await response.json();
        renderTable(submissions);
    } catch (err) {
        loadingState.innerHTML = `<p style="color:red">Fetch Error: ${err.message}</p>`;
    }
}

function renderTable(submissions) {
    loadingState.style.display = 'none';
    tableArea.style.display = 'block';
    tableBody.innerHTML = '';

    submissions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(s.created_at).toLocaleDateString()}</td>
            <td style="font-weight:600">${s.data.full_name || 'N/A'}</td>
            <td>${s.data.email || 'N/A'}</td>
            <td>${s.data.phone || 'N/A'}</td>
            <td>${s.data.message || ''}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * 5. EXPORT LOGIC
 */
document.getElementById('export-excel-btn').addEventListener('click', () => {
    const table = document.getElementById('submissions-table');
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `FlightLeads_${new Date().toISOString().split('T')[0]}.xlsx`);
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
    const rows = Array.from(document.querySelectorAll('table tr'));
    const csv = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => `"${c.innerText}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click();
});

// INITIALIZE: Run the check when the page loads
window.addEventListener('DOMContentLoaded', checkAuthentication);