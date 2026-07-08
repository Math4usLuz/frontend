// ========== CONFIG ==========
const API_URL = "https://free-agents-backend.onrender.com";";

// ========== STATE ==========
let currentUser = null;
let allPlayers = [];
let currentPage = "home";

// ========== INIT ==========a
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("app").style.display = "block";
});

// ========== AUTH ==========
function checkAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
        localStorage.setItem("fa_token", token);
        window.history.replaceState({}, document.title, "/");
    }

    const savedToken = localStorage.getItem("fa_token");
    if (savedToken) {
        fetchUserData(savedToken);
    }
}

async function fetchUserData(token) {
    try {
        const res = await fetch(`${API_URL}/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            currentUser = await res.json();
            updateUIForLoggedInUser();
        } else {
            localStorage.removeItem("fa_token");
            currentUser = null;
        }
    } catch (err) {
        console.error("Erro ao buscar usuário:", err);
    }
}

function handleLoginClick() {
    if (currentUser) {
        showUserModal();
    } else {
        showLoginModal();
    }
}

function showLoginModal() {
    document.getElementById("login-modal").style.display = "flex";
}

function closeLoginModal() {
    document.getElementById("login-modal").style.display = "none";
}

async function loginWithDiscord() {
    try {
        const res = await fetch(`${API_URL}/auth/discord/login`);
        const data = await res.json();
        window.location.href = data.url;
    } catch (err) {
        alert("Erro ao iniciar login com Discord");
    }
}

function showUserModal() {
    if (!currentUser) return;
    const avatarId = currentUser.avatar;
    const userId = currentUser.discord_id;
    document.getElementById("user-avatar").src = avatarId
        ? `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=128`
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    document.getElementById("user-name").textContent = currentUser.global_name || currentUser.username;
    document.getElementById("user-discord").textContent = `@${currentUser.username}`;
    document.getElementById("user-modal").style.display = "flex";
}

function closeUserModal() {
    document.getElementById("user-modal").style.display = "none";
}

function logout() {
    localStorage.removeItem("fa_token");
    currentUser = null;
    closeUserModal();
    updateUIForLoggedInUser();
    alert("Você saiu da conta.");
}

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById("login-btn-sidebar");
    if (currentUser) {
        loginBtn.style.color = "#22C55E";
        loginBtn.title = currentUser.global_name || currentUser.username;
    } else {
        loginBtn.style.color = "";
        loginBtn.title = "Login Discord";
    }
}

// ========== THEME ==========
function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    document.getElementById("theme-icon").className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
    localStorage.setItem("fa-theme", theme);
}

function toggleTheme() {
    const current = document.body.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
}

applyTheme(localStorage.getItem("fa-theme") || "dark");

// ========== NAVIGATION ==========
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");

    document.querySelectorAll(".sidebar-item[data-page]").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.page === page) item.classList.add("active");
    });

    if (page === "players") loadPlayers();
}

// ========== PLAYERS ==========
async function loadPlayers() {
    const grid = document.getElementById("players-grid");
    grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-3);"><div class="spinner"></div><p>Carregando...</p></div>';

    try {
        const res = await fetch(`${API_URL}/players`);
        const data = await res.json();
        allPlayers = data.players || data;
        populateFilters();
        renderPlayers(allPlayers);
    } catch (err) {
        grid.innerHTML = `<div style="text-align:center;padding:60px;color:#EF4444;">
            <i class="bi bi-exclamation-triangle-fill" style="font-size:3rem;"></i>
            <p style="margin-top:12px;">Erro: ${err.message}</p>
            <button class="btn-primary mt-3" onclick="loadPlayers()">Tentar novamente</button>
        </div>`;
    }
}

function populateFilters() {
    const positions = [...new Set(allPlayers.map(p => p.position))];
    const select = document.getElementById("filter-select");
    select.innerHTML = '<option value="">Todas Posições</option>';
    positions.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        select.appendChild(opt);
    });
}

function filterPlayers() {
    const search = document.getElementById("search-input").value.toLowerCase();
    const filter = document.getElementById("filter-select").value;
    const filtered = allPlayers.filter(p => {
        const match = p.name.toLowerCase().includes(search) || p.nationality.toLowerCase().includes(search);
        const posMatch = !filter || p.position === filter;
        return match && posMatch;
    });
    renderPlayers(filtered);
}

function renderPlayers(players) {
    const grid = document.getElementById("players-grid");
    document.getElementById("players-count").textContent = `${players.length} jogador(es) — Dados da API`;

    if (players.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-3);"><i class="bi bi-search" style="font-size:3rem;"></i><p style="margin-top:12px;">Nenhum jogador encontrado.</p></div>';
        return;
    }

    grid.innerHTML = players.map(p => `
        <div class="player-card" onclick="openPlayerModal(${p.id})">
            <div class="card-badge"><span class="dot"></span>Disponível</div>
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="card-avatar">${p.initials || p.name.substring(0,2).toUpperCase()}</div>
                <div>
                    <div class="card-name">${p.name}</div>
                    <div class="card-position">${p.position}</div>
                </div>
            </div>
            <div class="card-stats">
                <div class="stat-item"><div class="stat-value">${p.overall}</div><div class="stat-label">Overall</div></div>
                <div class="stat-item"><div class="stat-value">${p.age}</div><div class="stat-label">Idade</div></div>
                <div class="stat-item"><div class="stat-value">${p.pos || '-'}</div><div class="stat-label">Pos</div></div>
            </div>
            <div style="font-size:.78rem;color:var(--text-3);display:flex;justify-content:space-between;">
                <span>🌍 ${p.nationality}</span>
                <span>🏟️ ${p.last_club || '-'}</span>
            </div>
        </div>
    `).join("");
}

function openPlayerModal(id) {
    const player = allPlayers.find(p => p.id === id);
    if (!player) return;
    document.getElementById("modal-body").innerHTML = `
        <div class="text-center mb-3">
            <div class="card-avatar" style="margin:0 auto 14px;width:80px;height:80px;font-size:1.5rem;">${player.initials || player.name.substring(0,2).toUpperCase()}</div>
            <h3 style="font-family:var(--ff-display);font-weight:700;margin-bottom:4px;">${player.name}</h3>
            <span style="color:var(--purple-hover);font-weight:600;font-size:.85rem;">${player.position}</span>
        </div>
        <div class="card-stats mb-3">
            <div class="stat-item"><div class="stat-value">${player.overall}</div><div class="stat-label">Overall</div></div>
            <div class="stat-item"><div class="stat-value">${player.age}</div><div class="stat-label">Idade</div></div>
            <div class="stat-item"><div class="stat-value">${player.height}</div><div class="stat-label">Altura</div></div>
            <div class="stat-item"><div class="stat-value">${player.foot}</div><div class="stat-label">Pé</div></div>
        </div>
        <p style="color:var(--text-2);margin-bottom:8px;"><strong>🌍 Nacionalidade:</strong> ${player.nationality}</p>
        <p style="color:var(--text-2);margin-bottom:16px;"><strong>🏟️ Último Clube:</strong> ${player.last_club || '-'}</p>
        <button class="btn-primary" style="width:100%;justify-content:center;" onclick="alert('Em breve!')"><i class="bi bi-envelope-fill"></i> Entrar em Contato</button>
    `;
    document.getElementById("player-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("player-modal").style.display = "none";
}

// ========== REGISTER ==========
async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const msg = document.getElementById("register-msg");
    msg.style.color = "var(--text-2)";
    msg.textContent = "Cadastrando...";

    const data = {
        name: form.name.value,
        position: form.position.value,
        age: parseInt(form.age.value),
        overall: parseInt(form.overall.value),
        nationality: form.nationality.value,
        height: form.height.value,
        foot: form.foot.value,
        last_club: form.last_club.value,
        initials: form.initials.value.toUpperCase(),
        pos: form.pos.value.toUpperCase(),
    };

    try {
        const res = await fetch(`${API_URL}/players`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            msg.style.color = "#22C55E";
            msg.textContent = "✅ Jogador cadastrado com sucesso!";
            form.reset();
            setTimeout(() => { msg.textContent = ""; }, 3000);
        } else {
            throw new Error("Erro ao cadastrar");
        }
    } catch (err) {
        msg.style.color = "#EF4444";
        msg.textContent = `❌ ${err.message}`;
    }
}
