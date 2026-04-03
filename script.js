const textEl = document.getElementById("text");
const sizeEl = document.getElementById("size");
const darkColorEl = document.getElementById("darkColor");
const lightColorEl = document.getElementById("lightColor");
const preview = document.getElementById("preview");
const statusEl = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");

let qrInstance = null;

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

function getCanvas() {
  return preview.querySelector("canvas");
}

function getImage() {
  return preview.querySelector("img");
}

function resetPreview() {
  preview.innerHTML = `
    <span class="placeholder-preview">Your QR code will appear here</span>
  `;
}

function generateQRCode() {
  const text = normalizeInput(textEl.value);
  const size = Number(sizeEl.value);
  const dark = darkColorEl.value || "#000000";
  const light = lightColorEl.value || "#ffffff";

  if (!text) {
    setStatus("Please enter text or a URL.", "error");
    return;
  }

  if (typeof window.QRCode === "undefined") {
    setStatus("QR library failed to load.", "error");
    return;
  }

  try {
    preview.innerHTML = "";

    qrInstance = new QRCode(preview, {
      text: text,
      width: size,
      height: size,
      colorDark: dark,
      colorLight: light,
      correctLevel: QRCode.CorrectLevel.M
    });

    setStatus("QR code generated.", "success");
  } catch (err) {
    console.error("QR generation failed:", err);
    setStatus("Could not generate the QR code.", "error");
  }
}

function downloadQRCode() {
  const canvas = getCanvas();
  const image = getImage();

  if (!canvas && !image) {
    setStatus("Generate a QR code first.", "error");
    return;
  }

  let dataUrl = "";

  if (canvas) {
    dataUrl = canvas.toDataURL("image/png");
  } else if (image) {
    dataUrl = image.src;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "qr-code.png";
  link.click();

  setStatus("PNG download started.", "success");
}

async function copyQRCode() {
  const canvas = getCanvas();

  if (!canvas) {
    setStatus("Copy works after generating a QR code in a supported browser.", "error");
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
  qrInstance = null;
  resetPreview();
  setStatus("");
}

document.getElementById("generateBtn").addEventListener("click", generateQRCode);
downloadBtn.addEventListener("click", downloadQRCode);
copyBtn.addEventListener("click", copyQRCode);
document.getElementById("clearBtn").addEventListener("click", clearForm);
