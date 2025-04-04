const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// Проверка или создание директории для пользователей
const usersDir = path.join(__dirname, 'database', 'users');
if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
}

// Создаем директорию для хранения аватаров, если она не существует
const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// Создаем директории для хранения манги, если они не существуют
const mangaDir = path.join(__dirname, 'database', 'manga');
if (!fs.existsSync(mangaDir)) {
    fs.mkdirSync(mangaDir, { recursive: true });
}

const mangaCoversDir = path.join(mangaDir, 'covers');
if (!fs.existsSync(mangaCoversDir)) {
    fs.mkdirSync(mangaCoversDir, { recursive: true });
}

const mangaDataDir = path.join(mangaDir, 'data');
if (!fs.existsSync(mangaDataDir)) {
    fs.mkdirSync(mangaDataDir, { recursive: true });
}

// Настройка хранилища для multer - аватары
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, avatarsDir);
    },
    filename: function(req, file, cb) {
        // Генерируем уникальное имя файла
        const randomName = crypto.randomBytes(16).toString('hex');
        const fileExt = path.extname(file.originalname).toLowerCase();
        cb(null, randomName + fileExt);
    }
});

// Фильтр для типов файлов
const fileFilter = (req, file, cb) => {
    // Разрешаем только изображения
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Разрешены только изображения'), false);
    }
};

// Настройка загрузчика
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB макс размер файла
    }
});

// Настройка хранилища для загрузки обложек манги
const mangaStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, mangaCoversDir);
    },
    filename: function(req, file, cb) {
        // Используем ID манги для имени файла
        const mangaId = req.body.mangaId || crypto.randomBytes(16).toString('hex');
        const fileExt = path.extname(file.originalname).toLowerCase();
        cb(null, `manga_${mangaId}${fileExt}`);
    }
});

// Фильтр для типов файлов обложек манги
const mangaFileFilter = (req, file, cb) => {
    // Разрешаем только изображения
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Разрешены только изображения'), false);
    }
};

// Настройка загрузчика для обложек манги
const mangaUpload = multer({ 
    storage: mangaStorage,
    fileFilter: mangaFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB макс размер файла
    }
});

// Коды для смены статуса пользователя
const statusCodes = {
    'ADMIN-2025': 'admin',
    'MANGAKA-2025': 'mangaka'
};

// Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Проверка на обязательные поля
        if (!username || !email || !password) {
            return res.status(200).json({ 
                success: false, 
                message: 'Все поля должны быть заполнены' 
            });
        }

        // Проверка длины пароля
        if (password.length < 6) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пароль должен содержать не менее 6 символов' 
            });
        }

        // Проверка на существующего пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь с таким именем уже существует' 
            });
        }

        // Проверка на существующий email
        const files = fs.readdirSync(usersDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const userData = JSON.parse(fs.readFileSync(path.join(usersDir, file), 'utf8'));
                if (userData.email === email) {
                    return res.status(200).json({ 
                        success: false, 
                        message: 'Пользователь с таким email уже существует' 
                    });
                }
            }
        }

        // Хеширование пароля
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создание нового пользователя
        const newUser = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            status: "user",
            bookmarks: [],
            read: [],
            profile: {
                avatar: ''
            }
        };

        // Сохранение данных в файл
        fs.writeFileSync(userPath, JSON.stringify(newUser, null, 2));

        // Успешная регистрация
        res.status(200).json({
            success: true,
            message: 'Регистрация успешна!',
            user: {
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.createdAt,
                status: newUser.status,
                bookmarks: newUser.bookmarks,
                read: newUser.read,
                profile: newUser.profile
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(200).json({ 
            success: false, 
            message: 'Ошибка сервера при регистрации',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Проверка на обязательные поля
        if (!username || !password) {
            return res.status(200).json({ 
                success: false, 
                message: 'Все поля должны быть заполнены' 
            });
        }

        // Проверка существования пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Неверное имя пользователя или пароль' 
            });
        }

        // Получение данных пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(200).json({ 
                success: false, 
                message: 'Неверное имя пользователя или пароль' 
            });
        }

        // Успешный вход
        res.status(200).json({
            success: true,
            message: 'Вход выполнен успешно!',
            user: {
                username: userData.username,
                email: userData.email,
                status: userData.status || "user",
                bookmarks: userData.bookmarks || [],
                read: userData.read || [],
                profile: userData.profile
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(200).json({ 
            success: false, 
            message: 'Ошибка сервера при входе',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Получение данных профиля пользователя
app.get('/api/profile/:username', (req, res) => {
    const username = req.params.username;
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Имя пользователя не указано' });
    }
    
    try {
        // Проверяем существует ли пользователь
        const userFilePath = path.join(__dirname, 'database', 'users', `${username}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
        
        // Отправляем данные клиенту
        res.json({
            success: true,
            user: userData
        });
        
    } catch (error) {
        console.error('Ошибка при получении профиля пользователя:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

// Добавление закладки
app.post('/api/bookmarks/add', (req, res) => {
    try {
        const { username, mangaId } = req.body;
        
        if (!username || !mangaId) {
            return res.status(200).json({ 
                success: false, 
                message: 'Отсутствуют необходимые параметры'
            });
        }
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден'
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Инициализируем массив закладок, если его нет
        if (!userData.bookmarks) {
            userData.bookmarks = [];
        }
        
        // Проверяем, есть ли уже такая закладка
        if (userData.bookmarks.includes(mangaId)) {
            return res.status(200).json({ 
                success: true, 
                message: 'Эта манга уже в закладках',
                bookmarks: userData.bookmarks
            });
        }
        
        // Добавляем закладку
        userData.bookmarks.push(mangaId);
        
        // Сохраняем данные в файл
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        
        // Возвращаем обновленный список закладок
        res.status(200).json({
            success: true,
            message: 'Закладка добавлена',
            bookmarks: userData.bookmarks
        });
    } catch (error) {
        console.error('Ошибка при добавлении закладки:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при добавлении закладки',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Удаление закладки
app.post('/api/bookmarks/remove', (req, res) => {
    try {
        const { username, mangaId } = req.body;
        
        if (!username || !mangaId) {
            return res.status(200).json({ 
                success: false, 
                message: 'Отсутствуют необходимые параметры'
            });
        }
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден'
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Проверяем наличие закладок
        if (!userData.bookmarks || !userData.bookmarks.includes(mangaId)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Закладка не найдена',
                bookmarks: userData.bookmarks || []
            });
        }
        
        // Удаляем закладку
        userData.bookmarks = userData.bookmarks.filter(id => id !== mangaId);
        
        // Сохраняем данные в файл
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        
        // Возвращаем обновленный список закладок
        res.status(200).json({
            success: true,
            message: 'Закладка удалена',
            bookmarks: userData.bookmarks
        });
    } catch (error) {
        console.error('Ошибка при удалении закладки:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при удалении закладки',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Получение закладок пользователя
app.get('/api/bookmarks/:username', (req, res) => {
    try {
        const { username } = req.params;
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден'
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Возвращаем список закладок
        res.status(200).json({
            success: true,
            bookmarks: userData.bookmarks || []
        });
    } catch (error) {
        console.error('Ошибка при получении закладок:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при получении закладок',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Добавление манги в прочитанное
app.post('/api/read/add', (req, res) => {
    try {
        const { username, mangaId } = req.body;
        
        if (!username || !mangaId) {
            return res.status(200).json({ 
                success: false, 
                message: 'Отсутствуют необходимые параметры'
            });
        }
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден'
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Инициализируем массив прочитанного, если его нет
        if (!userData.read) {
            userData.read = [];
        }
        
        // Проверяем, есть ли уже такая манга в прочитанном
        if (userData.read.includes(mangaId)) {
            return res.status(200).json({ 
                success: true, 
                message: 'Эта манга уже в списке прочитанного',
                read: userData.read
            });
        }
        
        // Добавляем в прочитанное
        userData.read.push(mangaId);
        
        // Сохраняем данные в файл
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        
        // Возвращаем обновленный список прочитанного
        res.status(200).json({
            success: true,
            message: 'Добавлено в прочитанное',
            read: userData.read
        });
    } catch (error) {
        console.error('Ошибка при добавлении в прочитанное:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при добавлении в прочитанное',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Удаление из прочитанного
app.post('/api/read/remove', (req, res) => {
    try {
        const { username, mangaId } = req.body;
        
        if (!username || !mangaId) {
            return res.status(200).json({ 
                success: false, 
                message: 'Отсутствуют необходимые параметры'
            });
        }
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден'
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Проверяем наличие записи в прочитанном
        if (!userData.read || !userData.read.includes(mangaId)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Манга не найдена в списке прочитанного',
                read: userData.read || []
            });
        }
        
        // Удаляем из прочитанного
        userData.read = userData.read.filter(id => id !== mangaId);
        
        // Сохраняем данные в файл
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        
        // Возвращаем обновленный список прочитанного
        res.status(200).json({
            success: true,
            message: 'Удалено из списка прочитанного',
            read: userData.read
        });
    } catch (error) {
        console.error('Ошибка при удалении из прочитанного:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при удалении из прочитанного',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Получение списка прочитанного пользователя
app.get('/api/read/:username', (req, res) => {
    try {
        const { username } = req.params;
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден'
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Возвращаем список прочитанного
        res.status(200).json({
            success: true,
            read: userData.read || []
        });
    } catch (error) {
        console.error('Ошибка при получении списка прочитанного:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при получении списка прочитанного',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Обновление аватара пользователя
app.post('/api/profile/update-avatar', upload.single('avatar'), (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username || !req.file) {
            return res.status(200).json({ 
                success: false, 
                message: 'Отсутствуют необходимые параметры или файл' 
            });
        }
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден' 
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Удаляем старый аватар, если он существует и не является путём по умолчанию
        if (userData.profile.avatar && !userData.profile.avatar.includes('default')) {
            const oldAvatarPath = path.join(__dirname, userData.profile.avatar.replace(/^\//, ''));
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        // Сохраняем путь к новому аватару
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        userData.profile.avatar = avatarUrl;
        
        // Сохраняем обновленные данные пользователя
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        
        // Возвращаем обновленные данные пользователя
        res.status(200).json({
            success: true,
            message: 'Аватар успешно обновлен',
            user: {
                username: userData.username,
                email: userData.email,
                status: userData.status || "user",
                bookmarks: userData.bookmarks || [],
                read: userData.read || [],
                profile: userData.profile,
                createdAt: userData.createdAt
            }
        });
    } catch (error) {
        console.error('Ошибка при обновлении аватара:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при обновлении аватара',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Изменение статуса пользователя
app.post('/api/profile/change-status', (req, res) => {
    try {
        const { username, statusCode } = req.body;
        
        if (!username || !statusCode) {
            return res.status(200).json({ 
                success: false, 
                message: 'Отсутствуют необходимые параметры' 
            });
        }
        
        // Проверяем существование пользователя
        const userPath = path.join(usersDir, `${username}.json`);
        if (!fs.existsSync(userPath)) {
            return res.status(200).json({ 
                success: false, 
                message: 'Пользователь не найден' 
            });
        }
        
        // Проверяем код статуса
        const newStatus = statusCodes[statusCode];
        if (!newStatus) {
            return res.status(200).json({ 
                success: false, 
                message: 'Неверный код статуса' 
            });
        }
        
        // Получаем данные пользователя
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf8'));
        
        // Если статус уже установлен, сообщаем об этом
        if (userData.status === newStatus) {
            return res.status(200).json({ 
                success: false, 
                message: `У вас уже установлен статус "${newStatus === 'admin' ? 'Администратор' : 'Мангака'}"` 
            });
        }
        
        // Изменяем статус пользователя
        userData.status = newStatus;
        
        // Сохраняем данные в файл
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        
        // Формируем русское название статуса для ответа
        let statusName = '';
        if (newStatus === 'admin') {
            statusName = 'Администратор';
        } else if (newStatus === 'mangaka') {
            statusName = 'Мангака';
        }
        
        // Возвращаем обновленные данные пользователя
        res.status(200).json({
            success: true,
            message: `Ваш статус успешно изменен на "${statusName}"`,
            user: {
                username: userData.username,
                email: userData.email,
                status: userData.status,
                bookmarks: userData.bookmarks || [],
                read: userData.read || [],
                profile: userData.profile,
                createdAt: userData.createdAt
            }
        });
    } catch (error) {
        console.error('Ошибка при изменении статуса пользователя:', error);
        res.status(200).json({
            success: false,
            message: 'Ошибка сервера при изменении статуса пользователя',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// API для админ-панели
app.post('/api/admin/users', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const currentUser = req.body.currentUser || {};
    const { search, status, dateRange, sort, page, limit } = req.body;
    
    if (!currentUser.username) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    try {
        // Проверяем существует ли пользователь и его права
        const userFilePath = path.join(__dirname, 'database', 'users', `${currentUser.username}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
        
        if (userData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Получаем список всех пользователей
        const usersDir = path.join(__dirname, 'database', 'users');
        const userFiles = fs.readdirSync(usersDir).filter(file => file.endsWith('.json'));
        
        let users = [];
        
        // Загружаем данные пользователей
        for (const file of userFiles) {
            try {
                const user = JSON.parse(fs.readFileSync(path.join(usersDir, file), 'utf8'));
                users.push(user);
            } catch (err) {
                console.error(`Ошибка при чтении файла ${file}:`, err);
            }
        }
        
        // Применяем фильтрацию по поисковому запросу
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user => 
                user.username.toLowerCase().includes(searchLower) || 
                user.email.toLowerCase().includes(searchLower)
            );
        }
        
        // Применяем фильтрацию по статусу
        if (status && status !== 'all') {
            users = users.filter(user => user.status === status);
        }
        
        // Применяем фильтрацию по дате регистрации
        if (dateRange && dateRange !== 'all') {
            const today = new Date();
            let startDate;
            
            switch (dateRange) {
                case 'today':
                    startDate = new Date(today);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'year':
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
            }
            
            if (startDate) {
                users = users.filter(user => new Date(user.createdAt) >= startDate);
            }
        }
        
        // Применяем сортировку
        if (sort) {
            switch (sort) {
                case 'date-desc':
                    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'date-asc':
                    users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    break;
                case 'name-asc':
                    users.sort((a, b) => a.username.localeCompare(b.username));
                    break;
                case 'name-desc':
                    users.sort((a, b) => b.username.localeCompare(a.username));
                    break;
            }
        }
        
        // Пагинация
        const currentPage = page || 1;
        const itemsPerPage = limit || 10;
        const totalPages = Math.ceil(users.length / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        // Отправляем ответ
        res.json({
            success: true,
            users: paginatedUsers,
            totalUsers: users.length,
            totalPages: totalPages,
            currentPage: currentPage
        });
        
    } catch (error) {
        console.error('Ошибка при получении списка пользователей:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

app.get('/api/admin/statistics', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const username = req.query.username;
    
    if (!username) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    try {
        // Проверяем существует ли пользователь и его права
        const userFilePath = path.join(__dirname, 'database', 'users', `${username}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
        
        if (userData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Получаем список всех пользователей
        const usersDir = path.join(__dirname, 'database', 'users');
        const userFiles = fs.readdirSync(usersDir).filter(file => file.endsWith('.json'));
        
        let totalUsers = 0;
        let regularUsers = 0;
        let mangakaUsers = 0;
        let adminUsers = 0;
        let registrationStats = {};
        
        // Собираем статистику
        for (const file of userFiles) {
            try {
                const user = JSON.parse(fs.readFileSync(path.join(usersDir, file), 'utf8'));
                
                totalUsers++;
                
                // Статистика по статусам
                switch (user.status) {
                    case 'admin':
                        adminUsers++;
                        break;
                    case 'mangaka':
                        mangakaUsers++;
                        break;
                    default:
                        regularUsers++;
                        break;
                }
                
                // Статистика по датам регистрации
                if (user.createdAt) {
                    const date = new Date(user.createdAt).toISOString().split('T')[0];
                    registrationStats[date] = (registrationStats[date] || 0) + 1;
                }
                
            } catch (err) {
                console.error(`Ошибка при чтении файла ${file}:`, err);
            }
        }
        
        // Подготавливаем данные для графика регистраций (последние 30 дней)
        const today = new Date();
        let registrationChart = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            registrationChart.push({
                date: dateString,
                count: registrationStats[dateString] || 0
            });
        }
        
        // Отправляем ответ
        res.json({
            success: true,
            totalUsers,
            regularUsers,
            mangakaUsers,
            adminUsers,
            registrationChart
        });
        
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

app.get('/api/admin/user/:username', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const adminUsername = req.query.admin;
    const targetUsername = req.params.username;
    
    if (!adminUsername) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    try {
        // Проверяем существует ли администратор и его права
        const adminFilePath = path.join(__dirname, 'database', 'users', `${adminUsername}.json`);
        
        if (!fs.existsSync(adminFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        
        if (adminData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Получаем данные целевого пользователя
        const userFilePath = path.join(__dirname, 'database', 'users', `${targetUsername}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
        
        // Отправляем ответ
        res.json({
            success: true,
            user: userData
        });
        
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

app.post('/api/admin/update-user', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const { adminUsername, username, status } = req.body;
    
    if (!adminUsername) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    try {
        // Проверяем существует ли администратор и его права
        const adminFilePath = path.join(__dirname, 'database', 'users', `${adminUsername}.json`);
        
        if (!fs.existsSync(adminFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        
        if (adminData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Проверяем, что статус имеет допустимое значение
        if (!['user', 'mangaka', 'admin'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Некорректный статус пользователя' });
        }
        
        // Получаем данные целевого пользователя
        const userFilePath = path.join(__dirname, 'database', 'users', `${username}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
        
        // Обновляем статус пользователя
        userData.status = status;
        
        // Сохраняем обновленные данные
        fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
        
        // Отправляем ответ
        res.json({
            success: true,
            message: 'Данные пользователя обновлены',
            user: userData
        });
        
    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

app.post('/api/admin/delete-user', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const { adminUsername, username } = req.body;
    
    if (!adminUsername) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Не указано имя пользователя для удаления' });
    }
    
    // Проверяем, что администратор не пытается удалить сам себя
    if (adminUsername === username) {
        return res.status(400).json({ success: false, message: 'Вы не можете удалить свою учетную запись' });
    }
    
    try {
        // Проверяем существует ли администратор и его права
        const adminFilePath = path.join(__dirname, 'database', 'users', `${adminUsername}.json`);
        
        if (!fs.existsSync(adminFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        
        if (adminData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Получаем данные целевого пользователя
        const userFilePath = path.join(__dirname, 'database', 'users', `${username}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        
        // Удаляем пользователя
        fs.unlinkSync(userFilePath);
        
        // Отправляем ответ
        res.json({
            success: true,
            message: 'Пользователь успешно удален'
        });
        
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

// API для массового удаления пользователей
app.post('/api/admin/bulk-delete-users', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const { adminUsername, usernames } = req.body;
    
    if (!adminUsername) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
        return res.status(400).json({ success: false, message: 'Не указаны пользователи для удаления' });
    }
    
    // Проверяем, что администратор не пытается удалить сам себя
    if (usernames.includes(adminUsername)) {
        return res.status(400).json({ success: false, message: 'Вы не можете удалить свою учетную запись' });
    }
    
    try {
        // Проверяем существует ли администратор и его права
        const adminFilePath = path.join(__dirname, 'database', 'users', `${adminUsername}.json`);
        
        if (!fs.existsSync(adminFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        
        if (adminData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Переменная для отслеживания количества удаленных пользователей
        let deletedCount = 0;
        
        // Удаляем каждого пользователя из списка
        for (const username of usernames) {
            try {
                const userFilePath = path.join(__dirname, 'database', 'users', `${username}.json`);
                
                if (fs.existsSync(userFilePath)) {
                    fs.unlinkSync(userFilePath);
                    deletedCount++;
                }
            } catch (err) {
                console.error(`Ошибка при удалении пользователя ${username}:`, err);
            }
        }
        
        // Отправляем успешный ответ
        res.json({
            success: true,
            message: `Успешно удалено пользователей: ${deletedCount}`,
            deletedCount
        });
        
    } catch (error) {
        console.error('Ошибка при массовом удалении пользователей:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

// API для массового изменения статуса пользователей
app.post('/api/admin/bulk-update-status', (req, res) => {
    // Проверяем, авторизован ли пользователь и имеет ли права администратора
    const { adminUsername, usernames, status } = req.body;
    
    if (!adminUsername) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
        return res.status(400).json({ success: false, message: 'Не указаны пользователи для изменения статуса' });
    }
    
    if (!status || !['user', 'mangaka', 'admin'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Указан некорректный статус' });
    }
    
    try {
        // Проверяем существует ли администратор и его права
        const adminFilePath = path.join(__dirname, 'database', 'users', `${adminUsername}.json`);
        
        if (!fs.existsSync(adminFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        
        if (adminData.status !== 'admin') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для доступа' });
        }
        
        // Переменная для отслеживания количества обновленных пользователей
        let updatedCount = 0;
        
        // Обновляем статус каждого пользователя из списка
        for (const username of usernames) {
            try {
                const userFilePath = path.join(__dirname, 'database', 'users', `${username}.json`);
                
                if (fs.existsSync(userFilePath)) {
                    // Загружаем данные пользователя
                    const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
                    
                    // Обновляем статус
                    userData.status = status;
                    
                    // Сохраняем обновленные данные
                    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
                    
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Ошибка при обновлении статуса пользователя ${username}:`, err);
            }
        }
        
        // Отправляем успешный ответ
        res.json({
            success: true,
            message: `Успешно обновлен статус ${updatedCount} пользователей`,
            updatedCount
        });
        
    } catch (error) {
        console.error('Ошибка при массовом обновлении статуса пользователей:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка на сервере' });
    }
});

// API для загрузки обложки манги
app.post('/api/manga/upload-cover', mangaUpload.single('cover'), (req, res) => {
    // Проверяем, был ли загружен файл
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Файл не загружен' });
    }
    
    // Получаем ID манги из запроса
    const mangaId = req.body.mangaId;
    
    if (!mangaId) {
        // Удаляем загруженный файл, если ID не указан
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'ID манги не указан' });
    }
    
    try {
        // Формируем URL для обложки
        const fileName = path.basename(req.file.path);
        const coverUrl = `/database/manga/covers/${fileName}`;
        
        // Отправляем успешный ответ
        res.json({
            success: true,
            coverUrl: coverUrl,
            message: 'Обложка успешно загружена'
        });
        
    } catch (error) {
        console.error('Ошибка при загрузке обложки:', error);
        
        // Пытаемся удалить загруженный файл в случае ошибки
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ success: false, message: 'Ошибка при загрузке обложки' });
    }
});

// API для добавления новой манги
app.post('/api/manga/add', (req, res) => {
    // Проверяем, авторизован ли пользователь
    const currentUser = req.body.currentUser || {};
    const mangaData = req.body.manga || {};
    
    if (!currentUser.username) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    // Проверяем, заполнены ли все необходимые поля
    if (!mangaData.id || !mangaData.title || !mangaData.description || 
        !mangaData.genres || !mangaData.coverUrl || !mangaData.rating) {
        return res.status(400).json({ success: false, message: 'Не все поля заполнены' });
    }
    
    try {
        // Проверяем существует ли пользователь и его права
        const userFilePath = path.join(__dirname, 'database', 'users', `${currentUser.username}.json`);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        
        const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
        
        // Проверяем, имеет ли пользователь права для добавления манги
        if (userData.status !== 'admin' && userData.status !== 'mangaka') {
            return res.status(403).json({ success: false, message: 'Недостаточно прав для добавления манги' });
        }
        
        // Создаем директорию для хранения данных о манге, если она не существует
        const mangaDir = path.join(__dirname, 'database', 'manga');
        if (!fs.existsSync(mangaDir)) {
            fs.mkdirSync(mangaDir, { recursive: true });
        }
        
        const mangaDataDir = path.join(mangaDir, 'data');
        if (!fs.existsSync(mangaDataDir)) {
            fs.mkdirSync(mangaDataDir, { recursive: true });
        }
        
        // Проверяем, не существует ли уже манга с таким ID
        const mangaFilePath = path.join(mangaDataDir, `${mangaData.id}.json`);
        if (fs.existsSync(mangaFilePath)) {
            return res.status(400).json({ success: false, message: 'Манга с таким ID уже существует' });
        }
        
        // Сохраняем данные о манге
        fs.writeFileSync(mangaFilePath, JSON.stringify(mangaData, null, 2));
        
        // Отправляем успешный ответ
        res.json({
            success: true,
            message: 'Манга успешно добавлена',
            mangaId: mangaData.id
        });
        
    } catch (error) {
        console.error('Ошибка при добавлении манги:', error);
        res.status(500).json({ success: false, message: 'Ошибка при добавлении манги' });
    }
});

// API для получения последних манг
app.get('/api/manga/latest', (req, res) => {
    try {
        // Проверяем наличие директории с мангой
        const mangaDataDir = path.join(__dirname, 'database', 'manga', 'data');
        if (!fs.existsSync(mangaDataDir)) {
            fs.mkdirSync(mangaDataDir, { recursive: true });
        }
        
        // Получаем список файлов
        const files = fs.readdirSync(mangaDataDir);
        
        // Если файлов нет или они пустые, возвращаем тестовые данные
        if (!files || files.length === 0) {
            // Тестовые данные для отображения
            const testManga = [
                {
                    id: "12345678901",
                    title: "Магическая битва",
                    description: "История о юноше, который становится охотником на проклятия",
                    genres: ["Экшн", "Фэнтези", "Приключения"],
                    rating: 4.8,
                    coverUrl: "https://cdn.animenewsnetwork.com/thumbnails/max400x400/cms/news.5/174892/jujutsu-kaisen.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
                },
                {
                    id: "12345678902",
                    title: "Берсерк",
                    description: "Тёмное фэнтези о воине с огромным мечом",
                    genres: ["Фэнтези", "Боевик", "Ужасы"],
                    rating: 4.9,
                    coverUrl: "https://i.ebayimg.com/images/g/LasAAOSwKvZjEt35/s-l1200.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
                },
                {
                    id: "12345678903",
                    title: "Атака титанов",
                    description: "Борьба человечества против гигантских титанов",
                    genres: ["Экшн", "Драма", "Фэнтези"],
                    rating: 4.7,
                    coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781632364258/attack-on-titan-27-9781632364258_hr.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
                },
                {
                    id: "12345678904",
                    title: "Моя геройская академия",
                    description: "Мир, где большинство людей обладают суперсилами",
                    genres: ["Экшн", "Комедия", "Школа"],
                    rating: 4.5,
                    coverUrl: "https://www.rightstufanime.com/images/productImages/9781421582696_manga-My-Hero-Academia-Graphic-Novel-1-primary.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
                },
                {
                    id: "12345678905",
                    title: "Клинок, рассекающий демонов",
                    description: "Юноша становится охотником на демонов",
                    genres: ["Экшн", "Исторический", "Сверхъестественное"],
                    rating: 4.6,
                    coverUrl: "https://m.media-amazon.com/images/I/51VXDZfB6YL._AC_UF1000,1000_QL80_.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
                },
                {
                    id: "12345678906",
                    title: "Ван Пис",
                    description: "Приключения пиратов в поисках легендарного сокровища",
                    genres: ["Приключения", "Комедия", "Фэнтези"],
                    rating: 4.8,
                    coverUrl: "https://m.media-amazon.com/images/I/8146xwSYvOL._AC_UF1000,1000_QL80_.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
                },
                {
                    id: "12345678907",
                    title: "Наруто",
                    description: "История юного ниндзя с демоном внутри",
                    genres: ["Экшн", "Приключения", "Боевые искусства"],
                    rating: 4.7,
                    coverUrl: "https://m.media-amazon.com/images/I/51qU7IRyiYL._AC_UF1000,1000_QL80_.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
                },
                {
                    id: "12345678908",
                    title: "Человек-бензопила",
                    description: "Парень с бензопилой вместо головы охотится на демонов",
                    genres: ["Экшн", "Ужасы", "Сверхъестественное"],
                    rating: 4.9,
                    coverUrl: "https://m.media-amazon.com/images/I/81-t1V3OOuL._AC_UF1000,1000_QL80_.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
                },
                {
                    id: "12345678909",
                    title: "Токийский гуль",
                    description: "Студент становится наполовину демоном и должен научиться жить в обоих мирах",
                    genres: ["Экшн", "Ужасы", "Сверхъестественное"],
                    rating: 4.5,
                    coverUrl: "https://m.media-amazon.com/images/I/81fZizQbICL._AC_UF1000,1000_QL80_.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString()
                },
                {
                    id: "12345678910",
                    title: "Убийца Акаме!",
                    description: "Группа убийц борется против коррумпированной империи",
                    genres: ["Экшн", "Фэнтези", "Драма"],
                    rating: 4.3,
                    coverUrl: "https://m.media-amazon.com/images/I/91lK3rEWw1L._AC_UF1000,1000_QL80_.jpg",
                    createdBy: "admin",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
                }
            ];
            
            return res.status(200).json({
                success: true,
                manga: testManga
            });
        }
        
        // Если есть файлы, читаем их и отправляем
        // Получаем данные о манге и сортируем их по дате создания (от новой к старой)
        const mangaList = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const mangaData = JSON.parse(fs.readFileSync(path.join(mangaDataDir, file), 'utf8'));
                return mangaData;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10); // Берем только 10 последних
        
        // Отправляем ответ
        res.status(200).json({
            success: true,
            manga: mangaList
        });
        
    } catch (error) {
        console.error('Ошибка при получении списка манги:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера при получении списка манги' 
        });
    }
});

// API для получения данных манги по ID
app.get('/api/manga/:id', (req, res) => {
    try {
        const mangaId = req.params.id;
        
        if (!mangaId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID манги не указан' 
            });
        }
        
        const mangaFilePath = path.join(__dirname, 'database', 'manga', 'data', `${mangaId}.json`);
        
        if (!fs.existsSync(mangaFilePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Манга не найдена' 
            });
        }
        
        const mangaData = JSON.parse(fs.readFileSync(mangaFilePath, 'utf8'));
        
        res.status(200).json({
            success: true,
            manga: mangaData
        });
    } catch (error) {
        console.error('Ошибка при получении данных манги:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера при получении данных манги',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Маршрут для страницы манги
app.get('/manga/:id', (req, res) => {
    const mangaId = req.params.id;
    
    // Проверяем существование манги в базе данных
    const mangaFilePath = path.join(__dirname, 'database', 'manga', 'data', `${mangaId}.json`);
    
    if (!fs.existsSync(mangaFilePath)) {
        // Если манга не найдена, все равно отправляем страницу
        // JavaScript на странице покажет ошибку
    }
    
    // Отправляем HTML-шаблон
    res.sendFile(path.join(__dirname, 'manga.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту http://localhost:${PORT}`);
}); 