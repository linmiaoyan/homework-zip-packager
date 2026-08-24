const galleryGrid = document.getElementById("gallery-grid");
const galleryStatus = document.getElementById("gallery-status");
const refreshBtn = document.getElementById("refresh-gallery");
const adminOpenBtn = document.getElementById("admin-open");
const adminModal = document.getElementById("admin-modal");
const adminCloseBtn = document.getElementById("admin-close");
const adminLoginForm = document.getElementById("admin-login-form");
const adminPanel = document.getElementById("admin-panel");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginError = document.getElementById("admin-login-error");
const adminSyncBtn = document.getElementById("admin-sync-notes");
const adminList = document.getElementById("admin-list");
const adminStatus = document.getElementById("admin-status");

const ADMIN_KEY = "gallery_admin_auth";

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderRatingSummary(ratings) {
  if (!ratings || !ratings.count) return "暂无评分";
  return `${ratings.count} 人评分 · 均分 ${ratings.average}`;
}

function renderIntro(intro) {
  if (!intro || !intro.description) {
    return `<p class="game-card-intro muted">暂无项目简介</p>`;
  }
  const source =
    intro.source === "admin"
      ? "管理员编辑"
      : intro.source === "note.ms"
        ? `note.ms #${intro.match_doc || "?"}`
        : "";
  const preview = intro.description.length > 120
    ? `${intro.description.slice(0, 120)}…`
    : intro.description;
  return `
    <p class="game-card-intro">${escapeHtml(preview)}</p>
    ${source ? `<p class="game-card-intro-source">${escapeHtml(source)}</p>` : ""}`;
}

function renderGameCard(game) {
  if (game.status === "error") {
    return `
      <article class="game-card game-card-error">
        <div class="game-card-body">
          <h2>${escapeHtml(game.title || game.zip_name)}</h2>
          <p class="game-card-meta">${escapeHtml(game.leader || "未知作者")}</p>
          ${renderIntro(game.intro)}
          <p class="game-card-error-text">${escapeHtml(game.error || "部署失败")}</p>
        </div>
      </article>`;
  }

  const subtitle = [game.leader, game.work].filter(Boolean).join(" · ");
  const runtimeLabel =
    game.runtime === "pygame"
      ? "Pygame · 本地运行"
      : game.runtime === "python"
        ? "Python · 本地运行"
        : "网页游戏";
  return `
    <article class="game-card">
      <div class="game-card-body">
        <div class="game-card-top">
          <span class="game-doc">${escapeHtml(game.doc || "—")}</span>
          <span class="game-size">${formatSize(game.zip_size || 0)}</span>
        </div>
        <h2>${escapeHtml(game.work || game.title || game.zip_name)}</h2>
        <p class="game-card-meta">${escapeHtml(subtitle || game.zip_name)}</p>
        ${renderIntro(game.intro)}
        <p class="game-card-runtime">${escapeHtml(runtimeLabel)}</p>
        <p class="game-card-rating">${escapeHtml(renderRatingSummary(game.ratings))}</p>
      </div>
      <div class="game-card-actions">
        <a class="btn-primary" href="/play/${encodeURIComponent(game.slug)}">在线体验</a>
      </div>
    </article>`;
}

function renderGallery(items) {
  if (!items.length) {
    galleryGrid.innerHTML = '<div class="gallery-empty muted">收集目录中还没有压缩包</div>';
    galleryStatus.textContent = "0 个作品";
    return;
  }

  const readyCount = items.filter((item) => item.status === "ready").length;
  galleryStatus.textContent = `已部署 ${readyCount} / ${items.length} 个作品`;
  galleryGrid.innerHTML = items.map(renderGameCard).join("");
}

async function loadGallery({ showLoading = false } = {}) {
  if (showLoading) {
    galleryGrid.innerHTML = '<div class="gallery-loading muted">正在重新部署…</div>';
    galleryStatus.textContent = "正在扫描并部署游戏…";
  }

  try {
    const res = await fetch("/api/games", { cache: "no-store" });
    const data = await res.json();
    renderGallery(data.items || []);
  } catch {
    galleryGrid.innerHTML = '<div class="gallery-empty muted">无法加载游戏列表，请确认服务正在运行。</div>';
    galleryStatus.textContent = "加载失败";
  }
}

function isAdminAuthed() {
  return sessionStorage.getItem(ADMIN_KEY) === "1";
}

function setAdminAuthed(value) {
  if (value) sessionStorage.setItem(ADMIN_KEY, "1");
  else sessionStorage.removeItem(ADMIN_KEY);
}

function openAdminModal() {
  adminModal.hidden = false;
  adminLoginError.textContent = "";
  if (isAdminAuthed()) {
    adminLoginForm.hidden = true;
    adminPanel.hidden = false;
    loadAdminItems();
  } else {
    adminLoginForm.hidden = false;
    adminPanel.hidden = true;
    adminPasswordInput.value = "";
    adminPasswordInput.focus();
  }
}

function closeAdminModal() {
  adminModal.hidden = true;
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Admin-Password": sessionStorage.getItem("admin_password") || "",
  };
}

function setAdminStatus(message, type = "") {
  adminStatus.textContent = message;
  adminStatus.className = type ? `status ${type}` : "status";
}

async function loadAdminItems() {
  adminList.innerHTML = "<p class='muted'>加载中…</p>";
  try {
    const res = await fetch("/api/admin/intros", { headers: adminHeaders(), cache: "no-store" });
    if (res.status === 401) {
      setAdminAuthed(false);
      adminLoginForm.hidden = false;
      adminPanel.hidden = true;
      adminLoginError.textContent = "登录已过期，请重新输入密码。";
      return;
    }
    const data = await res.json();
    renderAdminItems(data.items || []);
  } catch {
    adminList.innerHTML = "<p class='muted'>加载失败</p>";
  }
}

function renderAdminItems(items) {
  if (!items.length) {
    adminList.innerHTML = "<p class='muted'>暂无作品</p>";
    return;
  }

  adminList.innerHTML = items
    .map(
      (item) => `
        <article class="admin-item" data-slug="${escapeHtml(item.slug)}">
          <div class="admin-item-head">
            <div>
              <strong>${escapeHtml(item.work || item.title || item.zip_name)}</strong>
              <div class="admin-item-meta">
                文档号 ${escapeHtml(item.doc || "—")} · ${escapeHtml(item.leader || "未知")}
                · 匹配 note.ms #${escapeHtml(item.match_doc || "无")} (${escapeHtml(String(item.match_score || 0))})
              </div>
            </div>
            ${item.note_url ? `<a class="ghost" href="${escapeHtml(item.note_url)}" target="_blank" rel="noopener">查看原文</a>` : ""}
          </div>
          <label class="field">
            <span>项目简介</span>
            <textarea class="admin-intro-input" rows="4">${escapeHtml(item.description || "")}</textarea>
          </label>
          <div class="admin-item-actions">
            <button type="button" class="ghost admin-reset-btn" data-slug="${escapeHtml(item.slug)}">恢复自动匹配</button>
            <button type="button" class="btn-primary admin-save-btn" data-slug="${escapeHtml(item.slug)}">保存</button>
          </div>
          ${item.note_raw ? `<details class="admin-note-raw"><summary>note.ms 原文</summary><pre>${escapeHtml(item.note_raw)}</pre></details>` : ""}
        </article>`
    )
    .join("");

  adminList.querySelectorAll(".admin-save-btn").forEach((btn) => {
    btn.addEventListener("click", () => saveAdminIntro(btn.dataset.slug));
  });
  adminList.querySelectorAll(".admin-reset-btn").forEach((btn) => {
    btn.addEventListener("click", () => resetAdminIntro(btn.dataset.slug));
  });
}

async function saveAdminIntro(slug) {
  const card = adminList.querySelector(`.admin-item[data-slug="${slug}"]`);
  const description = card?.querySelector(".admin-intro-input")?.value ?? "";
  setAdminStatus("正在保存…");
  try {
    const res = await fetch(`/api/admin/intros/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "保存失败");
    setAdminStatus("已保存", "success");
    await loadGallery({ silent: true });
    await loadAdminItems();
  } catch (error) {
    setAdminStatus(error.message, "error");
  }
}

async function resetAdminIntro(slug) {
  setAdminStatus("正在恢复…");
  try {
    const res = await fetch(`/api/admin/intros/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: adminHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "恢复失败");
    setAdminStatus("已恢复自动匹配", "success");
    await loadGallery({ silent: true });
    await loadAdminItems();
  } catch (error) {
    setAdminStatus(error.message, "error");
  }
}

adminLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = adminPasswordInput.value.trim();
  adminLoginError.textContent = "";
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "密码错误");
    sessionStorage.setItem("admin_password", password);
    setAdminAuthed(true);
    adminLoginForm.hidden = true;
    adminPanel.hidden = false;
    await loadAdminItems();
  } catch (error) {
    adminLoginError.textContent = error.message;
  }
});

adminSyncBtn?.addEventListener("click", async () => {
  setAdminStatus("正在同步 note.ms…");
  try {
    const res = await fetch("/api/admin/sync-notes", {
      method: "POST",
      headers: adminHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "同步失败");
    setAdminStatus(`已同步 ${data.count || 0} 个文档页`, "success");
    await loadGallery({ silent: true });
    await loadAdminItems();
  } catch (error) {
    setAdminStatus(error.message, "error");
  }
});

adminOpenBtn?.addEventListener("click", openAdminModal);
adminCloseBtn?.addEventListener("click", closeAdminModal);
adminModal?.addEventListener("click", (event) => {
  if (event.target === adminModal) closeAdminModal();
});
refreshBtn.addEventListener("click", () => loadGallery({ showLoading: true }));

loadGallery();
