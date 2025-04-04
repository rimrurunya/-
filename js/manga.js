document.addEventListener("DOMContentLoaded", function() {
    // Получение ID манги из URL
    const mangaId = window.location.pathname.split('/').pop();
    
    // Элементы страницы
    const coverImg = document.getElementById('manga-cover-img');
    const titleEl = document.getElementById('manga-title');
    const genresEl = document.getElementById('manga-genres');
    const descriptionEl = document.getElementById('manga-description');
    const ratingEl = document.getElementById('manga-rating');
    const createdAtEl = document.getElementById('manga-created-at');
    const authorEl = document.getElementById('manga-author');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const readBtn = document.getElementById('read-btn');
    const chapterList = document.getElementById('chapter-list');
    const chaptersOrder = document.getElementById('chapters-order');
    
    // Получение данных текущего пользователя (если авторизован)
    let currentUser = null;
    try {
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            currentUser = JSON.parse(userJson);
        }
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
    }
    
    // Загрузка данных манги
    fetchMangaData(mangaId);
    
    // Обработчик добавления/удаления из закладок
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', toggleBookmark);
    }
    
    // Обработчик сортировки глав
    if (chaptersOrder) {
        chaptersOrder.addEventListener('change', function() {
            // Вызов функции сортировки глав (на будущее)
            sortChapters(this.value);
        });
    }
    
    // Функция для получения данных манги
    function fetchMangaData(id) {
        fetch(`/api/manga/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayMangaData(data.manga);
                    
                    // Проверяем, добавлена ли манга в закладки
                    updateBookmarkStatus(data.manga.id);
                    
                    // Загружаем главы манги (на будущее)
                    // fetchChapters(data.manga.id);
                } else {
                    showError(data.message || 'Манга не найдена');
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке данных манги:', error);
                showError('Произошла ошибка при загрузке манги');
            });
    }
    
    // Функция для отображения данных манги
    function displayMangaData(manga) {
        // Устанавливаем заголовок страницы
        document.title = `${manga.title} | ꋪꀤꉓꃅ`;
        
        // Устанавливаем обложку
        coverImg.src = manga.coverUrl;
        coverImg.alt = `Обложка ${manga.title}`;
        
        // Устанавливаем название
        titleEl.textContent = manga.title;
        
        // Устанавливаем жанры
        genresEl.innerHTML = '';
        if (manga.genres && manga.genres.length > 0) {
            manga.genres.forEach(genre => {
                const genreEl = document.createElement('span');
                genreEl.className = 'manga-genre';
                genreEl.textContent = genre;
                genresEl.appendChild(genreEl);
            });
        }
        
        // Устанавливаем описание
        descriptionEl.textContent = manga.description;
        
        // Устанавливаем рейтинг
        ratingEl.textContent = manga.rating ? manga.rating.toFixed(1) : '0.0';
        
        // Устанавливаем дату добавления
        if (manga.createdAt) {
            const date = new Date(manga.createdAt);
            createdAtEl.textContent = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        // Устанавливаем автора
        authorEl.textContent = manga.createdBy || '-';
        
        // Заглушка для глав (на будущее)
        chapterList.innerHTML = `
            <div class="chapter-item">
                <div class="chapter-info">
                    <div class="chapter-title">Глава 1: Начало</div>
                    <div class="chapter-date">Добавлено: ${new Date().toLocaleDateString('ru-RU')}</div>
                </div>
                <div class="chapter-actions">
                    <button class="chapter-btn read-chapter-btn">Читать</button>
                </div>
            </div>
            <div class="chapter-item">
                <div class="chapter-info">
                    <div class="chapter-title">Глава 2: Продолжение</div>
                    <div class="chapter-date">Добавлено: ${new Date().toLocaleDateString('ru-RU')}</div>
                </div>
                <div class="chapter-actions">
                    <button class="chapter-btn read-chapter-btn">Читать</button>
                </div>
            </div>
        `;
    }
    
    // Функция для обновления статуса закладки
    function updateBookmarkStatus(mangaId) {
        if (!currentUser || !bookmarkBtn) return;
        
        const isBookmarked = currentUser.bookmarks && currentUser.bookmarks.includes(mangaId);
        
        if (isBookmarked) {
            bookmarkBtn.classList.add('active');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> В закладках';
        } else {
            bookmarkBtn.classList.remove('active');
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> В закладки';
        }
    }
    
    // Функция для добавления/удаления из закладок
    function toggleBookmark() {
        if (!currentUser) {
            // Если пользователь не авторизован, открываем модальное окно входа
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
            return;
        }
        
        const action = bookmarkBtn.classList.contains('active') ? 'remove' : 'add';
        const endpoint = action === 'add' ? '/api/bookmark/add' : '/api/bookmark/remove';
        
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                mangaId: mangaId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Обновляем данные пользователя в localStorage
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Обновляем UI
                updateBookmarkStatus(mangaId);
                
                // Показываем уведомление
                showNotification(action === 'add' 
                    ? 'Манга добавлена в закладки' 
                    : 'Манга удалена из закладок');
            } else {
                showNotification('Ошибка: ' + (data.message || 'Не удалось обновить закладки'), 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при обновлении закладок:', error);
            showNotification('Произошла ошибка при обновлении закладок', 'error');
        });
    }
    
    // Функция для сортировки глав (заглушка на будущее)
    function sortChapters(order) {
        // В будущем здесь будет логика сортировки глав
        console.log('Сортировка глав по:', order);
    }
    
    // Функция для отображения ошибки
    function showError(message) {
        const container = document.querySelector('.manga-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Произошла ошибка</h2>
                    <p>${message}</p>
                    <a href="/" class="manga-action-btn read-btn">Вернуться на главную</a>
                </div>
            `;
        }
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'success') {
        // Проверяем, есть ли уже уведомление
        let notification = document.getElementById("notification");
        
        if (notification) {
            // Если уведомление уже существует, обновляем текст
            notification.textContent = message;
            
            // Перезапускаем таймер удаления
            clearTimeout(notification.timeoutId);
        } else {
            // Создаем новое уведомление
            notification = document.createElement("div");
            notification.id = "notification";
            notification.textContent = message;
            
            // Стили для уведомления
            notification.style.position = "fixed";
            notification.style.bottom = "20px";
            notification.style.right = "20px";
            notification.style.padding = "10px 15px";
            notification.style.background = type === 'success' 
                ? "rgba(46, 204, 113, 0.9)" 
                : "rgba(231, 76, 60, 0.9)";
            notification.style.color = "#fff";
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
        }, 3000);
    }
}); 