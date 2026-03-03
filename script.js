// === Настройки (замени под себя) ===
const CORRECT_PIN = "7120";

// Координаты точки
const X = 51.173530; // широта (lat)
const Y = 71.381255; // долгота (lon)

const ADDRESS_TEXT = `X = ${X.toFixed(6)}, Y = ${Y.toFixed(6)}`;

const MAP_GOOGLE = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
const MAP_YANDEX = (lat, lon) =>
  `https://yandex.ru/maps/?pt=${lon},${lat}&z=17&l=map`;

// === Логика ===
const screen = document.querySelector(".screen");
const entry = document.getElementById("entry");
const reveal = document.getElementById("reveal");
const hint = document.getElementById("hint");
const addressText = document.getElementById("addressText");
const mapBtn = document.getElementById("mapBtn");
const inputs = Array.from(document.querySelectorAll(".pinCell"));
const dots = Array.from(document.querySelectorAll(".dot"));

addressText.textContent = ADDRESS_TEXT;

const preferredMapUrl = (() => {
  const lang = (navigator.language || "").toLowerCase();
  // Для RU/UA/BY/KZ чаще удобнее Яндекс, иначе Google
  if (lang.startsWith("ru") || lang.startsWith("uk") || lang.startsWith("be") || lang.startsWith("kk")) {
    return MAP_YANDEX(X, Y);
  }
  return MAP_GOOGLE(X, Y);
})();

mapBtn.href = preferredMapUrl;

function getPin() {
  return inputs.map((i) => (i.value || "").trim()).join("");
}

function setHint(text, isError = false) {
  hint.textContent = text || "";
  hint.classList.toggle("isError", Boolean(isError));
}

function setUnlocked() {
  reveal.setAttribute("aria-hidden", "false");
  screen.classList.add("isUnlocked");
  inputs.forEach((i) => (i.disabled = true));
  dots.forEach((d) => d.classList.add("isOn"));
  setHint("");
}

function flashWrong() {
  screen.classList.add("isWrong");
  setHint("Неверный код. Попробуй ещё раз.", true);
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(25);
  }
  window.setTimeout(() => {
    screen.classList.remove("isWrong");
  }, 420);
}

function clearPinAndFocus() {
  inputs.forEach((i) => (i.value = ""));
  dots.forEach((d) => d.classList.remove("isOn"));
  inputs[0]?.focus();
}

function syncProgress() {
  const filled = inputs.filter((i) => (i.value || "").trim() !== "").length;
  dots.forEach((d, idx) => d.classList.toggle("isOn", idx < filled));
}

function trySubmitIfComplete() {
  const pin = getPin();
  if (pin.length !== inputs.length || inputs.some((i) => i.value === "")) return;

  if (pin === CORRECT_PIN) {
    setUnlocked();
    return;
  }

  flashWrong();
  window.setTimeout(clearPinAndFocus, 160);
}

function distributeDigits(fromIndex, digits) {
  let idx = fromIndex;
  for (const ch of digits) {
    if (idx >= inputs.length) break;
    inputs[idx].value = ch;
    inputs[idx].classList.add("isPop");
    idx += 1;
  }
  if (idx < inputs.length) {
    inputs[idx]?.focus();
  } else {
    inputs[inputs.length - 1]?.focus();
  }
  window.setTimeout(() => inputs.forEach((i) => i.classList.remove("isPop")), 200);
  syncProgress();
  trySubmitIfComplete();
}

function normalizeDigits(value) {
  return (value || "").replace(/\D/g, "");
}

inputs.forEach((input, index) => {
  input.addEventListener("focus", () => {
    // на мобиле удобно выделять цифру, чтобы заменить
    try {
      input.select();
    } catch {}
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      if (input.value === "" && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].value = "";
        e.preventDefault();
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      trySubmitIfComplete();
    }
  });

  input.addEventListener("input", () => {
    const digits = normalizeDigits(input.value);
    if (digits.length === 0) {
      input.value = "";
      setHint("");
      syncProgress();
      return;
    }

    setHint("");

    // Вставили/ввели несколько цифр (paste или автозаполнение) — раскидаем по полям
    if (digits.length > 1) {
      input.value = digits[0];
      input.classList.add("isPop");
      distributeDigits(index, digits);
      return;
    }

    input.value = digits[0];
    input.classList.add("isPop");
    if (index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
    window.setTimeout(() => input.classList.remove("isPop"), 200);
    syncProgress();
    trySubmitIfComplete();
  });

  input.addEventListener("paste", (e) => {
    const text = e.clipboardData?.getData("text") ?? "";
    const digits = normalizeDigits(text);
    if (!digits) return;
    e.preventDefault();
    distributeDigits(index, digits);
  });
});

// Стартовый фокус
window.addEventListener("load", () => {
  inputs[0]?.focus();
});

