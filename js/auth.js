// Базовый URL для API
const API_URL = 'http://localhost:3000/api';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы форм
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginButton = document.getElementById('loginButton');
    const authModal = document.getElementById('authModal');
    const authClose = document.querySelector('.close-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Настройка отображения модального окна
    if (loginButton) {
        // Проверяем статус авторизации перед назначением обработчика
        const currentUser = getCurrentUser();
        
        if (currentUser) {
            // Если пользователь уже авторизован, назначаем обработчик для меню пользователя
            loginButton.textContent = currentUser.username;
            loginButton.removeEventListener('click', openAuthModal);
            loginButton.addEventListener('click', showUserMenu);
        } else {
            // Если пользователь не авторизован, назначаем обработчик для открытия модального окна
            loginButton.addEventListener('click', openAuthModal);
        }
    }
    
    // Функция для открытия модального окна авторизации
    function openAuthModal() {
        authModal.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        // Инициализируем обработчики кнопок показа пароля при открытии модального окна
        setTimeout(() => {
            setupPasswordToggles();
        }, 100);
    }
    
    if (authClose) {
        authClose.addEventListener('click', () => {
            authModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Очищаем сообщения об ошибках при закрытии
            if (loginForm) clearMessages(loginForm);
            if (registerForm) clearMessages(registerForm);
        });
    }
    
    // Переключение вкладок вход/регистрация
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Активировать нужную вкладку
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Показать нужную форму
            document.querySelectorAll('.tab-content').forEach(form => {
                form.classList.remove('active');
            });
            
            const tabId = button.id === 'loginTab' ? 'loginContent' : 'registerContent';
            document.getElementById(tabId).classList.add('active');
            
            // Очищаем сообщения при переключении вкладок
            if (loginForm) clearMessages(loginForm);
            if (registerForm) clearMessages(registerForm);
            
            // Инициализируем обработчики кнопок показа пароля при переключении вкладок
            setTimeout(() => {
                setupPasswordToggles();
            }, 100);
        });
    });
    
    // Добавляем обработчики отправки форм
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Проверяем, залогинен ли пользователь
    checkLoginStatus();
    
    // Инициализируем обработчики для кнопок показа пароля
    setupPasswordToggles();
    
    // Также добавляем обработчик на событие открытия модального окна
    document.addEventListener('click', function(e) {
        if (e.target && e.target.matches('#loginButton:not(.logged-in)')) {
            setTimeout(() => {
                setupPasswordToggles();
            }, 100);
        }
    });
});

// Функция генерации сообщения об ошибке
function createErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-message error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    return errorDiv;
}

// Функция генерации сообщения об успехе
function createSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-message success';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    return successDiv;
}

// Очистка сообщений
function clearMessages(form) {
    const messages = form.querySelectorAll('.auth-message');
    messages.forEach(msg => msg.remove());
}

// Функция для отображения сообщений
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) {
        console.error(`Элемент с ID "${elementId}" не найден`);
        return;
    }
    
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
}

// Функция для закрытия модального окна
function closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Обработка входа пользователя
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.querySelector('#login-username').value.trim();
    const password = document.querySelector('#login-password').value;
    
    // Проверка на пустые поля
    if (!username || !password) {
        showMessage('login-message', 'Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    showMessage('login-message', 'Выполняется вход...', 'info');
    
    // Отправка данных на сервер
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Сохраняем сессию пользователя
            saveUserSession(data.user);
            
            // Показываем сообщение об успешном входе
            showMessage('login-message', data.message, 'success');
            
            // Закрываем модальное окно и обновляем UI через 1 секунду
            setTimeout(() => {
                closeModal();
                checkLoginStatus();
            }, 1000);
        } else {
            // Показываем сообщение об ошибке
            showMessage('login-message', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка при входе:', error);
        showMessage('login-message', 'Произошла ошибка при попытке входа', 'error');
    });
}

// Обработка регистрации пользователя
function handleRegister(e) {
    e.preventDefault();
    
    const username = document.querySelector('#register-username').value.trim();
    const email = document.querySelector('#register-email').value.trim();
    const password = document.querySelector('#register-password').value;
    const confirmPassword = document.querySelector('#register-confirm-password').value;
    const termsCheckbox = document.querySelector('#terms-checkbox');
    
    // Проверка на пустые поля
    if (!username || !email || !password || !confirmPassword) {
        showMessage('register-message', 'Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    // Проверка совпадения паролей
    if (password !== confirmPassword) {
        showMessage('register-message', 'Пароли не совпадают', 'error');
        return;
    }
    
    // Проверка принятия условий
    if (!termsCheckbox.checked) {
        showMessage('register-message', 'Вы должны принять условия пользования', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    showMessage('register-message', 'Выполняется регистрация...', 'info');
    
    // Отправка данных на сервер
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Показываем сообщение об успешной регистрации
            showMessage('register-message', data.message, 'success');
            
            // Автоматически входим в систему после регистрации
            saveUserSession(data.user);
            
            // Закрываем модальное окно и обновляем UI через 1 секунду
            setTimeout(() => {
                closeModal();
                checkLoginStatus();
            }, 1000);
        } else {
            // Показываем сообщение об ошибке
            showMessage('register-message', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка при регистрации:', error);
        showMessage('register-message', 'Произошла ошибка при попытке регистрации', 'error');
    });
}

// Проверка валидности email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Сохранение данных сессии пользователя
function saveUserSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Получение текущего пользователя
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Проверка статуса входа пользователя
function checkLoginStatus() {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        // Запрашиваем актуальные данные пользователя с сервера
        fetch(`/api/profile/${currentUser.username}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновляем локальные данные пользователя, сохраняя только статус
                    currentUser.status = data.user.status;
                    saveUserSession(currentUser);
                    
                    // Обновляем UI для авторизованного пользователя
                    updateUIForLoggedInUser(currentUser);
                } else {
                    console.error('Не удалось получить данные пользователя');
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке статуса пользователя:', error);
                // Используем локальные данные в случае ошибки соединения
                updateUIForLoggedInUser(currentUser);
            });
    }
}

// Обновление UI для авторизованного пользователя
function updateUIForLoggedInUser(user) {
    const loginButton = document.getElementById('loginButton');
    
    if (loginButton) {
        loginButton.textContent = user.username;
        
        // Удаляем все существующие обработчики клика
        const newButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newButton, loginButton);
        
        // Добавляем новый обработчик для показа меню пользователя
        newButton.addEventListener('click', showUserMenu);
        
        // Обновляем ссылку на кнопку для дальнейшего использования
        return newButton;
    }
    
    return loginButton;
}

// Показать меню пользователя
function showUserMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем, существует ли уже меню
    let userMenu = document.getElementById('userMenu');
    
    if (userMenu) {
        userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
        // Если меню видимо, обновляем его позицию
        if (userMenu.style.display === 'block') {
            updateUserMenuPosition();
        }
        return;
    }
    
    // Получаем данные текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Необходимо авторизоваться', 'error');
        return;
    }
    
    // Загружаем актуальные данные пользователя с сервера
    fetch(`/api/profile/${currentUser.username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем статус в локальном хранилище
                const updatedUser = getCurrentUser();
                updatedUser.status = data.user.status;
                saveUserSession(updatedUser);
                
                const isAdmin = data.user.status === 'admin';
                const isMangaka = data.user.status === 'mangaka';
                
                // Создаем меню
                userMenu = document.createElement('div');
                userMenu.id = 'userMenu';
                userMenu.className = 'user-menu';
                
                // Формируем содержимое меню в зависимости от статуса пользователя
                let menuContent = `
                    <ul>
                        <li><a href="#"><i class="fas fa-user"></i> Профиль</a></li>
                        <li><a href="#" id="bookmarks-link"><i class="fas fa-bookmark"></i> Закладки</a></li>
                `;
                
                // Добавляем пункт "Добавить мангу" для мангаки или админа
                if (isAdmin || isMangaka) {
                    menuContent += `<li><a href="#" id="add-manga-link"><i class="fas fa-plus-circle"></i> Добавить мангу</a></li>`;
                }
                
                // Добавляем пункт админ-панели, если пользователь администратор
                if (isAdmin) {
                    menuContent += `<li><a href="#" id="admin-panel-link"><i class="fas fa-crown"></i> Админ-панель</a></li>`;
                }
                
                // Добавляем пункт выхода
                menuContent += `<li class="logout"><a href="#"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
                    </ul>
                `;
                
                userMenu.innerHTML = menuContent;
                
                // Позиционирование меню
                const loginButton = document.getElementById('loginButton');
                const rect = loginButton.getBoundingClientRect();
                
                // Добавляем меню в документ
                document.body.appendChild(userMenu);
                
                // Устанавливаем позицию меню относительно кнопки и окна
                userMenu.style.right = `${window.innerWidth - rect.right}px`;
                userMenu.style.top = `${rect.bottom}px`;
                userMenu.style.display = 'block';
                
                // Добавляем обработчик клика для кнопки выхода
                userMenu.querySelector('.logout a').addEventListener('click', handleLogout);
                
                // Добавляем обработчик для закладок
                const bookmarksLink = userMenu.querySelector('#bookmarks-link');
                if (bookmarksLink) {
                    bookmarksLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showUserBookmarks();
                    });
                }
                
                // Добавляем обработчик для кнопки "Добавить мангу"
                const addMangaLinkBtn = userMenu.querySelector('#add-manga-link');
                if (addMangaLinkBtn) {
                    addMangaLinkBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        // Закрываем меню пользователя
                        userMenu.style.display = 'none';
                        // Вызываем функцию для отображения формы добавления манги
                        showAddMangaForm();
                    });
                }
                
                // Добавляем обработчик для админ-панели
                const adminPanelLink = userMenu.querySelector('#admin-panel-link');
                if (adminPanelLink) {
                    adminPanelLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        // Вызываем функцию отображения админ-панели
                        showAdminPanel();
                    });
                }
                
                // Добавляем обработчик для профиля
                const profileLink = userMenu.querySelector('li:first-child a');
                if (profileLink) {
                    profileLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showUserProfile();
                    });
                }
                
                // Закрытие меню при клике вне его
                document.addEventListener('click', function closeMenu(e) {
                    if (userMenu && !userMenu.contains(e.target) && e.target !== loginButton) {
                        userMenu.style.display = 'none';
                    }
                });
                
                // Добавляем эффект появления
                setTimeout(() => {
                    userMenu.style.opacity = '1';
                    userMenu.style.transform = 'translateY(0)';
                }, 10);
            } else {
                showNotification('Не удалось загрузить данные пользователя', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных пользователя:', error);
            showNotification('Произошла ошибка при загрузке данных', 'error');
            
            // Создаем базовое меню в случае ошибки
            userMenu = document.createElement('div');
            userMenu.id = 'userMenu';
            userMenu.className = 'user-menu';
            
            userMenu.innerHTML = `
                <ul>
                    <li><a href="#"><i class="fas fa-user"></i> Профиль</a></li>
                    <li><a href="#" id="bookmarks-link"><i class="fas fa-bookmark"></i> Закладки</a></li>
                    <li class="logout"><a href="#"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
                </ul>
            `;
            
            // Позиционирование меню
            const loginButton = document.getElementById('loginButton');
            const rect = loginButton.getBoundingClientRect();
            
            // Добавляем меню в документ
            document.body.appendChild(userMenu);
            
            // Устанавливаем позицию меню относительно кнопки и окна
            userMenu.style.right = `${window.innerWidth - rect.right}px`;
            userMenu.style.top = `${rect.bottom}px`;
            userMenu.style.display = 'block';
            
            // Добавляем обработчики
            userMenu.querySelector('.logout a').addEventListener('click', handleLogout);
            
            const bookmarksLink = userMenu.querySelector('#bookmarks-link');
            if (bookmarksLink) {
                bookmarksLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    showUserBookmarks();
                });
            }
            
            const profileLink = userMenu.querySelector('li:first-child a');
            if (profileLink) {
                profileLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    showUserProfile();
                });
            }
            
            // Закрытие меню при клике вне его
            document.addEventListener('click', function closeMenu(e) {
                if (userMenu && !userMenu.contains(e.target) && e.target !== loginButton) {
                    userMenu.style.display = 'none';
                }
            });
            
            // Добавляем эффект появления
            setTimeout(() => {
                userMenu.style.opacity = '1';
                userMenu.style.transform = 'translateY(0)';
            }, 10);
        });
}

// Функция для обновления позиции меню пользователя
function updateUserMenuPosition() {
    const userMenu = document.getElementById('userMenu');
    const loginButton = document.getElementById('loginButton');
    
    if (userMenu && loginButton && userMenu.style.display === 'block') {
        const rect = loginButton.getBoundingClientRect();
        userMenu.style.right = `${window.innerWidth - rect.right}px`;
        userMenu.style.top = `${rect.bottom}px`;
    }
}

// Добавляем обработчик события прокрутки для обновления позиции меню
window.addEventListener('scroll', updateUserMenuPosition);
window.addEventListener('resize', updateUserMenuPosition);

// Обработка выхода
function handleLogout(e) {
    e.preventDefault();
    
    // Удаляем данные пользователя
    localStorage.removeItem('currentUser');
    
    // Обновляем UI
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.textContent = 'ВОЙТИ';
        
        // Удаляем все существующие обработчики клика
        const newButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newButton, loginButton);
        
        // Добавляем обработчик для открытия модального окна
        newButton.addEventListener('click', function() {
            const authModal = document.getElementById('authModal');
            authModal.style.display = 'flex';
            document.body.classList.add('modal-open');
        });
    }
    
    // Закрываем меню пользователя
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.remove();
    }
    
    // Показываем уведомление о выходе
    showNotification('Вы успешно вышли из аккаунта', 'success');
}

// Функция для отображения уведомления
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.background = type === 'success' ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : 'linear-gradient(135deg, #e74c3c, #c0392b)';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '2000';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    document.body.appendChild(notification);
    
    // Анимируем появление
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Добавляем стили для сообщений
const style = document.createElement('style');
style.textContent = `
    .auth-message {
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 5px;
        display: flex;
        align-items: center;
    }
    
    .auth-message i {
        margin-right: 8px;
    }
    
    .auth-message.error {
        background-color: #ffebee;
        color: #c62828;
        border-left: 3px solid #c62828;
    }
    
    .auth-message.success {
        background-color: #e8f5e9;
        color: #2e7d32;
        border-left: 3px solid #2e7d32;
    }
`;

document.head.appendChild(style);

// Добавляем обработчики для показа/скрытия пароля
function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        // Сначала удаляем все существующие обработчики
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        // Добавляем новый обработчик
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Ищем поле ввода пароля рядом с кнопкой
            const passwordField = this.previousElementSibling;
            
            if (passwordField && (passwordField.type === 'password' || passwordField.type === 'text')) {
                // Меняем тип поля ввода
                passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
                
                // Обновляем иконку
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = passwordField.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }
        });
    });
    
    // Дополнительный вызов для отладки
    console.log('Обработчики кнопок пароля установлены:', passwordToggles.length);
}

// Функция для отображения закладок пользователя
function showUserBookmarks() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Невозможно загрузить данные', 'error');
        return;
    }
    
    // Закрываем меню пользователя
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    
    // Проверяем, есть ли уже открытое окно закладок
    let bookmarksModal = document.getElementById('bookmarksModal');
    
    if (bookmarksModal) {
        // Если модальное окно уже существует, просто показываем его
        bookmarksModal.style.display = 'flex';
        return;
    }
    
    // Инициализируем массивы, если их нет
    if (!currentUser.bookmarks) currentUser.bookmarks = [];
    if (!currentUser.read) currentUser.read = [];
    
    // Создаем новое модальное окно для закладок и прочитанного
    bookmarksModal = document.createElement('div');
    bookmarksModal.id = 'bookmarksModal';
    bookmarksModal.className = 'modal';
    
    // Содержимое модального окна с табами
    bookmarksModal.innerHTML = `
        <div class="modal-content collection-content">
            <span class="close-btn">&times;</span>
            
            <div class="collection-tabs">
                <button class="collection-tab active" data-tab="bookmarks">
                    <i class="fas fa-bookmark"></i> Мои закладки
                    <span class="collection-count">${currentUser.bookmarks.length}</span>
                </button>
                <button class="collection-tab" data-tab="read">
                    <i class="fas fa-book-reader"></i> Прочитанное
                    <span class="collection-count">${currentUser.read.length}</span>
                </button>
            </div>
            
            <div class="collection-content-wrapper">
                <div class="collection-tab-content active" id="bookmarks-content">
                    <div class="collection-list">
                        ${currentUser.bookmarks.length > 0 
                            ? currentUser.bookmarks.map(id => `<div class="collection-item" data-id="${id}">
                                    <span class="collection-item-title">Манга #${id}</span>
                                    <div class="collection-item-actions">
                                        <button class="collection-item-view" title="Просмотр"><i class="fas fa-eye"></i></button>
                                        <button class="collection-item-remove" title="Удалить из закладок"><i class="fas fa-times"></i></button>
                                    </div>
                                </div>`).join('')
                            : '<p class="empty-collection">У вас пока нет закладок</p>'
                        }
                    </div>
                </div>
                
                <div class="collection-tab-content" id="read-content">
                    <div class="collection-list">
                        ${currentUser.read.length > 0 
                            ? currentUser.read.map(id => `<div class="collection-item" data-id="${id}">
                                    <span class="collection-item-title">Манга #${id}</span>
                                    <div class="collection-item-actions">
                                        <button class="collection-item-view" title="Просмотр"><i class="fas fa-eye"></i></button>
                                        <button class="collection-item-remove" title="Удалить из прочитанного"><i class="fas fa-times"></i></button>
                                    </div>
                                </div>`).join('')
                            : '<p class="empty-collection">У вас пока нет прочитанных манг</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в DOM
    document.body.appendChild(bookmarksModal);
    
    // Показываем модальное окно
    bookmarksModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Добавляем обработчик для закрытия
    const closeBtn = bookmarksModal.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        bookmarksModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });
    
    // Добавляем обработчики для переключения табов
    const tabs = bookmarksModal.querySelectorAll('.collection-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Удаляем активный класс у всех табов и их контента
            tabs.forEach(t => t.classList.remove('active'));
            bookmarksModal.querySelectorAll('.collection-tab-content').forEach(c => c.classList.remove('active'));
            
            // Добавляем активный класс выбранному табу и его контенту
            this.classList.add('active');
            
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-content`).classList.add('active');
        });
    });
    
    // Добавляем обработчики для кнопок удаления закладок
    const bookmarksRemoveButtons = bookmarksModal.querySelectorAll('#bookmarks-content .collection-item-remove');
    bookmarksRemoveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.collection-item');
            const mangaId = item.getAttribute('data-id');
            
            // Анимируем удаление элемента
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                item.remove();
                
                // Проверяем, остались ли закладки
                const bookmarksList = bookmarksModal.querySelector('#bookmarks-content .collection-list');
                if (bookmarksList.children.length === 0) {
                    bookmarksList.innerHTML = '<p class="empty-collection">У вас пока нет закладок</p>';
                }
                
                // Обновляем счетчик
                updateCollectionCount('bookmarks');
            }, 300);
            
            // Удаляем из данных пользователя
            removeBookmark(mangaId);
        });
    });
    
    // Добавляем обработчики для кнопок удаления прочитанного
    const readRemoveButtons = bookmarksModal.querySelectorAll('#read-content .collection-item-remove');
    readRemoveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.collection-item');
            const mangaId = item.getAttribute('data-id');
            
            // Анимируем удаление элемента
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                item.remove();
                
                // Проверяем, остались ли прочитанные манги
                const readList = bookmarksModal.querySelector('#read-content .collection-list');
                if (readList.children.length === 0) {
                    readList.innerHTML = '<p class="empty-collection">У вас пока нет прочитанных манг</p>';
                }
                
                // Обновляем счетчик
                updateCollectionCount('read');
            }, 300);
            
            // Удаляем из данных пользователя
            removeFromReadList(mangaId);
        });
    });
    
    // Добавляем обработчики для кнопок просмотра
    const viewButtons = bookmarksModal.querySelectorAll('.collection-item-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mangaId = this.closest('.collection-item').getAttribute('data-id');
            showNotification(`Просмотр манги #${mangaId}`, 'info');
            // Здесь будет переход на страницу манги
        });
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === bookmarksModal) {
            bookmarksModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });
    
    // Функция для обновления счетчика
    function updateCollectionCount(type) {
        const currentUser = getCurrentUser();
        const countElement = bookmarksModal.querySelector(`.collection-tab[data-tab="${type}"] .collection-count`);
        
        if (countElement) {
            const count = type === 'bookmarks' ? currentUser.bookmarks.length : currentUser.read.length;
            countElement.textContent = count;
        }
    }
}

// Функция для удаления закладки
async function removeBookmark(mangaId) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.bookmarks) {
        return;
    }
    
    try {
        // Отправляем запрос на сервер для удаления закладки
        const response = await fetch('/api/bookmarks/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser.username,
                mangaId: mangaId
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем данные пользователя
            currentUser.bookmarks = data.bookmarks;
            saveUserSession(currentUser);
            
            showNotification('Закладка удалена', 'success');
        } else {
            showNotification(data.message || 'Не удалось удалить закладку', 'error');
        }
    } catch (error) {
        console.error('Ошибка при удалении закладки:', error);
        showNotification('Произошла ошибка при удалении закладки', 'error');
        
        // Локальное удаление в случае ошибки
        currentUser.bookmarks = currentUser.bookmarks.filter(id => id !== mangaId);
        saveUserSession(currentUser);
    }
}

// Функция для добавления закладки
async function addBookmark(mangaId) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Требуется авторизация', 'error');
        return;
    }
    
    try {
        // Отправляем запрос на сервер для добавления закладки
        const response = await fetch('/api/bookmarks/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser.username,
                mangaId: mangaId
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем данные пользователя
            currentUser.bookmarks = data.bookmarks;
            saveUserSession(currentUser);
            
            showNotification(data.message || 'Добавлено в закладки', 'success');
        } else {
            showNotification(data.message || 'Не удалось добавить закладку', 'error');
        }
    } catch (error) {
        console.error('Ошибка при добавлении закладки:', error);
        showNotification('Произошла ошибка при добавлении закладки', 'error');
        
        // Локальное добавление в случае ошибки
        if (!currentUser.bookmarks) {
            currentUser.bookmarks = [];
        }
        
        if (!currentUser.bookmarks.includes(mangaId)) {
            currentUser.bookmarks.push(mangaId);
            saveUserSession(currentUser);
        }
    }
}

// Функция для отображения профиля пользователя
function showUserProfile() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Невозможно загрузить данные профиля', 'error');
        return;
    }
    
    // Закрываем меню пользователя
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    
    // Проверяем, есть ли уже открытое окно профиля
    let profileModal = document.getElementById('profileModal');
    
    if (profileModal) {
        // Если модальное окно уже существует, просто показываем его
        profileModal.style.display = 'flex';
        return;
    }
    
    // Получаем актуальные данные пользователя с сервера
    fetch(`/api/profile/${currentUser.username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем только статус в локальном хранилище
                const updatedUser = getCurrentUser();
                updatedUser.status = data.user.status;
                saveUserSession(updatedUser);
                
                // Форматируем дату регистрации
                const createdDate = new Date(data.user.createdAt);
                const formattedDate = createdDate.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                
                // Определяем название статуса для отображения
                let statusName = 'Пользователь';
                let statusIcon = 'fas fa-user';
                let statusClass = 'user-status';
                
                if (data.user.status === 'admin') {
                    statusName = 'Администратор';
                    statusIcon = 'fas fa-crown';
                    statusClass = 'admin-status';
                } else if (data.user.status === 'mangaka') {
                    statusName = 'Мангака';
                    statusIcon = 'fas fa-paint-brush';
                    statusClass = 'mangaka-status';
                }
                
                // Создаем новое модальное окно для профиля
                profileModal = document.createElement('div');
                profileModal.id = 'profileModal';
                profileModal.className = 'modal';
                
                // Содержимое модального окна
                profileModal.innerHTML = `
                    <div class="modal-content profile-content">
                        <span class="close-btn">&times;</span>
                        
                        <div class="profile-header">
                            <div class="profile-avatar">
                                ${data.user.profile.avatar 
                                    ? `<img src="${data.user.profile.avatar}" alt="${data.user.username}" />`
                                    : `<div class="avatar-placeholder">${data.user.username.charAt(0).toUpperCase()}</div>`
                                }
                                <button class="change-avatar-btn"><i class="fas fa-camera"></i></button>
                            </div>
                            <div class="profile-title">
                                <h2>${data.user.username}</h2>
                                <span class="profile-status ${statusClass}">
                                    <i class="${statusIcon}"></i> ${statusName}
                                </span>
                                <button class="change-status-btn"><i class="fas fa-user-tag"></i> Изменить статус</button>
                            </div>
                        </div>
                        
                        <div class="profile-info">
                            <div class="profile-section">
                                <h3><i class="fas fa-id-card"></i> Основная информация</h3>
                                <div class="info-block">
                                    <div class="info-row">
                                        <span class="info-label">Email:</span>
                                        <span class="info-value">${data.user.email}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Дата регистрации:</span>
                                        <span class="info-value">${formattedDate}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="profile-section">
                                <h3><i class="fas fa-chart-pie"></i> Статистика</h3>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-value">${data.user.bookmarks ? data.user.bookmarks.length : 0}</div>
                                        <div class="stat-label">Закладок</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${data.user.read ? data.user.read.length : 0}</div>
                                        <div class="stat-label">Прочитано</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">0</div>
                                        <div class="stat-label">Комментариев</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Добавляем модальное окно в DOM
                document.body.appendChild(profileModal);
                
                // Показываем модальное окно
                profileModal.style.display = 'flex';
                document.body.classList.add('modal-open');
                
                // Добавляем обработчик для закрытия
                const closeBtn = profileModal.querySelector('.close-btn');
                closeBtn.addEventListener('click', function() {
                    profileModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                });
                
                // Добавляем обработчик для кнопки изменения аватара
                const changeAvatarBtn = profileModal.querySelector('.change-avatar-btn');
                if (changeAvatarBtn) {
                    changeAvatarBtn.addEventListener('click', function() {
                        showAvatarUploadForm();
                    });
                }
                
                // Добавляем обработчик для кнопки изменения статуса
                const changeStatusBtn = profileModal.querySelector('.change-status-btn');
                if (changeStatusBtn) {
                    changeStatusBtn.addEventListener('click', function() {
                        showStatusChangeForm();
                    });
                }
                
                // Закрытие при клике вне модального окна
                window.addEventListener('click', function(e) {
                    if (e.target === profileModal) {
                        profileModal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                    }
                });
            } else {
                showNotification('Не удалось загрузить данные профиля', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке профиля:', error);
            showNotification('Произошла ошибка при загрузке профиля', 'error');
        });
}

// Функция для отображения списка прочитанного
function showUserReadList() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.read) {
        showNotification('У вас пока нет прочитанных манг', 'info');
        return;
    }
    
    // Закрываем меню пользователя
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    
    // Проверяем, есть ли уже открытое окно прочитанных манг
    let readModal = document.getElementById('readModal');
    
    if (readModal) {
        // Если модальное окно уже существует, просто показываем его
        readModal.style.display = 'flex';
        return;
    }
    
    // Создаем новое модальное окно для списка прочитанного
    readModal = document.createElement('div');
    readModal.id = 'readModal';
    readModal.className = 'modal';
    
    // Содержимое модального окна
    readModal.innerHTML = `
        <div class="modal-content bookmarks-content">
            <span class="close-btn">&times;</span>
            <h2><i class="fas fa-book-reader"></i> Прочитанные манги</h2>
            <div id="read-list">
                ${currentUser.read.length > 0 
                    ? currentUser.read.map(id => `<div class="bookmark-item" data-id="${id}">
                            <span class="bookmark-title">Манга #${id}</span>
                            <button class="remove-read"><i class="fas fa-times"></i></button>
                        </div>`).join('')
                    : '<p class="empty-bookmarks">У вас пока нет прочитанных манг</p>'
                }
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в DOM
    document.body.appendChild(readModal);
    
    // Показываем модальное окно
    readModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Добавляем обработчик для закрытия
    const closeBtn = readModal.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        readModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });
    
    // Добавляем обработчики для кнопок удаления из прочитанного
    const removeButtons = readModal.querySelectorAll('.remove-read');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const readItem = this.parentElement;
            const mangaId = readItem.getAttribute('data-id');
            
            // Удаляем из UI
            readItem.style.opacity = '0';
            setTimeout(() => {
                readItem.remove();
                
                // Проверяем, остались ли записи
                const readList = document.getElementById('read-list');
                if (readList.children.length === 0) {
                    readList.innerHTML = '<p class="empty-bookmarks">У вас пока нет прочитанных манг</p>';
                }
            }, 300);
            
            // Удаляем из данных пользователя
            removeFromReadList(mangaId);
        });
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === readModal) {
            readModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });
}

// Функция для удаления из списка прочитанных
async function removeFromReadList(mangaId) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.read) {
        return;
    }
    
    try {
        // Отправляем запрос на сервер для удаления из прочитанного
        const response = await fetch('/api/read/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser.username,
                mangaId: mangaId
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем данные пользователя
            currentUser.read = data.read;
            saveUserSession(currentUser);
            
            showNotification('Удалено из прочитанного', 'success');
        } else {
            showNotification(data.message || 'Не удалось удалить из прочитанного', 'error');
        }
    } catch (error) {
        console.error('Ошибка при удалении из прочитанного:', error);
        showNotification('Произошла ошибка при удалении из прочитанного', 'error');
        
        // Локальное удаление в случае ошибки
        currentUser.read = currentUser.read.filter(id => id !== mangaId);
        saveUserSession(currentUser);
    }
}

// Функция для добавления в список прочитанного
async function addToReadList(mangaId) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Требуется авторизация', 'error');
        return;
    }
    
    try {
        // Отправляем запрос на сервер для добавления в прочитанное
        const response = await fetch('/api/read/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser.username,
                mangaId: mangaId
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем данные пользователя
            currentUser.read = data.read;
            saveUserSession(currentUser);
            
            showNotification(data.message || 'Добавлено в прочитанное', 'success');
        } else {
            showNotification(data.message || 'Не удалось добавить в прочитанное', 'error');
        }
    } catch (error) {
        console.error('Ошибка при добавлении в прочитанное:', error);
        showNotification('Произошла ошибка при добавлении в прочитанное', 'error');
        
        // Локальное добавление в случае ошибки
        if (!currentUser.read) {
            currentUser.read = [];
        }
        
        if (!currentUser.read.includes(mangaId)) {
            currentUser.read.push(mangaId);
            saveUserSession(currentUser);
        }
    }
}

// Функция для отображения формы выбора аватара
function showAvatarUploadForm() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Невозможно загрузить данные профиля', 'error');
        return;
    }
    
    // Проверяем, есть ли уже открытое окно загрузки аватара
    let avatarModal = document.getElementById('avatarUploadModal');
    
    if (avatarModal) {
        // Если модальное окно уже существует, просто показываем его
        avatarModal.style.display = 'flex';
        return;
    }
    
    // Создаем новое модальное окно для загрузки аватара
    avatarModal = document.createElement('div');
    avatarModal.id = 'avatarUploadModal';
    avatarModal.className = 'modal';
    
    // Содержимое модального окна
    avatarModal.innerHTML = `
        <div class="modal-content avatar-upload-content">
            <span class="close-btn">&times;</span>
            <h2><i class="fas fa-camera"></i> Загрузка аватара</h2>
            
            <div class="avatar-preview">
                <div class="current-avatar">
                    ${currentUser.profile.avatar 
                        ? `<img src="${currentUser.profile.avatar}" alt="${currentUser.username}" id="avatarPreview" />`
                        : `<div class="avatar-placeholder" id="avatarPreview">${currentUser.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="avatar-preview-new hidden">
                    <img src="" alt="Предпросмотр" id="newAvatarPreview" />
                </div>
            </div>
            
            <div class="avatar-upload-controls">
                <div class="file-input-wrapper">
                    <button class="file-input-button"><i class="fas fa-upload"></i> Выбрать изображение</button>
                    <input type="file" id="avatarFileInput" accept="image/*" class="file-input" />
                </div>
                <p class="file-restrictions">Поддерживаемые форматы: JPG, PNG, GIF. Макс. размер: 5 МБ</p>
            </div>
            
            <div class="avatar-upload-actions">
                <button id="uploadAvatarButton" class="primary-button" disabled>Сохранить</button>
                <button id="cancelAvatarButton" class="secondary-button">Отмена</button>
            </div>
            
            <div id="upload-progress" class="progress-bar-container hidden">
                <div class="progress-bar"></div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в DOM
    document.body.appendChild(avatarModal);
    
    // Показываем модальное окно
    avatarModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Получаем элементы внутри модального окна
    const closeBtn = avatarModal.querySelector('.close-btn');
    const fileInput = avatarModal.querySelector('#avatarFileInput');
    const uploadButton = avatarModal.querySelector('#uploadAvatarButton');
    const cancelButton = avatarModal.querySelector('#cancelAvatarButton');
    const newAvatarPreview = avatarModal.querySelector('#newAvatarPreview');
    const currentAvatarContainer = avatarModal.querySelector('.current-avatar');
    const newAvatarContainer = avatarModal.querySelector('.avatar-preview-new');
    const progressBar = avatarModal.querySelector('#upload-progress');
    
    // Добавляем обработчик для закрытия
    closeBtn.addEventListener('click', closeAvatarModal);
    
    // Добавляем обработчик для кнопки отмены
    cancelButton.addEventListener('click', closeAvatarModal);
    
    // Добавляем обработчик для выбора файла
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            // Проверка типа файла
            if (!file.type.startsWith('image/')) {
                showNotification('Пожалуйста, выберите изображение (JPG, PNG, GIF)', 'error');
                return;
            }
            
            // Проверка размера файла (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Размер файла не должен превышать 5MB', 'error');
                return;
            }
            
            // Создаем URL для предпросмотра
            const imageUrl = URL.createObjectURL(file);
            newAvatarPreview.src = imageUrl;
            
            // Показываем контейнер с новым аватаром и скрываем текущий
            currentAvatarContainer.style.opacity = '0';
            currentAvatarContainer.style.transform = 'scale(0.8) translateX(-30px)';
            
            setTimeout(() => {
                currentAvatarContainer.classList.add('hidden');
                newAvatarContainer.classList.remove('hidden');
                
                // Анимируем появление нового аватара
                newAvatarContainer.style.opacity = '1';
                newAvatarContainer.style.transform = 'scale(1) translateX(0)';
            }, 300);
            
            // Активируем кнопку загрузки
            uploadButton.disabled = false;
        }
    });
    
    // Добавляем обработчик для кнопки загрузки
    uploadButton.addEventListener('click', function() {
        if (fileInput.files && fileInput.files[0]) {
            uploadAvatar(fileInput.files[0], currentUser.username, progressBar);
        }
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === avatarModal) {
            closeAvatarModal();
        }
    });
    
    // Функция закрытия модального окна
    function closeAvatarModal() {
        avatarModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Очищаем предпросмотр и выбранный файл
        if (newAvatarPreview.src) {
            URL.revokeObjectURL(newAvatarPreview.src);
            newAvatarPreview.src = '';
        }
    }
}

// Функция для загрузки аватара на сервер
async function uploadAvatar(file, username, progressBarContainer) {
    try {
        // Показываем прогресс-бар
        progressBarContainer.classList.remove('hidden');
        const progressBarElement = progressBarContainer.querySelector('.progress-bar');
        progressBarElement.style.width = '0%';
        
        // Создаем FormData и добавляем файл и имя пользователя
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('username', username);
        
        // Создаем XMLHttpRequest для отслеживания прогресса загрузки
        const xhr = new XMLHttpRequest();
        
        // Настраиваем отслеживание прогресса
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBarElement.style.width = percentComplete + '%';
            }
        });
        
        // Обрабатываем ответ
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success) {
                        // Обновляем данные пользователя в локальном хранилище
                        saveUserSession(response.user);
                        
                        // Показываем уведомление об успехе
                        showNotification('Аватар успешно обновлен', 'success');
                        
                        // Закрываем модальное окно
                        const avatarModal = document.getElementById('avatarUploadModal');
                        if (avatarModal) {
                            avatarModal.style.display = 'none';
                            document.body.classList.remove('modal-open');
                        }
                        
                        // Обновляем аватар в профиле, если открыт
                        updateProfileAvatar(response.user.profile.avatar);
                    } else {
                        showNotification(response.message || 'Не удалось обновить аватар', 'error');
                    }
                } catch (e) {
                    console.error('Ошибка при обработке ответа сервера:', e);
                    showNotification('Ошибка при обработке ответа сервера', 'error');
                }
            } else {
                showNotification('Ошибка при загрузке аватара', 'error');
            }
            
            // Скрываем прогресс-бар
            progressBarContainer.classList.add('hidden');
        };
        
        // Обрабатываем ошибки
        xhr.onerror = function() {
            console.error('Ошибка при загрузке аватара');
            showNotification('Ошибка при загрузке аватара', 'error');
            progressBarContainer.classList.add('hidden');
        };
        
        // Отправляем запрос
        xhr.open('POST', '/api/profile/update-avatar', true);
        xhr.send(formData);
        
    } catch (error) {
        console.error('Ошибка при загрузке аватара:', error);
        showNotification('Произошла ошибка при загрузке аватара', 'error');
        progressBarContainer.classList.add('hidden');
    }
}

// Функция для обновления аватара в открытом профиле
function updateProfileAvatar(avatarUrl) {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        const avatarContainer = profileModal.querySelector('.profile-avatar');
        if (avatarContainer) {
            // Очищаем содержимое контейнера
            avatarContainer.innerHTML = '';
            
            // Создаем элемент изображения
            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.alt = 'Аватар пользователя';
            
            // Добавляем кнопку изменения аватара
            const changeBtn = document.createElement('button');
            changeBtn.className = 'change-avatar-btn';
            changeBtn.innerHTML = '<i class="fas fa-camera"></i>';
            changeBtn.addEventListener('click', function() {
                showAvatarUploadForm();
            });
            
            // Добавляем элементы в контейнер
            avatarContainer.appendChild(avatarImg);
            avatarContainer.appendChild(changeBtn);
        }
    }
}

// Функция для отображения формы изменения статуса
function showStatusChangeForm() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Невозможно загрузить данные профиля', 'error');
        return;
    }
    
    // Проверяем, есть ли уже открытое окно смены статуса
    let statusModal = document.getElementById('statusChangeModal');
    
    if (statusModal) {
        // Если модальное окно уже существует, просто показываем его
        statusModal.style.display = 'flex';
        return;
    }
    
    // Получаем актуальные данные пользователя с сервера
    fetch(`/api/profile/${currentUser.username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем статус в локальном хранилище
                const updatedUser = getCurrentUser();
                updatedUser.status = data.user.status;
                saveUserSession(updatedUser);
                
                // Создаем новое модальное окно для смены статуса
                statusModal = document.createElement('div');
                statusModal.id = 'statusChangeModal';
                statusModal.className = 'modal';
                
                // Определяем отображение статуса
                const statusClass = data.user.status === 'admin' ? 'admin-badge' : 
                                    data.user.status === 'mangaka' ? 'mangaka-badge' : 'user-badge';
                const statusIcon = data.user.status === 'admin' ? 'fas fa-crown' : 
                                  data.user.status === 'mangaka' ? 'fas fa-paint-brush' : 'fas fa-user';
                const statusName = data.user.status === 'admin' ? 'Администратор' : 
                                  data.user.status === 'mangaka' ? 'Мангака' : 'Пользователь';
                
                // Содержимое модального окна
                statusModal.innerHTML = `
                    <div class="modal-content status-change-content">
                        <span class="close-btn">&times;</span>
                        <h2><i class="fas fa-user-tag"></i> Изменение статуса</h2>
                        
                        <div class="status-current">
                            <p>Ваш текущий статус: 
                                <span class="status-badge ${statusClass}">
                                    <i class="${statusIcon}"></i>
                                    ${statusName}
                                </span>
                            </p>
                        </div>
                        
                        <div class="status-form">
                            <div class="form-group">
                                <input type="text" id="status-code" placeholder="Введите код статуса">
                            </div>
                            <div id="status-message" class="message hidden"></div>
                            <div class="status-options">
                                <button id="apply-status-button" class="primary-button">Применить</button>
                                <button id="cancel-status-button" class="secondary-button">Отмена</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Добавляем модальное окно в DOM
                document.body.appendChild(statusModal);
                
                // Показываем модальное окно
                statusModal.style.display = 'flex';
                document.body.classList.add('modal-open');
                
                // Получаем элементы внутри модального окна
                const closeBtn = statusModal.querySelector('.close-btn');
                const applyButton = statusModal.querySelector('#apply-status-button');
                const cancelButton = statusModal.querySelector('#cancel-status-button');
                const statusMessage = statusModal.querySelector('#status-message');
                
                // Добавляем обработчик для закрытия
                closeBtn.addEventListener('click', closeStatusModal);
                
                // Добавляем обработчик для кнопки отмены
                cancelButton.addEventListener('click', closeStatusModal);
                
                // Добавляем обработчик для кнопки применения статуса
                applyButton.addEventListener('click', function() {
                    const statusCode = document.getElementById('status-code').value.trim();
                    
                    if (!statusCode) {
                        showStatusMessage('Пожалуйста, введите код статуса', 'error');
                        return;
                    }
                    
                    // Показываем сообщение о загрузке
                    showStatusMessage('Проверяем код...', 'info');
                    
                    // Отправляем запрос на сервер
                    changeUserStatus(currentUser.username, statusCode);
                });
                
                // Закрытие при клике вне модального окна
                window.addEventListener('click', function(e) {
                    if (e.target === statusModal) {
                        closeStatusModal();
                    }
                });
            } else {
                showNotification('Не удалось загрузить данные пользователя', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных пользователя:', error);
            showNotification('Произошла ошибка при загрузке данных', 'error');
        });
    
    // Функция для отображения сообщений в модальном окне
    function showStatusMessage(message, type) {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `message ${type}`;
            statusMessage.classList.remove('hidden');
        }
    }
    
    // Функция закрытия модального окна
    function closeStatusModal() {
        const statusModal = document.getElementById('statusChangeModal');
        if (statusModal) {
            statusModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
}

// Функция для изменения статуса пользователя
async function changeUserStatus(username, statusCode) {
    try {
        // Отправляем запрос на сервер
        const response = await fetch('/api/profile/change-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                statusCode
            }),
        });
        
        const data = await response.json();
        const statusMessage = document.getElementById('status-message');
        
        if (data.success) {
            // Не обновляем локальные данные, так как они будут загружены при следующем обращении
            
            // Показываем сообщение об успехе
            if (statusMessage) {
                statusMessage.textContent = data.message;
                statusMessage.className = 'message success';
            }
            
            // Закрываем модальное окно через 2 секунды
            setTimeout(() => {
                const statusModal = document.getElementById('statusChangeModal');
                if (statusModal) {
                    statusModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }
                
                // Обновляем профиль, если он открыт
                refreshProfileIfOpen();
                
                // Показываем глобальное уведомление
                showNotification(data.message, 'success');
            }, 2000);
        } else {
            // Показываем сообщение об ошибке
            if (statusMessage) {
                statusMessage.textContent = data.message;
                statusMessage.className = 'message error';
            }
        }
    } catch (error) {
        console.error('Ошибка при изменении статуса:', error);
        
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = 'Произошла ошибка при изменении статуса';
            statusMessage.className = 'message error';
        }
    }
}

// Функция для обновления отображения статуса в модальном окне
function updateStatusDisplay(status) {
    const statusBadge = document.querySelector('.status-badge');
    if (!statusBadge) return;
    
    // Запрашиваем актуальный статус пользователя с сервера
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    fetch(`/api/profile/${currentUser.username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем статус в локальном хранилище
                const updatedUser = getCurrentUser();
                updatedUser.status = data.user.status;
                saveUserSession(updatedUser);
                
                status = data.user.status;
                
                // Удаляем текущие классы
                statusBadge.classList.remove('admin-badge', 'mangaka-badge', 'user-badge');
                
                // Добавляем новый класс
                if (status === 'admin') {
                    statusBadge.classList.add('admin-badge');
                    statusBadge.innerHTML = '<i class="fas fa-crown"></i> Администратор';
                } else if (status === 'mangaka') {
                    statusBadge.classList.add('mangaka-badge');
                    statusBadge.innerHTML = '<i class="fas fa-paint-brush"></i> Мангака';
                } else {
                    statusBadge.classList.add('user-badge');
                    statusBadge.innerHTML = '<i class="fas fa-user"></i> Пользователь';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка при обновлении статуса:', error);
        });
}

// Функция для обновления открытого профиля
function refreshProfileIfOpen() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        // Закрываем текущее модальное окно профиля
        profileModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Повторно открываем профиль с обновленными данными
        setTimeout(() => {
            showUserProfile();
        }, 100);
    }
}

// Функция для отображения админ-панели
function showAdminPanel() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Невозможно загрузить данные', 'error');
        return;
    }
    
    // Проверяем, имеет ли пользователь статус администратора
    if (currentUser.status !== 'admin') {
        showNotification('У вас недостаточно прав для доступа к админ-панели', 'error');
        return;
    }
    
    // Закрываем меню пользователя
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    
    // Проверяем, есть ли уже открытое окно админ-панели
    let adminModal = document.getElementById('adminPanelModal');
    
    if (adminModal) {
        // Если модальное окно уже существует, просто показываем его
        adminModal.style.display = 'flex';
        return;
    }
    
    // Создаем новое модальное окно для админ-панели
    adminModal = document.createElement('div');
    adminModal.id = 'adminPanelModal';
    adminModal.className = 'modal';
    
    // Базовая структура модального окна
    adminModal.innerHTML = `
        <div class="modal-content admin-panel-content">
            <span class="close-btn">&times;</span>
            
            <div class="admin-panel-header">
                <h2><i class="fas fa-crown"></i> Панель администратора</h2>
                <div class="admin-panel-tabs">
                    <button class="admin-tab active" data-tab="users"><i class="fas fa-users"></i> Пользователи</button>
                    <button class="admin-tab" data-tab="stats"><i class="fas fa-chart-bar"></i> Статистика</button>
                    <button class="admin-tab" data-tab="settings"><i class="fas fa-cog"></i> Настройки</button>
                </div>
            </div>
            
            <div class="admin-panel-content-wrapper">
                <div class="admin-tab-content active" id="users-content">
                    <div class="admin-toolbar">
                        <div class="admin-search">
                            <input type="text" id="user-search" placeholder="Поиск пользователей..." />
                            <button class="search-btn"><i class="fas fa-search"></i></button>
                        </div>
                        <div class="admin-filters">
                            <select id="status-filter">
                                <option value="all">Все статусы</option>
                                <option value="user">Пользователи</option>
                                <option value="mangaka">Мангаки</option>
                                <option value="admin">Администраторы</option>
                            </select>
                            <select id="date-filter">
                                <option value="all">Все время</option>
                                <option value="today">Сегодня</option>
                                <option value="week">За неделю</option>
                                <option value="month">За месяц</option>
                                <option value="year">За год</option>
                            </select>
                            <select id="sort-users">
                                <option value="date-desc">Сначала новые</option>
                                <option value="date-asc">Сначала старые</option>
                                <option value="name-asc">По имени (А-Я)</option>
                                <option value="name-desc">По имени (Я-А)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="bulk-actions-container" class="bulk-actions-container" style="display: none;">
                        <div class="bulk-actions-info">
                            <span id="selection-info">Выбрано пользователей: 0</span>
                        </div>
                        <div class="bulk-actions-controls">
                            <select id="bulk-action">
                                <option value="">-- Выберите действие --</option>
                                <option value="status-user">Сделать обычными пользователями</option>
                                <option value="status-mangaka">Сделать мангаками</option>
                                <option value="status-admin">Сделать администраторами</option>
                                <option value="delete">Удалить выбранных</option>
                            </select>
                            <button id="apply-bulk-action" class="primary-button">Применить</button>
                        </div>
                    </div>
                    
                    <div class="users-table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th width="3%">
                                        <div class="user-checkbox">
                                            <input type="checkbox" id="select-all-users" />
                                            <label for="select-all-users"></label>
                                        </div>
                                    </th>
                                    <th width="4%">#</th>
                                    <th width="9%">Аватар</th>
                                    <th width="24%">Имя / Email</th>
                                    <th width="12%">Статус</th>
                                    <th width="15%">Дата регистрации</th>
                                    <th width="15%">Активность</th>
                                    <th width="8%">Действия</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                <tr class="loading-row">
                                    <td colspan="8">
                                        <div class="loading-spinner">
                                            <i class="fas fa-spinner fa-spin"></i> Загрузка пользователей...
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="admin-table-footer">
                        <div class="records-info" id="records-info">
                            Показано 0 из 0 пользователей
                        </div>
                        <div class="admin-pagination">
                            <button class="pagination-btn" id="prev-page" disabled><i class="fas fa-chevron-left"></i></button>
                            <select id="page-selector" class="page-selector">
                                <option value="1">Страница 1</option>
                            </select>
                            <span class="pagination-info">из <span id="total-pages">1</span></span>
                            <button class="pagination-btn" id="next-page" disabled><i class="fas fa-chevron-right"></i></button>
                        </div>
                        <div class="page-size-selector">
                            <label for="page-size">Показывать по:</label>
                            <select id="page-size">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                        <span id="current-page" style="display: none;">1</span>
                    </div>
                </div>
                
                <div class="admin-tab-content" id="stats-content">
                    <div class="stats-container">
                        <div class="stats-card">
                            <div class="stats-icon"><i class="fas fa-users"></i></div>
                            <div class="stats-info">
                                <h3>Всего пользователей</h3>
                                <div class="stats-value" id="total-users">--</div>
                            </div>
                        </div>
                        
                        <div class="stats-card">
                            <div class="stats-icon"><i class="fas fa-user"></i></div>
                            <div class="stats-info">
                                <h3>Обычных пользователей</h3>
                                <div class="stats-value" id="regular-users">--</div>
                            </div>
                        </div>
                        
                        <div class="stats-card">
                            <div class="stats-icon"><i class="fas fa-paint-brush"></i></div>
                            <div class="stats-info">
                                <h3>Мангак</h3>
                                <div class="stats-value" id="mangaka-users">--</div>
                            </div>
                        </div>
                        
                        <div class="stats-card">
                            <div class="stats-icon"><i class="fas fa-crown"></i></div>
                            <div class="stats-info">
                                <h3>Администраторов</h3>
                                <div class="stats-value" id="admin-users">--</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-charts">
                        <div class="stats-chart-container">
                            <h3><i class="fas fa-chart-line"></i> Регистрации по дням</h3>
                            <div class="chart-placeholder">
                                <i class="fas fa-chart-line"></i>
                                <p>Здесь будет график регистраций</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tab-content" id="settings-content">
                    <div class="settings-container">
                        <h3><i class="fas fa-cog"></i> Настройки сайта</h3>
                        <p>Раздел находится в разработке</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в DOM
    document.body.appendChild(adminModal);
    
    // Показываем модальное окно
    adminModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Загружаем данные пользователей
    loadUsersList();
    
    // Добавляем обработчик для закрытия
    const closeBtn = adminModal.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        adminModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });
    
    // Добавляем обработчики для переключения вкладок
    const tabs = adminModal.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Удаляем активный класс у всех вкладок и их содержимого
            tabs.forEach(t => t.classList.remove('active'));
            adminModal.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            // Добавляем активный класс выбранной вкладке и её содержимому
            this.classList.add('active');
            
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-content`).classList.add('active');
            
            // Если выбрана вкладка пользователей, обновляем список
            if (tabName === 'users') {
                loadUsersList();
            }
            
            // Если выбрана вкладка статистики, загружаем статистику
            if (tabName === 'stats') {
                loadStatistics();
            }
        });
    });
    
    // Добавляем обработчик для поиска
    const searchInput = adminModal.querySelector('#user-search');
    const searchBtn = adminModal.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        // По клику на кнопку поиска
        searchBtn.addEventListener('click', function() {
            loadUsersList();
        });
        
        // По нажатию Enter в поле поиска
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadUsersList();
            }
        });
    }
    
    // Добавляем обработчики для фильтров
    const statusFilter = adminModal.querySelector('#status-filter');
    const dateFilter = adminModal.querySelector('#date-filter');
    const sortUsers = adminModal.querySelector('#sort-users');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            // Сбрасываем номер страницы при изменении фильтра
            document.getElementById('current-page').textContent = '1';
            loadUsersList();
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            // Сбрасываем номер страницы при изменении фильтра
            document.getElementById('current-page').textContent = '1';
            loadUsersList();
        });
    }
    
    if (sortUsers) {
        sortUsers.addEventListener('change', function() {
            loadUsersList();
        });
    }
    
    // Добавляем обработчик для выбора размера страницы
    const pageSizeSelector = adminModal.querySelector('#page-size');
    if (pageSizeSelector) {
        pageSizeSelector.addEventListener('change', function() {
            // Сбрасываем номер страницы при изменении размера страницы
            document.getElementById('current-page').textContent = '1';
            loadUsersList();
        });
    }
    
    // Добавляем обработчик для выбора страницы
    const pageSelector = adminModal.querySelector('#page-selector');
    if (pageSelector) {
        pageSelector.addEventListener('change', function() {
            document.getElementById('current-page').textContent = this.value;
            loadUsersList();
        });
    }
    
    // Добавляем обработчики для пагинации
    const prevPageBtn = adminModal.querySelector('#prev-page');
    const nextPageBtn = adminModal.querySelector('#next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            const currentPage = parseInt(document.getElementById('current-page').textContent);
            if (currentPage > 1) {
                document.getElementById('current-page').textContent = currentPage - 1;
                loadUsersList();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const currentPage = parseInt(document.getElementById('current-page').textContent);
            const totalPages = parseInt(document.getElementById('total-pages').textContent);
            if (currentPage < totalPages) {
                document.getElementById('current-page').textContent = currentPage + 1;
                loadUsersList();
            }
        });
    }
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === adminModal) {
            adminModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });
}

// Функция для загрузки списка пользователей
function loadUsersList() {
    const tableBody = document.getElementById('users-table-body');
    
    if (!tableBody) return;
    
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.status !== 'admin') {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>У вас недостаточно прав для просмотра этого раздела</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Показываем индикатор загрузки
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="8">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Загрузка пользователей...
                </div>
            </td>
        </tr>
    `;
    
    // Получаем параметры фильтрации и сортировки
    const searchQuery = document.getElementById('user-search')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const dateFilter = document.getElementById('date-filter')?.value || 'all';
    const sortOrder = document.getElementById('sort-users')?.value || 'date-desc';
    const currentPage = parseInt(document.getElementById('current-page')?.textContent) || 1;
    const pageSize = parseInt(document.getElementById('page-size')?.value) || 10;
    
    // Отправляем запрос на сервер
    fetch('/api/admin/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            currentUser: currentUser,
            search: searchQuery,
            status: statusFilter,
            dateRange: dateFilter,
            sort: sortOrder,
            page: currentPage,
            limit: pageSize
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Обновляем информацию о количестве записей
            const recordsInfo = document.getElementById('records-info');
            if (recordsInfo) {
                recordsInfo.textContent = `Показано ${data.users.length} из ${data.totalUsers} пользователей`;
            }
            
            // Обновляем информацию о пагинации
            document.getElementById('total-pages').textContent = data.totalPages || 1;
            
            // Включаем/выключаем кнопки пагинации
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= (data.totalPages || 1);
            
            // Обновляем выбор страницы в селекторе, если он существует
            const pageSelector = document.getElementById('page-selector');
            if (pageSelector) {
                // Очищаем текущие опции
                pageSelector.innerHTML = '';
                
                // Добавляем опции для всех страниц
                for (let i = 1; i <= data.totalPages; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `Страница ${i}`;
                    option.selected = i === currentPage;
                    pageSelector.appendChild(option);
                }
            }
            
            // Если пользователи найдены
            if (data.users && data.users.length > 0) {
                // Очищаем таблицу и добавляем пользователей
                tableBody.innerHTML = '';
                
                data.users.forEach((user, index) => {
                    // Форматируем дату регистрации
                    const createdDate = new Date(user.createdAt);
                    const formattedDate = createdDate.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    
                    // Формируем дату в формате для сортировки
                    const dateForSorting = createdDate.toISOString();
                    
                    // Определяем стиль для отображения статуса
                    let statusClass = '';
                    let statusIcon = '';
                    let statusText = 'Пользователь';
                    
                    if (user.status === 'admin') {
                        statusClass = 'admin-status';
                        statusIcon = 'fa-crown';
                        statusText = 'Администратор';
                    } else if (user.status === 'mangaka') {
                        statusClass = 'mangaka-status';
                        statusIcon = 'fa-paint-brush';
                        statusText = 'Мангака';
                    } else {
                        statusClass = 'user-status';
                        statusIcon = 'fa-user';
                    }
                    
                    // Создаем строку таблицы
                    const row = document.createElement('tr');
                    row.dataset.username = user.username;
                    row.dataset.date = dateForSorting;
                    row.dataset.status = user.status;
                    
                    // Добавляем возможность выделить строку
                    row.addEventListener('click', function(e) {
                        // Если клик был на чекбоксе или кнопке действия, не выделяем строку
                        if (e.target.closest('.user-checkbox') || e.target.closest('.action-btn')) {
                            return;
                        }
                        
                        // Переключаем класс выделения
                        this.classList.toggle('selected-row');
                        
                        // Обновляем состояние чекбокса
                        const checkbox = this.querySelector('.user-checkbox input');
                        checkbox.checked = this.classList.contains('selected-row');
                        
                        // Обновляем счетчик выбранных пользователей
                        updateSelectedUsersCount();
                    });
                    
                    row.innerHTML = `
                        <td class="checkbox-cell">
                            <div class="user-checkbox">
                                <input type="checkbox" id="user-${user.username}" name="selected-users[]" value="${user.username}" />
                                <label for="user-${user.username}"></label>
                            </div>
                        </td>
                        <td>${(currentPage - 1) * pageSize + index + 1}</td>
                        <td class="user-avatar-cell">
                            ${user.profile.avatar 
                                ? `<img src="${user.profile.avatar}" alt="${user.username}" class="user-table-avatar" />`
                                : `<div class="avatar-placeholder table-avatar">${user.username.charAt(0).toUpperCase()}</div>`
                            }
                        </td>
                        <td>
                            <div class="user-info">
                                <div class="username">${user.username}</div>
                                <div class="user-email">${user.email}</div>
                            </div>
                        </td>
                        <td>
                            <span class="status-badge table-status ${statusClass}">
                                <i class="fas ${statusIcon}"></i> ${statusText}
                            </span>
                        </td>
                        <td data-sort="${dateForSorting}">${formattedDate}</td>
                        <td class="stat-cell">
                            <div class="user-stats">
                                <div class="stat-item">
                                    <i class="fas fa-bookmark" title="Закладки"></i>
                                    <span>${user.bookmarks ? user.bookmarks.length : 0}</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-book-reader" title="Прочитано"></i>
                                    <span>${user.read ? user.read.length : 0}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="table-actions">
                                <button class="action-btn edit-user" data-username="${user.username}" title="Редактировать">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-user" data-username="${user.username}" title="Удалить">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    // Добавляем строку в таблицу
                    tableBody.appendChild(row);
                    
                    // Добавляем обработчик для чекбокса отдельно
                    const checkbox = row.querySelector('.user-checkbox input');
                    checkbox.addEventListener('change', function() {
                        // Обновляем класс строки
                        if (this.checked) {
                            row.classList.add('selected-row');
                        } else {
                            row.classList.remove('selected-row');
                        }
                        
                        // Обновляем счетчик выбранных пользователей
                        updateSelectedUsersCount();
                    });
                });
                
                // Добавляем обработчики для кнопок действий
                setupUserActionButtons();
                
                // Обновляем счетчик выбранных пользователей
                updateSelectedUsersCount();
                
                // Инициализируем массовые действия
                setupBulkActions();
            } else {
                // Если пользователи не найдены
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="no-results">
                            <i class="fas fa-search"></i>
                            <p>По вашему запросу ничего не найдено</p>
                        </td>
                    </tr>
                `;
                
                // Сбрасываем счетчик выбранных пользователей
                updateSelectedUsersCount(0);
            }
        } else {
            // В случае ошибки
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>${data.message || 'Произошла ошибка при загрузке данных'}</p>
                    </td>
                </tr>
            `;
            
            // Сбрасываем счетчик выбранных пользователей
            updateSelectedUsersCount(0);
        }
    })
    .catch(error => {
        console.error('Ошибка при загрузке списка пользователей:', error);
        
        // В случае ошибки соединения
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Произошла ошибка при загрузке данных</p>
                </td>
            </tr>
        `;
        
        // Сбрасываем счетчик выбранных пользователей
        updateSelectedUsersCount(0);
    });
}

// Функция для обновления счетчика выбранных пользователей
function updateSelectedUsersCount() {
    const selectedUsers = document.querySelectorAll('.users-table tbody tr.selected-row').length;
    const selectionInfo = document.getElementById('selection-info');
    const bulkActionsContainer = document.getElementById('bulk-actions-container');
    
    if (selectionInfo) {
        selectionInfo.textContent = selectedUsers > 0 
            ? `Выбрано пользователей: ${selectedUsers}` 
            : '';
    }
    
    // Показываем/скрываем контейнер массовых действий
    if (bulkActionsContainer) {
        bulkActionsContainer.style.display = selectedUsers > 0 ? 'flex' : 'none';
    }
    
    // Обновляем состояние чекбокса "Выбрать все"
    const selectAllCheckbox = document.getElementById('select-all-users');
    const totalRows = document.querySelectorAll('.users-table tbody tr').length;
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedUsers > 0 && selectedUsers === totalRows;
        selectAllCheckbox.indeterminate = selectedUsers > 0 && selectedUsers < totalRows;
    }
}

// Функция для настройки массовых действий
function setupBulkActions() {
    // Обработчик для выбора всех пользователей
    const selectAllCheckbox = document.getElementById('select-all-users');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.users-table tbody tr .user-checkbox input');
            const isChecked = this.checked;
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
                
                // Обновляем класс строки
                const row = checkbox.closest('tr');
                if (isChecked) {
                    row.classList.add('selected-row');
                } else {
                    row.classList.remove('selected-row');
                }
            });
            
            // Обновляем счетчик выбранных пользователей
            updateSelectedUsersCount();
        });
    }
    
    // Обработчик для применения массового действия
    const applyBulkActionBtn = document.getElementById('apply-bulk-action');
    if (applyBulkActionBtn) {
        applyBulkActionBtn.addEventListener('click', function() {
            const action = document.getElementById('bulk-action').value;
            const selectedUsernames = Array.from(
                document.querySelectorAll('.users-table tbody tr.selected-row')
            ).map(row => row.dataset.username);
            
            if (selectedUsernames.length === 0) {
                showNotification('Не выбрано ни одного пользователя', 'error');
                return;
            }
            
            // Выполняем выбранное действие
            switch (action) {
                case 'delete':
                    confirmBulkDelete(selectedUsernames);
                    break;
                    
                case 'status-user':
                    bulkChangeStatus(selectedUsernames, 'user');
                    break;
                    
                case 'status-mangaka':
                    bulkChangeStatus(selectedUsernames, 'mangaka');
                    break;
                    
                case 'status-admin':
                    confirmMakeAdmin(selectedUsernames);
                    break;
                
                default:
                    showNotification('Выберите действие', 'error');
                    break;
            }
        });
    }
}

// Функция для подтверждения массового удаления
function confirmBulkDelete(usernames) {
    if (!confirm(`Вы действительно хотите удалить ${usernames.length} пользователей?`)) {
        return;
    }
    
    bulkDeleteUsers(usernames);
}

// Функция для подтверждения назначения администраторов
function confirmMakeAdmin(usernames) {
    if (!confirm(`Вы действительно хотите сделать администраторами ${usernames.length} пользователей?`)) {
        return;
    }
    
    bulkChangeStatus(usernames, 'admin');
}

// Функция для массового удаления пользователей
function bulkDeleteUsers(usernames) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.status !== 'admin') {
        showNotification('У вас недостаточно прав для удаления пользователей', 'error');
        return;
    }
    
    // Проверяем, не пытается ли администратор удалить сам себя
    if (usernames.includes(currentUser.username)) {
        showNotification('Вы не можете удалить свою учетную запись', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const bulkActionBtn = document.getElementById('apply-bulk-action');
    if (bulkActionBtn) {
        bulkActionBtn.disabled = true;
        bulkActionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Удаление...';
    }
    
    // Отправляем запрос на сервер
    fetch('/api/admin/bulk-delete-users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            adminUsername: currentUser.username,
            usernames: usernames
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Успешно удалено пользователей: ${data.deletedCount}`, 'success');
            
            // Обновляем список пользователей
            loadUsersList();
            
            // Обновляем статистику
            loadStatistics();
        } else {
            showNotification(data.message || 'Не удалось удалить пользователей', 'error');
        }
        
        // Восстанавливаем кнопку
        if (bulkActionBtn) {
            bulkActionBtn.disabled = false;
            bulkActionBtn.innerHTML = 'Применить';
        }
    })
    .catch(error => {
        console.error('Ошибка при удалении пользователей:', error);
        showNotification('Произошла ошибка при удалении пользователей', 'error');
        
        // Восстанавливаем кнопку
        if (bulkActionBtn) {
            bulkActionBtn.disabled = false;
            bulkActionBtn.innerHTML = 'Применить';
        }
    });
}

// Функция для массового изменения статуса пользователей
function bulkChangeStatus(usernames, status) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.status !== 'admin') {
        showNotification('У вас недостаточно прав для изменения статуса пользователей', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const bulkActionBtn = document.getElementById('apply-bulk-action');
    if (bulkActionBtn) {
        bulkActionBtn.disabled = true;
        bulkActionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Применение...';
    }
    
    // Отправляем запрос на сервер
    fetch('/api/admin/bulk-update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            adminUsername: currentUser.username,
            usernames: usernames,
            status: status
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let statusText = 'пользователи';
            if (status === 'admin') statusText = 'администраторы';
            else if (status === 'mangaka') statusText = 'мангаки';
            
            showNotification(`Статус успешно изменен для ${data.updatedCount} пользователей`, 'success');
            
            // Обновляем список пользователей
            loadUsersList();
            
            // Обновляем статистику
            loadStatistics();
        } else {
            showNotification(data.message || 'Не удалось изменить статус пользователей', 'error');
        }
        
        // Восстанавливаем кнопку
        if (bulkActionBtn) {
            bulkActionBtn.disabled = false;
            bulkActionBtn.innerHTML = 'Применить';
        }
    })
    .catch(error => {
        console.error('Ошибка при изменении статуса пользователей:', error);
        showNotification('Произошла ошибка при изменении статуса пользователей', 'error');
        
        // Восстанавливаем кнопку
        if (bulkActionBtn) {
            bulkActionBtn.disabled = false;
            bulkActionBtn.innerHTML = 'Применить';
        }
    });
}

// Функция для загрузки статистики
function loadStatistics() {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.status !== 'admin') {
        showNotification('У вас недостаточно прав для просмотра статистики', 'error');
        return;
    }
    
    // Отправляем запрос на сервер
    fetch(`/api/admin/statistics?username=${currentUser.username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем значения в карточках статистики
                document.getElementById('total-users').textContent = data.totalUsers || 0;
                document.getElementById('regular-users').textContent = data.regularUsers || 0;
                document.getElementById('mangaka-users').textContent = data.mangakaUsers || 0;
                document.getElementById('admin-users').textContent = data.adminUsers || 0;
                
                // Здесь можно добавить код для отображения графиков
            } else {
                showNotification(data.message || 'Не удалось загрузить статистику', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке статистики:', error);
            showNotification('Произошла ошибка при загрузке статистики', 'error');
        });
}

// Функция для настройки обработчиков кнопок действий с пользователями
function setupUserActionButtons() {
    // Кнопки редактирования пользователя
    const editButtons = document.querySelectorAll('.edit-user');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            editUser(username);
        });
    });
    
    // Кнопки удаления пользователя
    const deleteButtons = document.querySelectorAll('.delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            deleteUser(username);
        });
    });
}

// Функция для редактирования пользователя
function editUser(username) {
    // Получаем текущего пользователя (администратора)
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.status !== 'admin') {
        showNotification('У вас недостаточно прав для редактирования пользователей', 'error');
        return;
    }
    
    // Получаем данные пользователя
    fetch(`/api/admin/user/${username}?admin=${currentUser.username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showUserEditModal(data.user);
            } else {
                showNotification(data.message || 'Не удалось получить данные пользователя', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при получении данных пользователя:', error);
            showNotification('Произошла ошибка при получении данных пользователя', 'error');
        });
}

// Функция для отображения модального окна редактирования пользователя
function showUserEditModal(user) {
    // Проверяем, есть ли уже открытое окно редактирования
    let editModal = document.getElementById('userEditModal');
    
    if (editModal) {
        // Удаляем существующее модальное окно
        editModal.remove();
    }
    
    // Создаем новое модальное окно
    editModal = document.createElement('div');
    editModal.id = 'userEditModal';
    editModal.className = 'modal';
    
    // Содержимое модального окна
    editModal.innerHTML = `
        <div class="modal-content user-edit-content">
            <span class="close-btn">&times;</span>
            <h2><i class="fas fa-user-edit"></i> Редактирование пользователя</h2>
            
            <div class="user-edit-header">
                <div class="user-edit-avatar">
                    ${user.profile.avatar 
                        ? `<img src="${user.profile.avatar}" alt="${user.username}" />`
                        : `<div class="avatar-placeholder">${user.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="user-edit-info">
                    <h3>${user.username}</h3>
                    <p>${user.email}</p>
                </div>
            </div>
            
            <form id="user-edit-form">
                <input type="hidden" id="edit-username" value="${user.username}" />
                
                <div class="form-group">
                    <label for="edit-status">Статус пользователя:</label>
                    <select id="edit-status" class="form-control">
                        <option value="user" ${user.status === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="mangaka" ${user.status === 'mangaka' ? 'selected' : ''}>Мангака</option>
                        <option value="admin" ${user.status === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" id="save-user-button" class="primary-button">Сохранить изменения</button>
                    <button type="button" id="cancel-edit-button" class="secondary-button">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    // Добавляем модальное окно в DOM
    document.body.appendChild(editModal);
    
    // Показываем модальное окно
    editModal.style.display = 'flex';
    
    // Добавляем обработчик для закрытия
    const closeBtn = editModal.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
        editModal.remove();
    });
    
    // Добавляем обработчик для кнопки отмены
    const cancelButton = editModal.querySelector('#cancel-edit-button');
    cancelButton.addEventListener('click', function() {
        editModal.style.display = 'none';
        editModal.remove();
    });
    
    // Добавляем обработчик для кнопки сохранения
    const saveButton = editModal.querySelector('#save-user-button');
    saveButton.addEventListener('click', function() {
        const username = document.getElementById('edit-username').value;
        const newStatus = document.getElementById('edit-status').value;
        
        // Получаем данные текущего пользователя (администратора)
        const currentUser = getCurrentUser();
        
        if (!currentUser || currentUser.status !== 'admin') {
            showNotification('У вас недостаточно прав для обновления статуса пользователя', 'error');
            editModal.style.display = 'none';
            editModal.remove();
            return;
        }
        
        // Отправляем запрос на сервер
        fetch('/api/admin/update-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminUsername: currentUser.username,
                username: username,
                status: newStatus
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Данные пользователя успешно обновлены', 'success');
                
                // Закрываем модальное окно
                editModal.style.display = 'none';
                editModal.remove();
                
                // Обновляем список пользователей
                loadUsersList();
            } else {
                showNotification(data.message || 'Не удалось обновить данные пользователя', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при обновлении данных пользователя:', error);
            showNotification('Произошла ошибка при обновлении данных пользователя', 'error');
        });
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
            editModal.remove();
        }
    });
}

// Функция для удаления пользователя
function deleteUser(username) {
    // Получаем текущего пользователя (администратора)
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.status !== 'admin') {
        showNotification('У вас недостаточно прав для удаления пользователей', 'error');
        return;
    }
    
    // Проверяем, что администратор не пытается удалить сам себя
    if (currentUser.username === username) {
        showNotification('Вы не можете удалить свою учетную запись', 'error');
        return;
    }
    
    // Подтверждение удаления
    if (!confirm(`Вы действительно хотите удалить пользователя ${username}?`)) {
        return;
    }
    
    // Отправляем запрос на сервер
    fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            adminUsername: currentUser.username,
            username 
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Пользователь успешно удален', 'success');
            
            // Обновляем список пользователей
            loadUsersList();
            
            // Обновляем статистику
            loadStatistics();
        } else {
            showNotification(data.message || 'Не удалось удалить пользователя', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка при удалении пользователя:', error);
        showNotification('Произошла ошибка при удалении пользователя', 'error');
    });
}

// Функция для отображения формы добавления манги
function showAddMangaForm() {
    // Проверяем, открыта ли уже модалка
    if (document.getElementById('addMangaModal')) {
        return;
    }
    
    // Получаем текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Необходимо авторизоваться', 'error');
        return;
    }
    
    // Проверяем, имеет ли пользователь необходимые права
    if (currentUser.status !== 'admin' && currentUser.status !== 'mangaka') {
        showNotification('У вас недостаточно прав для добавления манги', 'error');
        return;
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.id = 'addMangaModal';
    modal.className = 'modal';
    modal.style.display = 'flex'; // Используем flex для центрирования
    
    // Создаем содержимое модального окна
    modal.innerHTML = `
        <div class="add-manga-content">
            <div class="add-manga-header">
                <h2><i class="fas fa-book-open"></i> Добавление новой манги</h2>
                <p>Заполните все поля для добавления манги</p>
                <span class="close-btn" onclick="closeAddMangaModal()">&times;</span>
            </div>
            <form id="addMangaForm" class="add-manga-form">
                <div class="manga-form-section">
                    <div class="form-group">
                        <label for="title">Название манги <span class="required">*</span></label>
                        <input type="text" id="title" name="title" placeholder="Введите название манги" required>
                    </div>
                    <div class="form-group">
                        <label for="description">Описание <span class="required">*</span></label>
                        <textarea id="description" name="description" placeholder="Введите описание манги" rows="5" required></textarea>
                    </div>
                </div>
                
                <div class="manga-form-section">
                    <div class="manga-genres">
                        <label>Жанры <span class="required">*</span></label>
                        <div class="genres-grid">
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-fantasy" name="genres" value="Fantasy">
                                <label for="genre-fantasy">Фэнтези</label>
                            </div>
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-romance" name="genres" value="Romance">
                                <label for="genre-romance">Романтика</label>
                            </div>
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-isekai" name="genres" value="Isekai">
                                <label for="genre-isekai">Исекай</label>
                            </div>
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-detective" name="genres" value="Detective">
                                <label for="genre-detective">Детектив</label>
                            </div>
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-action" name="genres" value="Action">
                                <label for="genre-action">Экшн</label>
                            </div>
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-adventure" name="genres" value="Adventure">
                                <label for="genre-adventure">Приключения</label>
                            </div>
                            <div class="genre-checkbox">
                                <input type="checkbox" id="genre-sport" name="genres" value="Sport">
                                <label for="genre-sport">Спорт</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group rating-selector">
                        <label for="rating">Рейтинг <span class="required">*</span></label>
                        <select id="rating" name="rating" required>
                            <option value="">Выберите рейтинг</option>
                            <option value="5.0">5.0 - Шедевр</option>
                            <option value="4.5">4.5 - Отлично</option>
                            <option value="4.0">4.0 - Очень хорошо</option>
                            <option value="3.5">3.5 - Хорошо</option>
                            <option value="3.0">3.0 - Нормально</option>
                            <option value="2.5">2.5 - Ниже среднего</option>
                            <option value="2.0">2.0 - Плохо</option>
                            <option value="1.5">1.5 - Очень плохо</option>
                            <option value="1.0">1.0 - Ужасно</option>
                        </select>
                    </div>
                </div>
                
                <div class="manga-form-section">
                    <div class="manga-cover-upload">
                        <label for="cover">Обложка <span class="required">*</span></label>
                        <div class="cover-preview">
                            <div class="cover-placeholder" id="coverPlaceholder">
                                <i class="fas fa-image"></i>
                                <p>Выберите изображение для обложки</p>
                            </div>
                            <div class="cover-preview-image" id="coverPreview" style="display: none;">
                                <img id="previewImage" src="" alt="Предпросмотр обложки">
                            </div>
                        </div>
                        <div class="cover-upload-controls">
                            <input type="file" id="cover" name="cover" accept="image/*">
                            <p class="file-restrictions">Допустимые форматы: JPG, JPEG, PNG. Максимальный размер: 5 МБ</p>
                            <div id="coverProgressBar" class="progress-bar-container" style="display: none;">
                                <div class="progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="mangaFormMessage" class="manga-form-message" style="display: none;"></div>
                
                <div class="manga-form-actions">
                    <button type="submit" id="submitMangaBtn" class="primary-button">
                        <i class="fas fa-plus"></i> Добавить мангу
                    </button>
                    <button type="button" class="secondary-button" onclick="closeAddMangaModal()">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Добавляем модальное окно на страницу
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    // Добавляем обработчик отправки формы
    const form = document.getElementById('addMangaForm');
    if (form) {
        form.addEventListener('submit', handleAddManga);
    }
    
    // Добавляем обработчик для предпросмотра изображения
    const coverInput = document.getElementById('cover');
    if (coverInput) {
        coverInput.addEventListener('change', function() {
            const file = this.files[0];
            const coverPlaceholder = document.getElementById('coverPlaceholder');
            const coverPreview = document.getElementById('coverPreview');
            const previewImage = document.getElementById('previewImage');
            const formMessage = document.getElementById('mangaFormMessage');
            
            // Сбрасываем предыдущие сообщения об ошибках
            formMessage.style.display = 'none';
            
            // Проверяем, выбран ли файл
            if (!file) {
                coverPlaceholder.style.display = 'flex';
                coverPreview.style.display = 'none';
                return;
            }
            
            // Проверяем тип файла
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                showMangaFormMessage('Неподдерживаемый формат файла. Допустимые форматы: JPG, JPEG, PNG.', 'error');
                coverPlaceholder.style.display = 'flex';
                coverPreview.style.display = 'none';
                return;
            }
            
            // Проверяем размер файла (максимум 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB в байтах
            if (file.size > maxSize) {
                showMangaFormMessage('Размер файла превышает допустимый предел в 5 МБ.', 'error');
                coverPlaceholder.style.display = 'flex';
                coverPreview.style.display = 'none';
                return;
            }
            
            // Создаем объект URL для предпросмотра
            const objectUrl = URL.createObjectURL(file);
            previewImage.src = objectUrl;
            
            // Показываем предпросмотр и скрываем плейсхолдер
            coverPlaceholder.style.display = 'none';
            coverPreview.style.display = 'block';
            
            // Загружаем изображение, чтобы проверить его загрузку
            const img = new Image();
            img.onload = function() {
                // Изображение успешно загружено
                URL.revokeObjectURL(objectUrl); // Освобождаем ресурс
            };
            img.onerror = function() {
                // Ошибка загрузки изображения
                URL.revokeObjectURL(objectUrl); // Освобождаем ресурс
                showMangaFormMessage('Не удалось загрузить изображение. Выберите другой файл.', 'error');
                coverPlaceholder.style.display = 'flex';
                coverPreview.style.display = 'none';
            };
            img.src = objectUrl;
        });
    }
}

// Функция для закрытия модального окна добавления манги
function closeAddMangaModal() {
    const addMangaModal = document.getElementById('addMangaModal');
    if (addMangaModal) {
        addMangaModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.removeChild(addMangaModal);
    }
}

// Функция для генерации уникального ID манги
function generateMangaId() {
    let id = '';
    for (let i = 0; i < 11; i++) {
        id += Math.floor(Math.random() * 10).toString();
    }
    return id;
}

// Функция для обработки добавления манги
async function handleAddManga(e) {
    e.preventDefault();
    
    // Получаем данные текущего пользователя
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('Необходимо авторизоваться', 'error');
        return;
    }
    
    // Проверяем, имеет ли пользователь необходимые права
    if (currentUser.status !== 'admin' && currentUser.status !== 'mangaka') {
        showNotification('У вас недостаточно прав для добавления манги', 'error');
        return;
    }
    
    // Получаем данные из формы
    const form = e.target;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const ratingSelect = form.rating;
    const rating = ratingSelect.value;
    
    // Получаем выбранные жанры
    const genreCheckboxes = form.querySelectorAll('input[name="genres"]:checked');
    const genres = Array.from(genreCheckboxes).map(checkbox => checkbox.value);
    
    // Проверяем, что все необходимые поля заполнены
    if (!title) {
        showMangaFormMessage('Введите название манги', 'error');
        return;
    }
    
    if (!description) {
        showMangaFormMessage('Введите описание манги', 'error');
        return;
    }
    
    if (genres.length === 0) {
        showMangaFormMessage('Выберите хотя бы один жанр', 'error');
        return;
    }
    
    if (!rating) {
        showMangaFormMessage('Выберите оценку', 'error');
        return;
    }
    
    // Проверяем, что выбрано изображение
    const coverFile = form.cover.files[0];
    if (!coverFile) {
        showMangaFormMessage('Выберите изображение для обложки', 'error');
        return;
    }
    
    // Генерируем уникальный ID для манги
    const mangaId = generateMangaId();
    
    // Отображаем индикатор загрузки
    const submitBtn = form.querySelector('#submitMangaBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Добавление...';
    
    // Показываем прогресс-бар
    const progressBar = document.getElementById('coverProgressBar');
    const progressBarFill = progressBar.querySelector('.progress-bar');
    progressBar.style.display = 'block';
    
    try {
        // Загружаем изображение
        const formData = new FormData();
        formData.append('cover', coverFile);
        formData.append('mangaId', mangaId);
        
        // Отправляем запрос на загрузку изображения
        const uploadResponse = await fetch('/api/manga/upload-cover', {
            method: 'POST',
            body: formData
        });
        
        // Получаем ответ в виде текста для полной диагностики
        const responseText = await uploadResponse.text();
        console.log('Статус ответа сервера при загрузке обложки:', uploadResponse.status);
        console.log('Заголовки ответа:', Array.from(uploadResponse.headers.entries()));
        console.log('URL ответа:', uploadResponse.url);
        console.log('Текст ответа при загрузке обложки:', responseText);
        
        // Пытаемся распарсить текст как JSON
        let uploadResponseData;
        try {
            uploadResponseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Ошибка при парсинге ответа:', parseError);
            console.error('Текст ответа:', responseText);
            console.error('Статус запроса:', uploadResponse.status);
            throw new Error(`Сервер вернул некорректный ответ при загрузке обложки. Проверьте директорию загрузки и эндпоинт /api/manga/upload-cover: ${responseText.substring(0, 150)}...`);
        }
        
        // Проверяем ответ
        if (!uploadResponse.ok || !uploadResponseData.success) {
            console.error('Детали ошибки загрузки:', uploadResponseData);
            throw new Error(uploadResponseData.message || `Ошибка при загрузке изображения. Статус: ${uploadResponse.status}`);
        }
        
        // Если изображение успешно загружено, отправляем данные манги
        const mangaData = {
            id: mangaId,
            title: title,
            description: description,
            genres: genres,
            rating: parseFloat(rating),
            coverUrl: uploadResponseData.coverUrl,
            createdBy: currentUser.username,
            createdAt: new Date().toISOString()
        };
        
        // Отправляем данные о манге на сервер
        const mangaResponse = await fetch('/api/manga/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentUser: currentUser,
                manga: mangaData
            })
        });
        
        // Получаем ответ в виде текста для полной диагностики
        const mangaResponseText = await mangaResponse.text();
        console.log('Ответ сервера при добавлении манги (текст):', mangaResponseText);
        
        // Пытаемся распарсить текст как JSON
        let responseData;
        try {
            responseData = JSON.parse(mangaResponseText);
        } catch (parseError) {
            console.error('Ошибка при парсинге ответа:', parseError);
            console.error('Текст ответа:', mangaResponseText);
            throw new Error(`Сервер вернул некорректный ответ при сохранении манги: ${mangaResponseText.substring(0, 100)}...`);
        }
        
        // Проверяем ответ с сервера
        if (!mangaResponse.ok) {
            throw new Error(responseData?.message || 'Ошибка при сохранении данных манги');
        }
        
        if (responseData.success) {
            // Показываем сообщение об успехе
            showNotification('Манга успешно добавлена', 'success');
            
            // Закрываем модальное окно
            closeAddMangaModal();
        } else {
            // Показываем сообщение об ошибке
            showMangaFormMessage(responseData.message || 'Ошибка при добавлении манги', 'error');
        }
    } catch (error) {
        console.error('Ошибка при добавлении манги:', error);
        showMangaFormMessage(`Произошла ошибка: ${error.message}`, 'error');
    } finally {
        // Восстанавливаем состояние кнопки
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Скрываем прогресс-бар
        progressBar.style.display = 'none';
        progressBarFill.style.width = '0%';
    }
}

// Функция для отображения сообщения в форме
function showMangaFormMessage(message, type) {
    const messageElement = document.getElementById('mangaFormMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `manga-form-message ${type}`;
        messageElement.style.display = 'block';
        
        // Автоматически скрываем сообщение через некоторое время
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Функция для загрузки и отображения последних манг
async function loadLatestManga() {
    try {
        // Показываем индикатор загрузки
        const newMangaContainer = document.getElementById('latest-manga-grid');
        if (!newMangaContainer) return;
        
        newMangaContainer.innerHTML = `
            <div class="latest-manga-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Загрузка новинок...</p>
            </div>
        `;
        
        // Запрос на сервер для получения последних 10 манг
        const response = await fetch('/api/manga/latest', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить последние манги');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Ошибка при получении данных');
        }
        
        // Очищаем контейнер
        newMangaContainer.innerHTML = '';
        
        // Проверяем, есть ли манги для отображения
        if (!data.manga || data.manga.length === 0) {
            newMangaContainer.innerHTML = `
                <div class="latest-manga-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Пока нет доступных новинок.</p>
                </div>
            `;
            return;
        }
        
        // Добавляем каждую мангу в контейнер
        data.manga.forEach(manga => {
            const mangaElement = document.createElement('div');
            mangaElement.className = 'latest-manga-item';
            
            // Определяем классы для звезд на основе рейтинга
            const fullStars = Math.floor(manga.rating);
            const halfStar = manga.rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
            
            // Создаем звезды рейтинга
            let starsHTML = '';
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '<i class="fas fa-star"></i>';
            }
            if (halfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHTML += '<i class="far fa-star"></i>';
            }
            
            // Проверяем URL обложки и определяем, локальная она или внешняя
            let coverUrl = manga.coverUrl;
            if (coverUrl && !coverUrl.startsWith('http')) {
                // Это локальная обложка, добавляем базовый URL сайта
                if (!coverUrl.startsWith('/')) {
                    coverUrl = '/' + coverUrl;
                }
            }
            
            // Формируем HTML для элемента манги
            mangaElement.innerHTML = `
                <div class="manga-cover">
                    <img src="${coverUrl}" alt="${manga.title}" onerror="this.src='/database/manga/covers/placeholder.jpg'; this.onerror=null;">
                </div>
                <div class="manga-info">
                    <h3 class="manga-title">${manga.title}</h3>
                    <div class="manga-rating">${starsHTML} <span>${manga.rating.toFixed(1)}</span></div>
                </div>
            `;
            
            // Добавляем обработчик клика для перехода на страницу манги
            mangaElement.addEventListener('click', () => {
                window.location.href = `/manga/${manga.id}`;
            });
            
            // Добавляем элемент в контейнер
            newMangaContainer.appendChild(mangaElement);
        });
        
        // Настраиваем навигацию по слайдеру
        setupMangaSlider();
        
    } catch (error) {
        console.error('Ошибка при загрузке последних манг:', error);
        // Отображаем сообщение об ошибке в контейнере
        const newMangaContainer = document.getElementById('latest-manga-grid');
        if (newMangaContainer) {
            newMangaContainer.innerHTML = `
                <div class="latest-manga-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Не удалось загрузить новинки. Попробуйте позже.</p>
                </div>
            `;
        }
    }
}

// Функция для настройки навигации по слайдеру манги
function setupMangaSlider() {
    const sliderContainer = document.getElementById('latest-manga-grid');
    const prevButton = document.getElementById('prevManga');
    const nextButton = document.getElementById('nextManga');
    
    if (!sliderContainer || !prevButton || !nextButton) return;
    
    // Настройка обработчиков событий для кнопок
    prevButton.addEventListener('click', () => {
        // Скролл влево на ширину двух элементов
        const itemWidth = sliderContainer.querySelector('.latest-manga-item')?.offsetWidth || 220;
        const scrollAmount = itemWidth * 2 + 40; // 2 элемента + отступы
        sliderContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    nextButton.addEventListener('click', () => {
        // Скролл вправо на ширину двух элементов
        const itemWidth = sliderContainer.querySelector('.latest-manga-item')?.offsetWidth || 220;
        const scrollAmount = itemWidth * 2 + 40; // 2 элемента + отступы
        sliderContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    // Настройка дополнительного скролла мышью по слайдеру (опционально)
    sliderContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            sliderContainer.scrollBy({ 
                left: e.deltaY > 0 ? 100 : -100, 
                behavior: 'smooth' 
            });
        }
    }, { passive: false });
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код обработки загрузки страницы ...
    
    // Загружаем последние манги
    loadLatestManga();
});