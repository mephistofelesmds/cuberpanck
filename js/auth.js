// ========== AUTH MANAGER ==========
const AuthManager = {
  // Предустановленные пользователи из users.json
  users: [
    {
      "id": 0,
      "username": "moder",
      "password": "9869225235",
      "display_name": "модератор.",
      "bio": "за вами следят.",
      "avatar_url": "avatars/moder.png",
      "role": "admin",
      "joined": "2024-01-15"
    },
    {
      "id": 1,
      "username": "bio",
      "password": "980980",
      "display_name": "Биотрисса",
      "bio": "Генетик-модификатор, специалист по биоинженерии.",
      "avatar_url": "avatars/bio.png",
      "role": "user",
      "joined": "2024-02-20"
    },
    {
      "id": 2,
      "username": "nath",
      "password": "890890",
      "display_name": "Натаниэль",
      "bio": "Хакер-фрилансер, специализация - кибербезопасность.",
      "avatar_url": "avatars/nath.png",
      "role": "user",
      "joined": "2024-03-10"
    },
    {
      "id": 3,
      "username": "lacey_off",
      "password": "531351",
      "display_name": "Люська",
      "bio": "Любов одна а стендов два.",
      "avatar_url": "avatars/Lacey_off.png",
      "role": "user",
      "joined": "2024-04-05"
    },
    {
      "id": 4,
      "username": "flint",
      "password": "234324",
      "display_name": "Флинт Марлоу",
      "bio": "Выкуривать по три пачки в день - трудный путь, но разве нам нужны легкие?",
      "avatar_url": "avatars/flint.png",
      "role": "user",
      "joined": "2024-05-12"
    },
    {
      "id": 5,
      "username": "picdez",
      "password": "050806",
      "display_name": "Джейс",
      "bio": "мир пешки - люди орешки.",
      "avatar_url": "avatars/picdez.png",
      "role": "user",
      "joined": "2024-06-01"
    },
    {
      "id": 6,
      "username": "mr.Lewis",
      "password": "411674",
      "display_name": "О'Лаан.",
      "bio": "Наша больница включает в себя: хоспис, клиническую больницу, СМП, поликлинику и все в одном здании.",
      "avatar_url": "avatars/mr_Lewis.png",
      "role": "user",
      "joined": "2024-07-18"
    },
    {
      "id": 7,
      "username": "lolitaа",
      "password": "411700",
      "display_name": "Лола<3",
      "bio": "Bite)/(hip",
      "avatar_url": "avatars/lolitaа.png",
      "role": "user",
      "joined": "2024-08-22"
    }
  ],

  async hashPassword(password) {
    return password;
  },

  // Логин только для существующих пользователей
  async login(username, password) {
    const user = this.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return { success: false, error: 'Неверный логин или пароль' };
    }

    this.createSession(user);
    return { success: true, user };
  },

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

  loadSession() {
    const data = localStorage.getItem('cyberpulse_session');
    return data ? JSON.parse(data) : null;
  },

  saveSession(session) {
    localStorage.setItem('cyberpulse_session', JSON.stringify(session));
  },

  async addAccount(session, username, password) {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, error: 'Неверный логин или пароль' };
    
    if (session.available_users.some(u => u.username === user.username)) {
      return { success: false, error: 'Аккаунт уже в сессии', user };
    }
    
    session.available_users.push(user);
    this.saveSession(session);
    return { success: true, user };
  },

  switchAccount(session, username) {
    const user = session.available_users.find(u => u.username === username);
    if (!user) return { success: false, error: 'Аккаунт не найден' };
    
    session.active_user = user;
    this.saveSession(session);
    return { success: true, user };
  },

  removeAccount(session, username) {
    if (session.active_user.username === username) {
      return { success: false, error: 'Нельзя удалить активный аккаунт' };
    }
    
    session.available_users = session.available_users.filter(u => u.username !== username);
    this.saveSession(session);
    return { success: true };
  },

  clearSession(session) {
    session.available_users = [session.active_user];
    this.saveSession(session);
  },

  logout() {
    localStorage.removeItem('cyberpulse_session');
  },

  // Получить всех пользователей (для списка входа)
  getAllUsers() {
    return this.users.map(user => ({
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role
    }));
  }
};