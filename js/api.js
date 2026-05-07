// ========== API ДЛЯ РАБОТЫ С СЕРВЕРОМ ==========

const API_URL = 'http://localhost:3000'; // Ваш IP для доступа с других устройств

class ForumAPI {
    constructor() {
        // При первом запуске устанавливаем базовый URL
        this.baseURL = localStorage.getItem('api_url') || API_URL;
    }
    
    // Установить URL сервера (для доступа с других устройств)
    setServerURL(url) {
        this.baseURL = url;
        localStorage.setItem('api_url', url);
    }
    
    // GET запрос
    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.json();
    }
    
    // POST запрос
    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
    
    // PUT запрос
    async put(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
    
    // DELETE запрос
    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.json();
    }
    
    // PATCH запрос
    async patch(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
    
    // ========== ПОСТЫ ==========
    
    // Получить все посты
    async getPosts() {
        return this.get('/posts?_sort=createdAt&_order=desc');
    }
    
    // Создать пост
    async createPost(post) {
        return this.post('/posts', {
            ...post,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            commentsCount: 0
        });
    }
    
    // Обновить пост
    async updatePost(id, data) {
        return this.patch(`/posts/${id}`, data);
    }
    
    // Удалить пост
    async deletePost(id) {
        return this.delete(`/posts/${id}`);
    }
    
    // Лайкнуть пост
    async likePost(postId, userId) {
        const post = await this.get(`/posts/${postId}`);
        if (!post.likedBy) post.likedBy = [];
        
        if (!post.likedBy.includes(userId)) {
            post.likedBy.push(userId);
            post.likes = post.likedBy.length;
            return this.updatePost(postId, { likes: post.likes, likedBy: post.likedBy });
        } else {
            post.likedBy = post.likedBy.filter(id => id !== userId);
            post.likes = post.likedBy.length;
            return this.updatePost(postId, { likes: post.likes, likedBy: post.likedBy });
        }
    }
    
    // ========== КОММЕНТАРИИ ==========
    
    // Получить комментарии к посту
    async getComments(postId) {
        return this.get(`/comments?postId=${postId}&_sort=createdAt&_order=asc`);
    }
    
    // Создать комментарий
    async createComment(comment) {
        return this.post('/comments', {
            ...comment,
            createdAt: new Date().toISOString()
        });
    }
    
    // Удалить комментарий
    async deleteComment(id) {
        return this.delete(`/comments/${id}`);
    }
    
    // ========== ПОЛЬЗОВАТЕЛИ ==========
    
    // Получить пользователя
    async getUser(userId) {
        return this.get(`/users/${userId}`);
    }
    
    // Получить посты пользователя
    async getUserPosts(userId) {
        return this.get(`/posts?authorId=${userId}&_sort=createdAt&_order=desc`);
    }
    
    // Обновить профиль
    async updateProfile(userId, data) {
        return this.patch(`/users/${userId}`, data);
    }
    
    // Регистрация
    async register(userData) {
        // Проверяем, существует ли пользователь
        const users = await this.get('/users');
        if (users.find(u => u.username === userData.username)) {
            throw new Error('Пользователь уже существует');
        }
        
        // Простое хеширование (md5 для демо, в реальном проекте используйте bcrypt)
        const hashedPassword = this.hashPassword(userData.password);
        
        const newUser = {
            username: userData.username,
            password: hashedPassword,
            display_name: userData.display_name,
            bio: userData.bio || '',
            avatar_url: null,
            role: 'user',
            joined: new Date().toISOString().split('T')[0]
        };
        
        return this.post('/users', newUser);
    }
    
    // Вход
    async login(username, password) {
        const users = await this.get('/users');
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        if (!user) {
            throw new Error('Неверный логин или пароль');
        }
        
        const session = {
            active_user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                bio: user.bio,
                avatar_url: user.avatar_url,
                role: user.role,
                joined: user.joined
            },
            available_users: []
        };
        
        session.available_users.push(session.active_user);
        localStorage.setItem('cyberpulse_session', JSON.stringify(session));
        
        return session;
    }
    
    // Простое хеширование (для демо)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    
    // Получить текущую сессию
    getSession() {
        const session = localStorage.getItem('cyberpulse_session');
        return session ? JSON.parse(session) : null;
    }
    
    // Выйти
    logout() {
        localStorage.removeItem('cyberpulse_session');
    }
}

const API = new ForumAPI();