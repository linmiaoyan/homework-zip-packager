const config = window.PLAY_CONFIG || {};
const slug = config.slug;
const minPlaySeconds = config.minPlaySeconds || 60;
const isPygame = config.isPygame;

const timerDisplay = document.getElementById("timer-display");
const ratingPanel = document.getElementById("rating-panel");
const ratingHint = document.getElementById("rating-hint");
const ratingForm = document.getElementById("rating-form");
const nicknameInput = document.getElementById("nickname");
const scoreInput = document.getElementById("score");
const submitRatingBtn = document.getElementById("submit-rating");
const ratingStatus = document.getElementById("rating-status");
const ratingSummaryText = document.getElementById("rating-summary-text");
const ratingList = document.getElementById("rating-list");
const commentForm = document.getElementById("comment-form");
const commentNicknameInput = document.getElementById("comment-nickname");
const commentContentInput = document.getElementById("comment-content");
const submitCommentBtn = document.getElementById("submit-comment");
const commentStatus = document.getElementById("comment-status");
const commentList = document.getElementById("comment-list");
const commentCountEl = document.getElementById("comment-count");

let elapsedSeconds = 0;
let ratingUnlocked = false;
let timerStarted = false;

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatTimer(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setRatingStatus(message, type = "") {
  ratingStatus.textContent = message;
  ratingStatus.className = type ? `status ${type}` : "status";
}

function unlockRating() {
  if (ratingUnlocked) return;
  ratingUnlocked = true;
  ratingPanel.classList.remove("locked");
  ratingPanel.classList.add("ready");
  ratingHint.textContent = "感谢体验！请填写昵称和分数。";
  nicknameInput.disabled = false;
  scoreInput.disabled = false;
  submitRatingBtn.disabled = false;
}

function tickTimer() {
  elapsedSeconds += 1;
  timerDisplay.textContent = formatTimer(elapsedSeconds);

  if (!ratingUnlocked && elapsedSeconds >= minPlaySeconds) {
    unlockRating();
  }
}

function startTimer() {
  if (timerStarted) return;
  timerStarted = true;
  setInterval(tickTimer, 1000);
}

function renderRatingList(items) {
  if (!items.length) {
    ratingList.innerHTML = "<li class='muted'>暂无评分</li>";
    return;
  }

  ratingList.innerHTML = items
    .slice(0, 20)
    .map(
      (item) => `
        <li>
          <div class="rating-item-main">
            <strong>${escapeHtml(item.nickname)}</strong>
            <span class="rating-score">${escapeHtml(String(item.score))} 分</span>
          </div>
          <span class="rating-time">${escapeHtml(item.created_at || "")}</span>
        </li>`
    )
    .join("");
}

function renderSummary(summary) {
  if (!summary || !summary.count) {
    ratingSummaryText.textContent = "暂无评分";
    return;
  }
  ratingSummaryText.textContent = `共 ${summary.count} 人评分，平均分 ${summary.average}`;
}

async function loadRatings() {
  try {
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}/ratings`, { cache: "no-store" });
    const data = await res.json();
    if (!data.ok) return;
    renderSummary(data.summary);
    renderRatingList(data.items || []);
  } catch {
    ratingList.innerHTML = "<li class='muted'>评分加载失败</li>";
  }
}

ratingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ratingUnlocked) {
    setRatingStatus(`请先体验至少 ${minPlaySeconds} 秒。`, "error");
    return;
  }

  submitRatingBtn.disabled = true;
  setRatingStatus("正在提交…");

  try {
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nicknameInput.value.trim(),
        score: Number(scoreInput.value),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "提交失败");
    }

    renderSummary(data.summary);
    await loadRatings();
    setRatingStatus("评分已提交，感谢反馈！", "success");
    scoreInput.value = "";
  } catch (error) {
    setRatingStatus(error.message, "error");
  } finally {
    submitRatingBtn.disabled = false;
  }
});

function setCommentStatus(message, type = "") {
  commentStatus.textContent = message;
  commentStatus.className = type ? `status ${type}` : "status";
}

function renderCommentList(items) {
  commentCountEl.textContent = String(items.length);
  if (!items.length) {
    commentList.innerHTML = "<li class='muted'>暂无评论</li>";
    return;
  }

  commentList.innerHTML = items
    .map(
      (item) => `
        <li>
          <div class="comment-item-head">
            <strong>${escapeHtml(item.nickname || "匿名")}</strong>
            <span class="comment-time">${escapeHtml(item.created_at || "")}</span>
          </div>
          <p class="comment-body">${escapeHtml(item.content || "")}</p>
        </li>`
    )
    .join("");
}

async function loadComments() {
  try {
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}/comments`, { cache: "no-store" });
    const data = await res.json();
    if (!data.ok) return;
    renderCommentList(data.items || []);
  } catch {
    commentList.innerHTML = "<li class='muted'>评论加载失败</li>";
  }
}

commentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = commentContentInput.value.trim();
  if (!content) {
    setCommentStatus("请填写评论内容，或留空不提交。", "error");
    return;
  }

  submitCommentBtn.disabled = true;
  setCommentStatus("正在发表…");

  try {
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: commentNicknameInput.value.trim(),
        content,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "发表失败");
    }

    commentContentInput.value = "";
    await loadComments();
    setCommentStatus("评论已发表，感谢反馈！", "success");
  } catch (error) {
    setCommentStatus(error.message, "error");
  } finally {
    submitCommentBtn.disabled = false;
  }
});

if (isPygame) {
  startTimer();
} else {
  document.getElementById("game-frame")?.addEventListener("load", startTimer);
  setTimeout(startTimer, 1500);
}
loadRatings();
loadComments();
