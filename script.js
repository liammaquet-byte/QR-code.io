const textEl = document.getElementById("text");
const sizeEl = document.getElementById("size");
const darkColorEl = document.getElementById("darkColor");
const lightColorEl = document.getElementById("lightColor");
const canvas = document.getElementById("qrCanvas");
const preview = document.getElementById("preview");
const statusEl = document.getElementById("status");

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
    !/^tel:/i.test(trimmed);

  return looksLikeDomain ? "https://" + trimmed : trimmed;
}

async function generateQRCode() {
  const text = normalizeInput(textEl.value);
  const width = Number(sizeEl.value);
  const dark = darkColorEl.value || "#000000";
  const light = lightColorEl.value || "#ffffff";

  if (!text) {
    setStatus("Please enter text or a URL.", "error");
    return;
  }

  if (typeof window.QRCode === "undefined") {
    setStatus("QR library failed to load. Check qrcode.min.js path and file contents.", "error");
    console.error("QRCode is undefined. qrcode.min.js did not load correctly.");
    return;
  }

  try {
    await window.QRCode.toCanvas(canvas, text, {
      width,
      errorCorrectionLevel: "M",
      margin: 2,
      color: {
        dark,
        light
      }
    });

    canvas.hidden = false;
    const placeholder = preview.querySelector(".placeholder-preview");
    if (placeholder) placeholder.remove();

    setStatus("QR code generated.", "success");
  } catch (err) {
    console.error("QR generation failed:", err);
    setStatus("Could not generate the QR code.", "error");
  }
}

function downloadQRCode() {
  if (!canvas.width) {
    setStatus("Generate a QR code first.", "error");
    return;
  }

  const link = document.createElement("a");
  link.download = "qr-code.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function copyQRCode() {
  if (!canvas.width) {
    setStatus("Generate a QR code first.", "error");
    return;
  }

  if (!navigator.clipboard || !window.ClipboardItem) {
    setStatus("Image copy is not supported in this browser. Use Download PNG instead.", "error");
    return;
  }

  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      setStatus("Could not copy QR image. Use Download PNG instead.", "error");
      return;
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob
      })
    ]);

    setStatus("QR image copied.", "success");
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    setStatus("Copy failed. Use Download PNG instead.", "error");
  }
}

function clearForm() {
  textEl.value = "";

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.hidden = true;

  if (!preview.querySelector(".placeholder-preview")) {
    preview.insertAdjacentHTML(
      "afterbegin",
      '<span class="placeholder-preview">Your QR code will appear here</span>'
    );
  }

  setStatus("");
}

document.getElementById("generateBtn").addEventListener("click", generateQRCode);
document.getElementById("downloadBtn").addEventListener("click", downloadQRCode);
document.getElementById("copyBtn").addEventListener("click", copyQRCode);
document.getElementById("clearBtn").addEventListener("click", clearForm);
