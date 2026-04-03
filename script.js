const textEl = document.getElementById("text");
const sizeEl = document.getElementById("size");
const darkColorEl = document.getElementById("darkColor");
const lightColorEl = document.getElementById("lightColor");
const canvas = document.getElementById("qrCanvas");
const preview = document.getElementById("preview");
const statusEl = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

let debounceTimer = null;

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status";
  if (type) statusEl.classList.add(type);
}

function normalizeInput(value) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  const looksLikeDomain =
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed) &&
    !/^https?:\/\//i.test(trimmed) &&
    !/^mailto:/i.test(trimmed) &&
    !/^tel:/i.test(trimmed) &&
    !/^sms:/i.test(trimmed) &&
    !/^WIFI:/i.test(trimmed);

  return looksLikeDomain ? `https://${trimmed}` : trimmed;
}

function showPlaceholder() {
  canvas.hidden = true;
  canvas.width = 0;
  canvas.height = 0;

  if (!preview.querySelector(".placeholder-preview")) {
    preview.insertAdjacentHTML(
      "afterbegin",
      '<span class="placeholder-preview">Your QR code will appear here</span>'
    );
  }
}

function hidePlaceholder() {
  const placeholder = preview.querySelector(".placeholder-preview");
  if (placeholder) placeholder.remove();
}

async function renderQRCode() {
  const text = normalizeInput(textEl.value);
  const width = Number(sizeEl.value);
  const dark = darkColorEl.value;
  const light = lightColorEl.value;

  if (!text) {
    showPlaceholder();
    setStatus("");
    return;
  }

  if (typeof QRCode === "undefined") {
    setStatus("QR library failed to load.", "error");
    return;
  }

  try {
    await QRCode.toCanvas(canvas, text, {
      width,
      errorCorrectionLevel: "M",
      margin: 2,
      color: {
        dark,
        light
      }
    });

    hidePlaceholder();
    canvas.hidden = false;
    setStatus("QR code updated.", "success");
  } catch (error) {
    console.error("QR generation error:", error);
    showPlaceholder();
    setStatus("Could not generate the QR code.", "error");
  }
}

function scheduleRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(renderQRCode, 180);
}

function downloadQRCode() {
  if (!canvas.width) {
    setStatus("Enter text or a URL first.", "error");
    return;
  }

  const link = document.createElement("a");
  link.download = "qr-code.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  setStatus("PNG download started.", "success");
}

async function copyQRCode() {
  if (!canvas.width) {
    setStatus("Enter text or a URL first.", "error");
    return;
  }

  if (!navigator.clipboard || !window.ClipboardItem) {
    setStatus("Image copy is not supported in this browser. Use Download PNG instead.", "error");
    return;
  }

  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      throw new Error("Failed to create PNG blob.");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob
      })
    ]);

    setStatus("QR image copied.", "success");
  } catch (error) {
    console.error("Clipboard copy error:", error);
    setStatus("Copy failed. Use Download PNG instead.", "error");
  }
}

function clearForm() {
  textEl.value = "";
  darkColorEl.value = "#000000";
  lightColorEl.value = "#ffffff";
  sizeEl.value = "300";
  showPlaceholder();
  setStatus("");
}

textEl.addEventListener("input", scheduleRender);
sizeEl.addEventListener("change", renderQRCode);
darkColorEl.addEventListener("input", renderQRCode);
lightColorEl.addEventListener("input", renderQRCode);

downloadBtn.addEventListener("click", downloadQRCode);
copyBtn.addEventListener("click", copyQRCode);
clearBtn.addEventListener("click", clearForm);

window.addEventListener("load", () => {
  showPlaceholder();
});