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

    // Загрузка последних манг
    const latestMangaGrid = document.getElementById('latest-manga-grid');
    if (latestMangaGrid) {
        loadLatestManga();
    }
    
    // Прямая инициализация слайдера (на случай, если loadLatestManga не сработает)
    setTimeout(() => {
        // Проверяем, был ли инициализирован слайдер
        const prevBtn = document.getElementById('prevManga');
        const nextBtn = document.getElementById('nextManga');
        if (prevBtn && nextBtn && typeof prevBtn.onclick !== 'function') {
            console.log('Прямая инициализация слайдера...');
            initMangaSlider();
        }
    }, 1000);
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

// Функция для загрузки последних манг
function loadLatestManga() {
    const latestMangaGrid = document.getElementById('latest-manga-grid');
    
    if (!latestMangaGrid) {
        console.error('Элемент для отображения манги не найден');
        return;
    }
    
    // Показываем индикатор загрузки
    latestMangaGrid.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка новинок...</p>
        </div>
    `;
    
    // Загружаем данные с сервера
    fetch('/api/manga/latest')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.manga && data.manga.length > 0) {
                // Очищаем контейнер
                latestMangaGrid.innerHTML = '';
                
                // Создаем карточки для каждой манги
                data.manga.forEach(manga => {
                    const card = createMangaCard(manga);
                    latestMangaGrid.appendChild(card);
                });
                
                // Инициализируем слайдер
                initMangaSlider();
            } else {
                // Если манги не найдены или произошла ошибка
                latestMangaGrid.innerHTML = `
                    <div class="loading-placeholder">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Не удалось загрузить новинки манги</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке манги:', error);
            latestMangaGrid.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ошибка при загрузке данных</p>
                </div>
            `;
        });
}

// Функция для создания карточки манги
function createMangaCard(manga) {
    // Создаем основной элемент карточки
    const card = document.createElement('div');
    card.className = 'manga-card';
    
    // Формируем ссылку на страницу манги
    const mangaUrl = `/manga/${manga.id}`;
    
    // Проверяем URL обложки
    let coverUrl = manga.coverUrl || '/database/manga/covers/placeholder.jpg';
    
    // Если URL не начинается с http или /, добавляем /
    if (!coverUrl.startsWith('http') && !coverUrl.startsWith('/')) {
        coverUrl = '/' + coverUrl;
    }
    
    // Обрабатываем жанры (максимум 2)
    let genresHTML = '';
    if (manga.genres && manga.genres.length > 0) {
        genresHTML = manga.genres.slice(0, 2)
            .map(genre => `<span class="manga-card-genre" title="${genre}">${genre}</span>`)
            .join('');
    }
    
    // Создаем HTML-содержимое карточки
    card.innerHTML = `
        <a href="${mangaUrl}" class="manga-card-link">
            <div class="manga-card-cover">
                <img 
                    src="${coverUrl}" 
                    alt="${manga.title}" 
                    loading="lazy"
                    onerror="this.style.display='none'; this.parentNode.innerHTML += '<div class=\'manga-placeholder\'><i class=\'fas fa-book\'></i><span>Нет обложки</span></div>';"
                >
                <div class="manga-card-rating">
                    <i class="fas fa-star"></i> ${manga.rating ? manga.rating.toFixed(1) : '0.0'}
                </div>
            </div>
            <div class="manga-card-info">
                <h3 class="manga-card-title" title="${manga.title}">${manga.title}</h3>
                <div class="manga-card-genres">
                    ${genresHTML}
                </div>
            </div>
        </a>
    `;
    
    return card;
}

// Функция для инициализации слайдера манги
function initMangaSlider() {
    const prevBtn = document.getElementById('prevManga');
    const nextBtn = document.getElementById('nextManga');
    const container = document.querySelector('.manga-slider-container');
    const grid = document.getElementById('latest-manga-grid');
    
    if (!prevBtn || !nextBtn || !container || !grid) {
        console.error('Не найдены элементы слайдера');
        return;
    }
    
    // Функция для обновления состояния кнопок
    function updateButtonStates() {
        const isAtStart = container.scrollLeft <= 10;
        const isAtEnd = container.scrollLeft + container.offsetWidth >= grid.scrollWidth - 10;
        
        prevBtn.classList.toggle('disabled', isAtStart);
        nextBtn.classList.toggle('disabled', isAtEnd);
    }
    
    // Функция для скролла влево
    function scrollLeft() {
        const cardWidth = 220; // Ширина карточки + отступ
        const scrollAmount = Math.min(container.scrollLeft, cardWidth * 2);
        smoothScroll(container, container.scrollLeft - scrollAmount);
    }
    
    // Функция для скролла вправо
    function scrollRight() {
        const cardWidth = 220; // Ширина карточки + отступ
        const remainingScroll = grid.scrollWidth - (container.scrollLeft + container.offsetWidth);
        const scrollAmount = Math.min(remainingScroll, cardWidth * 2);
        smoothScroll(container, container.scrollLeft + scrollAmount);
    }
    
    // Функция для плавного скролла
    function smoothScroll(element, target) {
        const start = element.scrollLeft;
        const change = target - start;
        const duration = 300; // мс
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            element.scrollLeft = start + change * easeProgress;
            
            if (progress < 1) {
                window.requestAnimationFrame(animation);
            } else {
                updateButtonStates();
            }
        }
        
        window.requestAnimationFrame(animation);
    }
    
    // Обработчики кликов для кнопок
    prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!this.classList.contains('disabled')) {
            scrollLeft();
        }
    });
    
    nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!this.classList.contains('disabled')) {
            scrollRight();
        }
    });
    
    // Обновление состояния кнопок при скролле
    container.addEventListener('scroll', function() {
        requestAnimationFrame(updateButtonStates);
    });
    
    // Обновляем состояние кнопок изначально
    updateButtonStates();
    
    // Обновляем состояние кнопок при изменении размера окна
    window.addEventListener('resize', updateButtonStates);
}

