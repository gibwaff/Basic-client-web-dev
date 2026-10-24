/**
 * Лабораторная работа №5: Fetch API и Storage
 * Автор: Беляков Игорь
 */

const API_BASE_URL = "http://95.163.242.125";

// DOM элементы
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeStatusText = document.getElementById("theme-status-text");
const toastContainer = document.getElementById("toast-container");

const galleryLoader = document.getElementById("gallery-loader");
const galleryGrid = document.getElementById("gallery-grid");
const galleryStatus = document.getElementById("gallery-status");
const refreshGalleryBtn = document.getElementById("refresh-gallery-btn");

const tempForm = document.getElementById("temp-form");
const tempClassInput = document.getElementById("temp-class");
const tempValueInput = document.getElementById("temp-value");
const tempSubmitBtn = document.getElementById("temp-submit-btn");

/* ==========================================================================
   1. Компонент всплывающих уведомлений (Toasts)
   ========================================================================== */

/**
 * Отображение тост-уведомления
 * @param {"success"|"error"} type - тип уведомления
 * @param {string} message - текст сообщения
 * @param {number} [duration=5000] - длительность отображения в мс
 */
function showToast(type, message, duration = 5000) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const iconText = type === "error" ? "❌" : "✅";

  toast.innerHTML = `
    <div class="toast__content">
      <span class="toast__icon" aria-hidden="true">${iconText}</span>
      <span class="toast__text"></span>
    </div>
    <button type="button" class="toast__close" aria-label="Закрыть уведомление">&times;</button>
  `;

  // Безопасная установка текста сообщения для предотвращения XSS
  toast.querySelector(".toast__text").textContent = message;

  let timerId = null;

  function dismissToast() {
    if (toast.classList.contains("toast--hiding")) {
      return;
    }
    if (timerId) {
      clearTimeout(timerId);
    }
    toast.classList.add("toast--hiding");
    toast.addEventListener(
      "animationend",
      () => {
        toast.remove();
      },
      { once: true }
    );
  }

  const closeBtn = toast.querySelector(".toast__close");
  closeBtn.addEventListener("click", dismissToast);

  if (duration > 0) {
    timerId = setTimeout(dismissToast, duration);
  }

  toastContainer.appendChild(toast);
}

/* ==========================================================================
   2. Переключение темы и работа с localStorage
   ========================================================================== */

/**
 * Обновление текста состояния темы
 * @param {"light"|"dark"} theme
 */
function updateThemeUI(theme) {
  if (themeStatusText) {
    themeStatusText.textContent = theme === "dark" ? "Тёмная тема" : "Светлая тема";
  }
}

/**
 * Инициализация темы
 */
function initTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  updateThemeUI(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = activeTheme === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", newTheme);
      try {
        localStorage.setItem("app-theme", newTheme);
      } catch {
        // localStorage недоступен
      }
      updateThemeUI(newTheme);
    });
  }
}

/* ==========================================================================
   3. Секция Галереи с повторными запросами (Retry до 3 раз)
   ========================================================================== */

/**
 * Вспомогательная задержка (sleep)
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Загрузка изображений с механизмом до 3 повторных попыток
 * @param {number} maxAttempts
 * @returns {Promise<Array>}
 */
async function fetchImagesWithRetry(maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/images`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Сервер вернул статус ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      console.warn(`Попытка ${attempt}/${maxAttempts} получения изображений завершилась ошибкой:`, error.message);

      if (attempt < maxAttempts) {
        await delay(600 * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * Отрисовка полученных карточек в сетку галереи
 * @param {Array<{url: string, alt?: string, description?: string}>} images
 */
function renderGallery(images) {
  galleryGrid.innerHTML = "";
  galleryStatus.setAttribute("hidden", "");

  if (!Array.isArray(images) || images.length === 0) {
    galleryStatus.textContent = "Изображения не найдены";
    galleryStatus.removeAttribute("hidden");
    return;
  }

  const fragment = document.createDocumentFragment();

  images.forEach((item) => {
    const card = document.createElement("article");
    card.className = "gallery-card";

    const titleText = item.alt || "Изображение галереи";
    const descText = item.description || "Описание отсутствует";

    card.innerHTML = `
      <div class="gallery-card__image-box">
        <img
          src="${item.url}"
          alt="${titleText}"
          class="gallery-card__img"
          loading="lazy"
        />
      </div>
      <div class="gallery-card__body">
        <h3 class="gallery-card__title"></h3>
        <p class="gallery-card__desc"></p>
      </div>
    `;

    // Безопасное назначение текстовых полей
    card.querySelector(".gallery-card__title").textContent = titleText;
    card.querySelector(".gallery-card__desc").textContent = descText;

    fragment.appendChild(card);
  });

  galleryGrid.appendChild(fragment);
}

/**
 * Загрузка и обновление галереи
 */
async function loadGallery() {
  galleryLoader.removeAttribute("hidden");
  galleryGrid.innerHTML = "";
  galleryStatus.setAttribute("hidden", "");
  refreshGalleryBtn.disabled = true;

  try {
    const images = await fetchImagesWithRetry(3);
    renderGallery(images);
  } catch (error) {
    console.error("Не удалось загрузить галерею:", error);
    galleryStatus.textContent = "Не удалось загрузить изображения после 3 попыток запроса. Пожалуйста, попробуйте обновить галерею.";
    galleryStatus.removeAttribute("hidden");
    showToast("error", `Ошибка загрузки галереи: ${error.message}`);
  } finally {
    galleryLoader.setAttribute("hidden", "");
    refreshGalleryBtn.disabled = false;
  }
}

if (refreshGalleryBtn) {
  refreshGalleryBtn.addEventListener("click", () => {
    loadGallery();
  });
}

/* ==========================================================================
   4. Секция Отправки Температуры
   ========================================================================== */

if (tempForm) {
  tempForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const roomClass = tempClassInput.value.trim();
    const tempValueRaw = tempValueInput.value.trim();
    const tempNumber = parseFloat(tempValueRaw);

    if (!roomClass) {
      showToast("error", "Пожалуйста, введите номер аудитории");
      tempClassInput.focus();
      return;
    }

    if (Number.isNaN(tempNumber)) {
      showToast("error", "Пожалуйста, укажите корректное числовое значение температуры");
      tempValueInput.focus();
      return;
    }

    // Блокировка формы на время выполнения сетевого запроса
    tempClassInput.disabled = true;
    tempValueInput.disabled = true;
    tempSubmitBtn.disabled = true;
    const originalBtnText = tempSubmitBtn.textContent;
    tempSubmitBtn.textContent = "Отправка...";

    try {
      const response = await fetch(`${API_BASE_URL}/temp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          class: roomClass,
          temp: tempNumber
        })
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          (responseData && responseData.message) ||
          `Сервер отклонил запрос со статусом ${response.status}`;
        throw new Error(errorMsg);
      }

      // Успешный ответ: показываем тост сообщения из ответа и очищаем форму
      const successMsg =
        (responseData && responseData.message) ||
        `Данные для аудитории ${roomClass} успешно сохранены (${tempNumber}°C)`;

      showToast("success", successMsg);
      tempForm.reset();
    } catch (error) {
      console.error("Ошибка при отправке температуры:", error);
      // При ошибке: тост ошибки, форму НЕ очищаем
      showToast("error", `Ошибка отправки: ${error.message}`);
    } finally {
      // Разблокировка формы
      tempClassInput.disabled = false;
      tempValueInput.disabled = false;
      tempSubmitBtn.disabled = false;
      tempSubmitBtn.textContent = originalBtnText;
    }
  });
}

/* ==========================================================================
   Инициализация при старте
   ========================================================================== */
initTheme();
loadGallery();
