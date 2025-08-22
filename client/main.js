const $ = (s) => document.querySelector(s);
const ideaEl = $("#idea");
const categoryEl = $("#category");
const btn = $("#generate");
const preview = $("#preview");
const code = $("#code");
const copyBtn = $("#copy");
const downloadBtn = $("#download");
const openNewTabBtn = $("#openNewTab");

const API_BASE = "http://localhost:3001"; // backend server

async function generate() {
  const idea = (ideaEl.value || "").trim();
  const category = categoryEl.value;

  if (!idea) {
    ideaEl.focus();
    ideaEl.classList.add("shake");
    setTimeout(() => ideaEl.classList.remove("shake"), 300);
    return;
  }

  btn.classList.add("loading");
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, category })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Generation failed");
    }

    const { html } = await res.json();

    // Show preview and code
    preview.srcdoc = html;
    code.textContent = html;

    openNewTabBtn.onclick = () => {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    };

    downloadBtn.onclick = () => {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "landing.html";
      a.click();
      URL.revokeObjectURL(a.href);
    };

    copyBtn.onclick = async () => {
      await navigator.clipboard.writeText(html);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    };
  } catch (err) {
    alert(err.message || "Something went wrong.");
    console.error(err);
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

btn.addEventListener("click", generate);
ideaEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generate();
});
