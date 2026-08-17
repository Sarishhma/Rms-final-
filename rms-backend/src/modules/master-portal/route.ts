import { Hono } from "hono";

export const masterPortalRoutes = new Hono();

masterPortalRoutes.get("/", (c) =>
  c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Master Portal</title>
  <style>
    :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; background: #f6f7fb; color: #172033; display: grid; place-items: center; padding: 32px 0; }
    main { width: min(1040px, calc(100vw - 32px)); display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    section { background: #fff; border: 1px solid #e1e5ee; border-radius: 8px; padding: 24px; box-shadow: 0 12px 32px rgba(23, 32, 51, .08); }
    h1 { grid-column: 1 / -1; margin: 0 0 4px; font-size: 28px; }
    h2 { margin: 0 0 18px; font-size: 18px; }
    label { display: block; margin: 14px 0 6px; font-size: 13px; font-weight: 650; color: #36445c; }
    input { width: 100%; box-sizing: border-box; border: 1px solid #cfd6e4; border-radius: 6px; padding: 11px 12px; font-size: 14px; }
    button { margin-top: 18px; width: 100%; border: 0; border-radius: 6px; padding: 12px 14px; font-size: 14px; font-weight: 700; background: #f97316; color: #fff; cursor: pointer; }
    button.secondary { background: #172033; }
    .status { grid-column: 1 / -1; min-height: 20px; font-size: 14px; font-weight: 650; }
    .ok { color: #117a37; }
    .err { color: #b42318; }
    .muted { color: #667085; font-size: 13px; margin-top: 10px; line-height: 1.5; }
    .wide { grid-column: 1 / -1; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .toolbar button { width: auto; margin: 0; padding: 9px 12px; background: #36445c; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; border-bottom: 1px solid #e8ecf3; padding: 10px 8px; }
    th { color: #667085; font-size: 12px; text-transform: uppercase; }
    .pill { display: inline-block; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 700; background: #eef4ff; color: #2454a6; }
    .empty { color: #667085; padding: 14px 8px; }
    @media (max-width: 760px) { main { grid-template-columns: 1fr; } h1, .status { grid-column: auto; } }
  </style>
</head>
<body>
  <main>
    <h1>Master Portal</h1>
    <div id="status" class="status"></div>

    <section>
      <h2>Master Login</h2>
      <form id="loginForm">
        <label for="masterEmail">Email</label>
        <input id="masterEmail" type="email" autocomplete="username" required />
        <label for="masterPassword">Password</label>
        <input id="masterPassword" type="password" autocomplete="current-password" minlength="8" required />
        <button type="submit">Login</button>
      </form>
      <p class="muted">Use the seeded MASTER account from MASTER_EMAIL and MASTER_PASSWORD.</p>
    </section>

    <section>
      <h2>Create Restaurant Admin</h2>
      <form id="adminForm">
        <label for="adminName">Name</label>
        <input id="adminName" type="text" autocomplete="name" />
        <label for="adminEmail">Email</label>
        <input id="adminEmail" type="email" autocomplete="off" required />
        <label for="adminPassword">Password</label>
        <input id="adminPassword" type="password" autocomplete="new-password" minlength="8" required />
        <button class="secondary" type="submit">Create Admin</button>
      </form>
      <p class="muted">The admin is created without a company. After admin login, your app can force company registration while companyId is null.</p>
    </section>

    <section class="wide">
      <div class="toolbar">
        <h2>Registered Admins</h2>
        <button id="refreshAdmins" type="button">Refresh</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody id="adminRows">
          <tr><td class="empty" colspan="5">Login as MASTER to load admins.</td></tr>
        </tbody>
      </table>
    </section>
  </main>
  <script>
    let token = localStorage.getItem("masterToken") || "";
    const statusEl = document.getElementById("status");
    const setStatus = (message, ok = true) => {
      statusEl.textContent = message;
      statusEl.className = "status " + (ok ? "ok" : "err");
    };
    if (token) setStatus("Master token loaded.");

    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

    const loadAdmins = async () => {
      if (!token) {
        setStatus("Login as MASTER first.", false);
        return;
      }
      const response = await fetch("/api/auth/admins", {
        headers: { Authorization: "Bearer " + token }
      });
      const body = await response.json();
      const rows = document.getElementById("adminRows");
      if (!response.ok || !body.success) {
        rows.innerHTML = '<tr><td class="empty" colspan="5">Unable to load admins.</td></tr>';
        setStatus(body.error?.message || "Unable to load admins.", false);
        return;
      }
      if (!body.data.length) {
        rows.innerHTML = '<tr><td class="empty" colspan="5">No admins created yet.</td></tr>';
        return;
      }
      rows.innerHTML = body.data.map((admin) => {
        const company = admin.company ? admin.company.name + " (" + admin.company.slug + ")" : "Not registered";
        return '<tr>' +
          '<td>' + escapeHtml(admin.name || "-") + '</td>' +
          '<td>' + escapeHtml(admin.email) + '</td>' +
          '<td>' + escapeHtml(company) + '</td>' +
          '<td><span class="pill">' + escapeHtml(admin.isActive ? "ACTIVE" : "INACTIVE") + '</span></td>' +
          '<td>' + escapeHtml(new Date(admin.createdAt).toLocaleDateString()) + '</td>' +
          '</tr>';
      }).join("");
    };

    document.getElementById("refreshAdmins").addEventListener("click", loadAdmins);

    document.getElementById("loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("masterEmail").value,
          password: document.getElementById("masterPassword").value
        })
      });
      const body = await response.json();
      if (!response.ok || !body.success || body.data.user.role !== "MASTER") {
        token = "";
        localStorage.removeItem("masterToken");
        setStatus(body.error?.message || "Master login failed.", false);
        return;
      }
      token = body.data.accessToken;
      localStorage.setItem("masterToken", token);
      setStatus("Logged in as MASTER.");
      await loadAdmins();
    });

    document.getElementById("adminForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!token) {
        setStatus("Login as MASTER first.", false);
        return;
      }
      const response = await fetch("/api/auth/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          name: document.getElementById("adminName").value || undefined,
          email: document.getElementById("adminEmail").value,
          password: document.getElementById("adminPassword").value
        })
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setStatus(body.error?.message || "Admin creation failed.", false);
        return;
      }
      event.target.reset();
      setStatus("Admin created: " + body.data.email);
      await loadAdmins();
    });
  </script>
</body>
</html>`)
);
