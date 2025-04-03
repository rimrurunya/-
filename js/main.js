document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("darkModeToggle");
    const body = document.body;
    const catalogToggle = document.getElementById("catalogToggle");
    const catalogDropdown = catalogToggle.nextElementSibling;
    const dropdownParent = catalogToggle.parentElement;
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const themeLabel = document.querySelector(".theme-label");
    
    // Элементы модального окна авторизации
    const loginButton = document.getElementById("loginButton");
    const authModal = document.getElementById("authModal");
    const closeBtn = document.querySelector(".close-btn");
    const tabBtns = document.querySelectorAll(".tab-btn");
    const authForms = document.querySelectorAll(".tab-content");
    const passwordToggles = document.querySelectorAll(".password-toggle");

    // Проверяем сохраненную тему
    if (localStorage.getItem("theme") === "light") {
        applyLightTheme();
    } else {
        applyDarkTheme();
    }

    // Функция для применения светлой темы
    function applyLightTheme() {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
        localStorage.setItem("theme", "light");
        themeToggle.checked = true;
        if (themeLabel) themeLabel.textContent = "Белая";
        
        // Анимация плавного перехода
        body.style.transition = "background-color 0.5s ease, color 0.5s ease";
        
        // Уведомление о смене темы
        showThemeNotification("Светлая тема активирована");
    }
    
    // Функция для применения темной темы
    function applyDarkTheme() {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
        themeToggle.checked = false;
        if (themeLabel) themeLabel.textContent = "Черная";
        
        // Анимация плавного перехода
        body.style.transition = "background-color 0.5s ease, color 0.5s ease";
        
        // Уведомление о смене темы
        showThemeNotification("Темная тема активирована");
    }
    
    // Функция для отображения уведомления о смене темы
    function showThemeNotification(message) {
        // Проверяем, есть ли уже уведомление
        let notification = document.getElementById("themeNotification");
        
        if (notification) {
            // Если уведомление уже существует, обновляем текст
            notification.textContent = message;
            
            // Перезапускаем таймер удаления
            clearTimeout(notification.timeoutId);
        } else {
            // Создаем новое уведомление
            notification = document.createElement("div");
            notification.id = "themeNotification";
            notification.textContent = message;
            
            // Стили для уведомления
            notification.style.position = "fixed";
            notification.style.bottom = "20px";
            notification.style.right = "20px";
            notification.style.padding = "10px 15px";
            notification.style.background = body.classList.contains("dark-mode") 
                ? "rgba(255, 255, 255, 0.2)" 
                : "rgba(0, 0, 0, 0.7)";
            notification.style.color = body.classList.contains("dark-mode") 
                ? "#fff" 
                : "#fff";
            notification.style.borderRadius = "5px";
            notification.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
            notification.style.zIndex = "1100";
            notification.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            notification.style.opacity = "0";
            notification.style.transform = "translateY(20px)";
            
            // Добавляем в DOM
            document.body.appendChild(notification);
            
            // Анимируем появление
            setTimeout(() => {
                notification.style.opacity = "1";
                notification.style.transform = "translateY(0)";
            }, 10);
        }
        
        // Устанавливаем таймер для скрытия уведомления
        notification.timeoutId = setTimeout(() => {
            notification.style.opacity = "0";
            notification.style.transform = "translateY(20px)";
            
            // Удаляем элемент после анимации
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // Функция для переключения темы
    function toggleTheme() {
        if (body.classList.contains("dark-mode")) {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }

    // Переключение темы при нажатии на переключатель
    themeToggle.addEventListener("change", toggleTheme);

    // Открытие/закрытие панели "Каталог"
    catalogToggle.addEventListener("click", function (event) {
        event.preventDefault();
        catalogDropdown.classList.toggle("active");
        dropdownParent.classList.toggle("active");
        
        // Добавляем эффект пульсации при открытии
        if (catalogDropdown.classList.contains("active")) {
            catalogDropdown.style.animation = "none";
            setTimeout(() => {
                catalogDropdown.style.animation = "pulse 0.5s ease";
            }, 10);
        }
    });

    // Закрытие панели при клике вне её
    document.addEventListener("click", function (event) {
        if (!catalogDropdown.contains(event.target) && event.target !== catalogToggle) {
            catalogDropdown.classList.remove("active");
            dropdownParent.classList.remove("active");
        }
    });

    // Плавное появление элементов при загрузке страницы
    document.querySelector(".navbar").style.opacity = "0";
    setTimeout(() => {
        document.querySelector(".navbar").style.opacity = "1";
        document.querySelector(".navbar").style.transition = "opacity 0.5s ease";
    }, 100);
    
    // Функция для прокрутки вверх
    if (scrollToTopBtn) {
        // Показать/скрыть кнопку в зависимости от положения скролла
        window.addEventListener("scroll", function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add("visible");
            } else {
                scrollToTopBtn.classList.remove("visible");
            }
        });
        
        // Плавная прокрутка вверх при клике
        scrollToTopBtn.addEventListener("click", function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
    
    // Функции для модального окна авторизации
    
    // Открытие модального окна
    loginButton.addEventListener("click", function() {
        authModal.style.display = "flex"; // Меняем на flex для центрирования
        document.body.style.overflow = "hidden"; // Запрещаем прокрутку страницы
    });
    
    // Закрытие модального окна
    closeBtn.addEventListener("click", function() {
        authModal.style.display = "none";
        document.body.style.overflow = ""; // Разрешаем прокрутку страницы
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener("click", function(event) {
        if (event.target === authModal) {
            authModal.style.display = "none";
            document.body.style.overflow = "";
        }
    });
    
    // Переключение вкладок
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Убираем активный класс у всех кнопок и форм
            tabBtns.forEach(b => b.classList.remove("active"));
            authForms.forEach(form => form.classList.remove("active"));
            
            // Добавляем активный класс текущей кнопке и соответствующей форме
            btn.classList.add("active");
            const formId = btn.id === "loginTab" ? "loginContent" : "registerContent";
            document.getElementById(formId).classList.add("active");
            
            // После смены вкладки переназначаем обработчики для кнопок показа пароля
            setTimeout(() => {
                document.querySelectorAll(".password-toggle").forEach(toggle => {
                    // Удаляем старые обработчики, чтобы избежать дублирования
                    const newToggle = toggle.cloneNode(true);
                    toggle.parentNode.replaceChild(newToggle, toggle);
                    
                    // Добавляем новый обработчик
                    newToggle.addEventListener("click", function(e) {
                        e.stopPropagation();
                        const input = this.previousElementSibling;
                        if (input && (input.type === "password" || input.type === "text")) {
                            input.type = input.type === "password" ? "text" : "password";
                            this.innerHTML = input.type === "password" 
                                ? '<i class="fas fa-eye"></i>' 
                                : '<i class="fas fa-eye-slash"></i>';
                        }
                    });
                });
            }, 100); // Небольшая задержка для уверенности, что DOM обновился
        });
    });
    
    // Переключение видимости пароля
    passwordToggles.forEach(toggle => {
        toggle.addEventListener("click", function(e) {
            e.stopPropagation(); // Предотвращаем всплытие события
            
            // Находим поле ввода пароля рядом с кнопкой
            const input = this.previousElementSibling;
            
            // Проверяем, есть ли поле ввода и является ли оно полем для пароля
            if (input && (input.type === "password" || input.type === "text")) {
                // Переключаем тип поля
                input.type = input.type === "password" ? "text" : "password";
                
                // Меняем иконку
                this.innerHTML = input.type === "password" 
                    ? '<i class="fas fa-eye"></i>' 
                    : '<i class="fas fa-eye-slash"></i>';
            }
        });
    });
    
    // Анимация для подписки на рассылку
    const newsletterForm = document.querySelector(".newsletter-form");
    if (newsletterForm) {
        const newsletterInput = newsletterForm.querySelector("input");
        const newsletterButton = newsletterForm.querySelector("button");
        
        newsletterButton.addEventListener("click", function(e) {
            e.preventDefault();
            if (newsletterInput.value.trim() !== "") {
                // Эффект успешной подписки
                newsletterButton.innerHTML = '<i class="fas fa-check"></i>';
                newsletterButton.style.background = "linear-gradient(135deg, #27ae60, #2ecc71)";
                newsletterInput.value = "";
                
                // Сброс эффекта через 3 секунды
                setTimeout(() => {
                    newsletterButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
                    newsletterButton.style.background = "";
                }, 3000);
            }
        });
    }
});

// Модальное окно аутентификации
document.addEventListener('DOMContentLoaded', function() {
    // Элементы модального окна
    const modal = document.getElementById('authModal');
    
    // Если модальное окно не найдено, просто выходим
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.close-btn');
    if (!closeBtn) return;
    
    // Закрытие модального окна по клику на крестик
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    // Закрытие по клику вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });
});

