/**
 * Лабораторная работа №3: Валидация данных в форме
 * Использование Constraint Validation API и элемента <dialog>
 */

const dialog = document.getElementById("register-dialog");
const openRegisterBtn = document.getElementById("open-register-btn");
const heroRegisterBtn = document.getElementById("hero-register-btn");
const closeDialogBtn = document.getElementById("close-dialog-btn");
const cancelDialogBtn = document.getElementById("cancel-dialog-btn");
const registerForm = document.getElementById("register-form");
const passwordInput = document.getElementById("user-password");
const togglePasswordBtn = document.getElementById("toggle-password-btn");

const inputs = registerForm.querySelectorAll(".form__input");

/**
 * Получение человекочитаемого текста ошибки на основе ValidityState
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function getValidationErrorMessage(input) {
  const { validity } = input;

  if (validity.valueMissing) {
    if (input.name === "name") {
      return "Пожалуйста, введите ваше имя";
    }
    if (input.name === "email") {
      return "Пожалуйста, укажите адрес электронной почты";
    }
    if (input.name === "password") {
      return "Пожалуйста, задайте пароль для учётной записи";
    }
    return "Это поле обязательно для заполнения";
  }

  if (validity.typeMismatch && input.type === "email") {
    return "Введите корректный адрес электронной почты (например, ivan@example.ru)";
  }

  if (validity.tooShort) {
    return `Пароль должен содержать минимум ${input.minLength} символов (сейчас: ${input.value.length})`;
  }

  if (validity.patternMismatch) {
    return "Введённое значение не соответствует требуемому формату";
  }

  return input.validationMessage || "Некорректное значение поля";
}

/**
 * Валидация отдельного поля формы
 * @param {HTMLInputElement} input
 * @returns {boolean} true если поле валидно, иначе false
 */
function validateField(input) {
  const group = input.closest(".form__group");
  const errorElement = document.getElementById(input.getAttribute("aria-describedby"));

  if (!input.checkValidity()) {
    const errorText = getValidationErrorMessage(input);
    input.setAttribute("aria-invalid", "true");

    if (errorElement) {
      errorElement.textContent = errorText;
      errorElement.removeAttribute("hidden");
    }

    if (group) {
      group.classList.add("has-error");
    }

    return false;
  }

  // Сброс ошибки при успешной валидации
  input.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.setAttribute("hidden", "");
  }

  if (group) {
    group.classList.remove("has-error");
  }

  return true;
}

/**
 * Открытие модального окна
 */
function openModal() {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

/**
 * Закрытие модального окна с очисткой состояния валидации
 */
function closeModal() {
  dialog.close();
  registerForm.reset();
  inputs.forEach((input) => {
    input.removeAttribute("aria-invalid");
    const group = input.closest(".form__group");
    if (group) {
      group.classList.remove("has-error");
    }
    const errorElement = document.getElementById(input.getAttribute("aria-describedby"));
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.setAttribute("hidden", "");
    }
  });
}

// Открытие по кнопкам регистрации
if (openRegisterBtn) {
  openRegisterBtn.addEventListener("click", openModal);
}

if (heroRegisterBtn) {
  heroRegisterBtn.addEventListener("click", openModal);
}

// Закрытие по крестику и кнопке "Отмена"
if (closeDialogBtn) {
  closeDialogBtn.addEventListener("click", closeModal);
}

if (cancelDialogBtn) {
  cancelDialogBtn.addEventListener("click", closeModal);
}

// Закрытие при клике вне содержимого диалога (по подложке ::backdrop)
dialog.addEventListener("click", (event) => {
  const dialogRect = dialog.getBoundingClientRect();
  const isOutside =
    event.clientX < dialogRect.left ||
    event.clientX > dialogRect.right ||
    event.clientY < dialogRect.top ||
    event.clientY > dialogRect.bottom;

  if (isOutside) {
    closeModal();
  }
});

// Валидация полей при blur (потере фокуса)
inputs.forEach((input) => {
  input.addEventListener("blur", () => {
    validateField(input);
  });

  // Если поле было с ошибкой, при вводе сразу перепроверяем для улучшения UX
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") {
      validateField(input);
    }
  });
});

// Кнопка показа пароля: удерживание (pointerdown / pointerup)
function showPassword() {
  passwordInput.type = "text";
}

function hidePassword() {
  passwordInput.type = "password";
}

if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    showPassword();
  });

  togglePasswordBtn.addEventListener("pointerup", hidePassword);
  togglePasswordBtn.addEventListener("pointerleave", hidePassword);
  togglePasswordBtn.addEventListener("pointercancel", hidePassword);
}

// Обработка отправки формы
registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  let firstInvalidInput = null;
  let isFormValid = true;

  inputs.forEach((input) => {
    const isValid = validateField(input);
    if (!isValid && !firstInvalidInput) {
      firstInvalidInput = input;
      isFormValid = false;
    }
  });

  if (!isFormValid && firstInvalidInput) {
    firstInvalidInput.focus();
    return;
  }

  // Сбор данных формы через FormData()
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData.entries());

  console.log("Данные формы успешно проверены и отправлены:");
  console.table(data);

  // Закрываем модальное окно после успешной обработки
  alert(`Регистрация успешна!\nИмя: ${data.name}\nEmail: ${data.email}\nДанные выведены в консоль через FormData().`);
  closeModal();
});
