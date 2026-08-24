const leaderInput = document.getElementById("leader");
const workInput = document.getElementById("work");
const descriptionInput = document.getElementById("description");
const previewEl = document.getElementById("preview");
const filesInput = document.getElementById("files");
const fileSummary = document.getElementById("file-summary");
const form = document.getElementById("pack-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const collectList = document.getElementById("collect-list");
const collectCount = document.getElementById("collect-count");
const refreshCollectBtn = document.getElementById("refresh-collect");
const uploadArea = document.getElementById("upload-area");

const COLLECT_POLL_MS = 3000;

let previewState = { valid: false, complete: false };
let previewTimer = null;
let collectPollTimer = null;
let isPacking = false;
let pendingAutoPack = false;
let selectedFiles = [];
let folderName = "";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function updateSubmitState() {
  const hasFiles = selectedFiles.length > 0;
  submitBtn.disabled = isPacking || !(previewState.valid && previewState.complete && hasFiles);
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type ? `status ${type}` : "status";
}

async function refreshPreview() {
  const payload = {
    doc: docInput.value,
    leader: leaderInput.value,
    work: workInput.value,
  };

  try {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    previewState = data;
    previewEl.textContent = data.display || "（请填写组长姓名和作品名称）";
    previewEl.classList.remove("ready", "invalid", "muted");
    if (data.valid) {
      previewEl.classList.add("ready");
    } else if (data.display && !data.display.startsWith("（请填写")) {
      previewEl.classList.add("invalid");
    } else {
      previewEl.classList.add("muted");
    }
  } catch {
    previewEl.textContent = "（预览失败，请检查服务是否运行）";
    previewEl.classList.add("invalid");
  }

  updateSubmitState();

  if (previewState.valid && previewState.complete && pendingAutoPack && selectedFiles.length && !isPacking) {
    pendingAutoPack = false;
    packFiles({ auto: true });
  }
}

function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 180);
}

function updateFileSummary() {
  const count = selectedFiles.length;
  if (!count) {
    fileSummary.textContent = "支持拖拽文件夹到此处，或点击选择项目目录";
    folderName = "";
    updateSubmitState();
    return;
  }

  fileSummary.textContent = folderName
    ? `已识别文件夹「${folderName}」，共 ${count} 个文件`
    : `已选择 ${count} 个文件`;
  updateSubmitState();
}

async function readAllEntries(reader) {
  const entries = [];
  let batch = [];
  do {
    batch = await new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    entries.push(...batch);
  } while (batch.length > 0);
  return entries;
}

async function collectFilesFromEntry(entry, basePath = "") {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => {
      entry.file(resolve, reject);
    });
    const relativePath = basePath ? `${basePath}/${file.name}` : file.name;
    return [{ file, relativePath }];
  }

  if (entry.isDirectory) {
    const dirPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    const reader = entry.createReader();
    const entries = await readAllEntries(reader);
    const nested = await Promise.all(
      entries.map((child) => collectFilesFromEntry(child, dirPath))
    );
    return nested.flat();
  }

  return [];
}

async function collectFromDataTransfer(dataTransfer) {
  const items = [...dataTransfer.items];
  const collected = [];
  let hasDirectory = false;
  let rootFolder = "";

  for (const item of items) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;

    if (entry.isDirectory) {
      hasDirectory = true;
      if (!rootFolder) rootFolder = entry.name;
    }

    const files = await collectFilesFromEntry(entry);
    collected.push(...files);
  }

  if (!collected.length && dataTransfer.files?.length) {
    for (const file of dataTransfer.files) {
      collected.push({
        file,
        relativePath: file.webkitRelativePath || file.name,
      });
    }
    const firstPath = collected[0]?.relativePath || "";
    if (firstPath.includes("/")) {
      hasDirectory = true;
      rootFolder = firstPath.split("/")[0];
    }
  }

  return { collected, hasDirectory, rootFolder };
}

function setSelectedFiles(files, root = "") {
  selectedFiles = files;
  folderName = root || inferRootName(files);
  updateFileSummary();
}

function inferRootName(files) {
  const first = files[0]?.relativePath || "";
  return first.includes("/") ? first.split("/")[0] : "";
}

function buildFormData(auto = false) {
  const formData = new FormData();
  formData.append("leader", leaderInput.value);
  formData.append("work", workInput.value);
  formData.append("description", descriptionInput.value || "");
  if (auto) formData.append("auto", "1");

  for (const item of selectedFiles) {
    formData.append("files", item.file, item.relativePath);
  }

  return formData;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseFilenameFromDisposition(disposition) {
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) return decodeURIComponent(utfMatch[1]);

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch ? plainMatch[1] : "submission.zip";
}

async function packFiles({ auto = false, download = false } = {}) {
  if (isPacking) return;
  if (!selectedFiles.length) {
    setStatus("请先拖入或选择项目文件夹。", "error");
    return;
  }
  if (!previewState.valid || !previewState.complete) {
    setStatus("请先完整填写组长姓名和作品名称。", "error");
    return;
  }

  isPacking = true;
  uploadArea.classList.add("packing");
  setStatus(auto ? "检测到文件夹，正在后台自动打包…" : "正在打包，请稍候…");
  updateSubmitState();

  try {
    const res = await fetch("/api/pack", {
      method: "POST",
      body: buildFormData(auto),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "打包失败");
    }

    if (auto) {
      const data = await res.json();
      setStatus(`已自动打包完成：${data.filename}`, "success");
      await loadCollectList({ silent: true });
      selectedFiles = [];
      folderName = "";
      filesInput.value = "";
      updateFileSummary();
      return data;
    }

    const blob = await res.blob();
    const filename = parseFilenameFromDisposition(res.headers.get("Content-Disposition") || "");
    if (download) triggerDownload(blob, filename);

    setStatus(`打包成功，已保存到收集目录${download ? "并开始下载" : ""}：${filename}`, "success");
    await loadCollectList({ silent: true });
    return { filename };
  } catch (error) {
    setStatus(error.message, "error");
    throw error;
  } finally {
    isPacking = false;
    uploadArea.classList.remove("packing");
    updateSubmitState();
  }
}

async function handleDroppedFolder(dataTransfer) {
  setStatus("正在读取文件夹内容…");

  try {
    const { collected, hasDirectory, rootFolder } = await collectFromDataTransfer(dataTransfer);
    if (!collected.length) {
      setStatus("未检测到有效文件，请拖入整个项目文件夹。", "error");
      return;
    }

    setSelectedFiles(collected, rootFolder);

    if (hasDirectory) {
      if (previewState.valid && previewState.complete) {
        pendingAutoPack = false;
        await packFiles({ auto: true });
      } else {
        pendingAutoPack = true;
        setStatus(`已识别文件夹「${rootFolder || "项目"}」，请补全上方信息，完成后将自动打包。`);
      }
      return;
    }

    setStatus("检测到的是单个文件。请拖入整个项目文件夹。", "error");
  } catch (error) {
    setStatus(`读取文件夹失败：${error.message}`, "error");
  }
}

function renderCollectList(items) {
  if (!items.length) {
    collectList.innerHTML = "<li class='muted'>暂无已提交的压缩包</li>";
    collectCount.textContent = "0 个文件";
    return;
  }

  collectCount.textContent = `${items.length} 个文件`;
  collectList.innerHTML = items
    .map(
      (item) => `
        <li>
          <div class="collect-item-main">
            <span class="collect-name">${escapeHtml(item.name)}</span>
            <span class="collect-meta">${formatSize(item.size)} · ${item.modified}</span>
          </div>
          <a class="collect-download" href="/api/collect/download/${encodeURIComponent(item.name)}">下载</a>
        </li>`
    )
    .join("");
}

async function loadCollectList({ silent = false } = {}) {
  if (!silent) {
    collectList.innerHTML = "<li class='muted'>加载中…</li>";
  }

  try {
    const res = await fetch("/api/collect", { cache: "no-store" });
    const data = await res.json();
    renderCollectList(data.items || []);
  } catch {
    if (!silent) {
      collectList.innerHTML = "<li class='muted'>无法加载已提交文件</li>";
      collectCount.textContent = "--";
    }
  }
}

function startCollectPolling() {
  collectPollTimer = setInterval(() => {
    loadCollectList({ silent: true });
  }, COLLECT_POLL_MS);
}

[leaderInput, workInput].forEach((input) => {
  input.addEventListener("input", schedulePreview);
});

filesInput.addEventListener("change", async () => {
  const files = [...filesInput.files];
  if (!files.length) {
    setSelectedFiles([]);
    return;
  }

  const collected = files.map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
  const root = inferRootName(collected);
  setSelectedFiles(collected, root);

  if (root && previewState.valid && previewState.complete) {
    pendingAutoPack = false;
    await packFiles({ auto: true });
  } else if (root) {
    pendingAutoPack = true;
    setStatus(`已选择文件夹「${root}」，请补全上方信息，完成后将自动打包。`);
  }
});

uploadArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", (event) => {
  if (!uploadArea.contains(event.relatedTarget)) {
    uploadArea.classList.remove("dragover");
  }
});

uploadArea.addEventListener("drop", async (event) => {
  event.preventDefault();
  uploadArea.classList.remove("dragover");
  await handleDroppedFolder(event.dataTransfer);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await packFiles({ download: true });
});

refreshCollectBtn.addEventListener("click", () => loadCollectList());

refreshPreview();
loadCollectList();
startCollectPolling();
