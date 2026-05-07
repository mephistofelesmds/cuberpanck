// ========== МОДУЛЬ АВТОРИЗАЦИИ ==========

const AuthManager = {
    // Хеширование пароля
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Получить всех пользователей
    getUsers() {
        const stored = localStorage.getItem('cyberpulse_users');
        return stored ? JSON.parse(stored) : [];
    },

    // Сохранить всех пользователей
    saveUsers(users) {
        localStorage.setItem('cyberpulse_users', JSON.stringify(users));
    },

    // Найти пользователя по логину (для входа)
    findUserByUsername(username) {
        const users = this.getUsers();
        return users.find(u => u.username.toLowerCase() === username.toLowerCase());
    },

    // Проверка уникальности юзернейма
    isUsernameAvailable(username) {
        const users = this.getUsers();
        return !users.some(u => u.username.toLowerCase() === username.toLowerCase());
    },

    // Генерация предложений для юзернейма
    generateUsernameSuggestions(baseName) {
        const suggestions = new Set();
        const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '');
        
        if (!cleanBase) {
            return ['user_' + Math.floor(Math.random() * 10000)];
        }
        
        // Варианты
        suggestions.add(cleanBase);
        suggestions.add(cleanBase + '_' + Math.floor(Math.random() * 100));
        suggestions.add(cleanBase + Math.floor(Math.random() * 1000));
        suggestions.add(cleanBase + '_' + Math.floor(Math.random() * 1000));
        suggestions.add('_' + cleanBase);
        suggestions.add(cleanBase + Math.floor(Math.random() * 10000));
        
        // Отфильтровываем занятые
        const available = Array.from(suggestions).filter(s => this.isUsernameAvailable(s));
        
        // Если все заняты, генерируем с timestamp
        if (available.length === 0) {
            available.push(cleanBase + '_' + Date.now().toString().slice(-6));
        }
        
        return available.slice(0, 5);
    },

    // Регистрация
    async register(username, password, displayName, bio) {
        // Валидация
        if (!username || username.length < 3) {
            return { success: false, error: 'Юзернейм должен содержать минимум 3 символа' };
        }
        
        // Проверка на допустимые символы
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return { success: false, error: 'Юзернейм может содержать только буквы, цифры и символ _' };
        }
        
        if (!password || password.length < 4) {
            return { success: false, error: 'Пароль должен содержать минимум 4 символа' };
        }
        if (!displayName || displayName.length < 1) {
            return { success: false, error: 'Введите отображаемое имя' };
        }

        // Проверка на существование
        if (!this.isUsernameAvailable(username)) {
            const suggestions = this.generateUsernameSuggestions(username);
            return { 
                success: false, 
                error: `Юзернейм @${username} уже занят`,
                suggestions: suggestions
            };
        }

        // Хешируем пароль
        const hashedPassword = await this.hashPassword(password);

        // Создаем пользователя
        const users = this.getUsers();
        const newUser = {
            id: Date.now(),
            username: username.toLowerCase(),
            password: hashedPassword,
            display_name: displayName,
            bio: bio || 'Привет! Я новичок в Cyberpulse.',
            avatar_url: null,
            role: 'user',
            joined: new Date().toISOString().split('T')[0]
        };

        users.push(newUser);
        this.saveUsers(users);
        
        return { success: true, user: newUser };
    },

    // Вход
    async login(username, password) {
        const user = this.findUserByUsername(username);
        
        if (!user) {
            return { success: false, error: 'Неверный логин или пароль' };
        }

        const hashedPassword = await this.hashPassword(password);
        
        if (user.password !== hashedPassword) {
            return { success: false, error: 'Неверный логин или пароль' };
        }

        const sessionUser = { ...user };
        delete sessionUser.password;
        
        this.createSession(sessionUser);
        
        return { success: true, user: sessionUser };
    },

    // Создать сессию
    createSession(user) {
        const session = {
            active_user: {
                ...user,
                last_login: new Date().toISOString()
            },
            available_users: []
        };
        session.available_users.push(session.active_user);
        this.saveSession(session);
        return session;
    },

    // Загрузить сессию
    loadSession() {
        const data = localStorage.getItem('cyberpulse_session');
        return data ? JSON.parse(data) : null;
    },

    // Сохранить сессию
    saveSession(session) {
        localStorage.setItem('cyberpulse_session', JSON.stringify(session));
    },

    // Добавить аккаунт в сессию
    async addAccount(session, username, password) {
        const user = this.findUserByUsername(username);
        if (!user) return { success: false, error: 'Неверный логин или пароль' };
        
        const hashedPassword = await this.hashPassword(password);
        if (user.password !== hashedPassword) {
            return { success: false, error: 'Неверный логин или пароль' };
        }
        
        if (session.available_users.some(u => u.username === user.username)) {
            return { success: false, error: 'Аккаунт уже в сессии', user };
        }
        
        const userData = {
            ...user,
            added_at: new Date().toISOString(),
            last_login: new Date().toISOString()
        };
        delete userData.password;
        
        session.available_users.push(userData);
        this.saveSession(session);
        return { success: true, user: userData };
    },

    // Переключить аккаунт
    switchAccount(session, username) {
        const user = session.available_users.find(u => u.username === username);
        if (!user) return { success: false, error: 'Аккаунт не найден' };
        
        user.last_login = new Date().toISOString();
        session.active_user = user;
        this.saveSession(session);
        return { success: true, user };
    },

    // Удалить аккаунт из сессии
    removeAccount(session, username) {
        if (session.active_user.username === username) {
            return { success: false, error: 'Нельзя удалить активный аккаунт' };
        }
        
        session.available_users = session.available_users.filter(u => u.username !== username);
        this.saveSession(session);
        return { success: true };
    },

    // Очистить сессию
    clearSession(session) {
        session.available_users = [session.active_user];
        this.saveSession(session);
    },

    // Выйти
    logout() {
        localStorage.removeItem('cyberpulse_session');
    },

    // Создать тестового пользователя
    async createDemoUser() {
        if (this.isUsernameAvailable('demo')) {
            await this.register('demo', 'demo123', 'Демо-пользователь', 'Тестовый аккаунт для знакомства с платформой');
        }
    }
};