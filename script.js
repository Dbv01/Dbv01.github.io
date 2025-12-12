// script.js - Вся логика магазина

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let cart = [];
let orders = [];
let allOrders = []; // Для админа
let products = [
    { id: 1, name: "Ноутбук Gaming Pro", price: 89990, category: "Ноутбуки", image: "💻" },
    { id: 2, name: "Смартфон Ultra 14 Pro", price: 69990, category: "Смартфоны", image: "📱" },
    { id: 3, name: "Наушники Wireless Max", price: 14990, category: "Аудио", image: "🎧" },
    { id: 4, name: "Умные часы Health 3", price: 12990, category: "Гаджеты", image: "⌚" },
    { id: 5, name: "Планшет Tablet Pro", price: 34990, category: "Планшеты", image: "📱" },
    { id: 6, name: "Клавиатура Mechanical", price: 4990, category: "Аксессуары", image: "⌨️" },
    { id: 7, name: "Мышь Gaming", price: 2990, category: "Аксессуары", image: "🖱️" },
    { id: 8, name: "Монитор 27\" 4K", price: 44990, category: "Мониторы", image: "🖥️" }
];

// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====
class User {
    constructor(email, password, name = '') {
        this.id = Date.now();
        this.email = email;
        this.password = password;
        this.name = name;
        this.isAdmin = email === 'danya@admin.com';
        this.orders = [];
    }
}

// Проверка авторизации при загрузке
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserSection();
        loadUserData();
    }
    
    // Админ по умолчанию
    const admin = new User('danya@admin.com', 'admin123', 'Даня (Админ)');
    if (!localStorage.getItem('users')) {
        const users = [admin];
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Обновление раздела пользователя
function updateUserSection() {
    const userSection = document.getElementById('user-section');
    if (!userSection) return;
    
    if (currentUser) {
        userSection.innerHTML = `
            <span style="margin-right: 1rem;">${currentUser.name || currentUser.email}</span>
            ${currentUser.isAdmin ? '<button class="btn btn-outline" onclick="showAdminPage()">Админ</button>' : ''}
            <button class="btn btn-danger" onclick="logout()">Выйти</button>
        `;
        
        // Показываем админку если админ
        if (currentUser.isAdmin) {
            showAdminPage();
        }
    } else {
        userSection.innerHTML = '<a href="#" class="btn btn-outline" onclick="showAuthModal()">Войти</a>';
    }
}

// Вход/регистрация
function handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const confirmPassword = document.getElementById('auth-confirm-password')?.value;
    const name = document.getElementById('auth-name')?.value || email.split('@')[0];
    
    // Валидация
    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (action === 'register' && password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    // Получаем пользователей из localStorage
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (action === 'login') {
        // Вход
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            closeAuthModal();
            updateUserSection();
            loadUserData();
            showNotification('Успешный вход!', 'success');
            showPage('products');
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    } else if (action === 'register') {
        // Регистрация
        if (users.some(u => u.email === email)) {
            showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }
        
        const newUser = new User(email, password, name);
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        closeAuthModal();
        updateUserSection();
        showNotification('Регистрация успешна!', 'success');
        showPage('products');
    }
}

// Выход
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserSection();
    cart = [];
    updateCart();
    showPage('home');
    showNotification('Вы вышли из аккаунта', 'success');
}

// ===== УПРАВЛЕНИЕ КОРЗИНОЙ =====
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${product.name} добавлен в корзину`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCart();
}

function updateCart() {
    // Сохраняем корзину в localStorage
    if (currentUser) {
        localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    }
    
    // Обновляем счетчик
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
    
    // Обновляем содержимое корзины
    const cartItems = document.getElementById('cart-items');
    const cartTotalSection = document.getElementById('cart-total-section');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; padding: 2rem;">Корзина пуста</p>';
        cartTotalSection.style.display = 'none';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <span style="font-size: 2rem;">${item.image}</span>
            </div>
            <div class="cart-item-info" style="flex: 1;">
                <h4>${item.name}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <div>
                        <span class="cart-item-price">${item.price} ₽ × ${item.quantity}</span>
                        <span style="margin-left: 1rem; font-weight: 600;">${item.price * item.quantity} ₽</span>
                    </div>
                    <button onclick="removeFromCart(${item.productId})" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        cartItems.appendChild(itemElement);
    });
    
    cartTotalPrice.textContent = total;
    cartTotalSection.style.display = 'block';
}

// ===== УПРАВЛЕНИЕ ЗАКАЗАМИ =====
function placeOrder(orderData) {
    if (!currentUser) {
        showNotification('Для оформления заказа войдите в аккаунт', 'error');
        showAuthModal();
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Корзина пуста', 'error');
        return;
    }
    
    const orderId = 'ORD-' + Date.now();
    const order = {
        id: orderId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: orderData.fullName,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
        shippingAddress: orderData.address,
        phone: orderData.phone,
        comment: orderData.comment
    };
    
    // Сохраняем заказ для пользователя
    let userOrders = JSON.parse(localStorage.getItem(`orders_${currentUser.id}`)) || [];
    userOrders.unshift(order);
    localStorage.setItem(`orders_${currentUser.id}`, JSON.stringify(userOrders));
    
    // Сохраняем заказ в общий список (для админа)
    let allOrdersList = JSON.parse(localStorage.getItem('allOrders')) || [];
    allOrdersList.unshift(order);
    localStorage.setItem('allOrders', JSON.stringify(allOrdersList));
    
    // Очищаем корзину
    cart = [];
    updateCart();
    
    closeCheckoutModal();
    showNotification(`Заказ ${orderId} оформлен!`, 'success');
    loadUserOrders();
    showPage('orders');
    
    // Если админ онлайн, обновляем его список
    if (currentUser.isAdmin) {
        loadAdminOrders();
    }
}

function loadUserOrders() {
    if (!currentUser) return;
    
    const ordersList = document.getElementById('orders-list');
    const userOrders = JSON.parse(localStorage.getItem(`orders_${currentUser.id}`)) || [];
    
    if (userOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; padding: 2rem;">У вас нет заказов</p>';
        return;
    }
    
    ordersList.innerHTML = '';
    
    userOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-header">
                <div>
                    <span class="order-number">Заказ ${order.id}</span>
                    <span style="margin-left: 1rem; color: #6b7280; font-size: 0.9rem;">
                        ${new Date(order.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>${item.price * item.quantity} ₽</span>
                    </div>
                `).join('')}
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; font-weight: 600; text-align: right;">
                Итого: ${order.total} ₽
            </div>
        `;
        
        ordersList.appendChild(orderElement);
    });
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Ожидает обработки',
        'processing': 'В обработке',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен'
    };
    return statuses[status] || status;
}

// ===== АДМИН ФУНКЦИИ =====
function showAdminPage() {
    if (!currentUser || !currentUser.isAdmin) {
        showNotification('Доступ запрещен', 'error');
        return;
    }
    
    showPage('admin');
    loadAdminOrders();
}

function loadAdminOrders() {
    const adminOrdersList = document.getElementById('admin-orders-list');
    const allOrdersList = JSON.parse(localStorage.getItem('allOrders')) || [];
    
    if (allOrdersList.length === 0) {
        adminOrdersList.innerHTML = '<p>Нет заказов</p>';
        return;
    }
    
    adminOrdersList.innerHTML = '';
    
    allOrdersList.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-header">
                <div>
                    <strong>${order.id}</strong>
                    <div style="font-size: 0.9rem; color: #6b7280;">
                        ${order.userName} (${order.userEmail})<br>
                        ${new Date(order.createdAt).toLocaleString()}
                    </div>
                </div>
                <div>
                    <select id="status-${order.id}" onchange="updateOrderStatus('${order.id}', this.value)" 
                            style="padding: 0.3rem; border-radius: 5px; border: 1px solid #d1d5db;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обработке</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Отправлен</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                    </select>
                </div>
            </div>
            <div style="margin: 1rem 0;">
                <div><strong>Адрес:</strong> ${order.shippingAddress}</div>
                <div><strong>Телефон:</strong> ${order.phone}</div>
                ${order.comment ? `<div><strong>Комментарий:</strong> ${order.comment}</div>` : ''}
            </div>
            <div style="margin-bottom: 1rem;">
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>${item.price * item.quantity} ₽</span>
                    </div>
                `).join('')}
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; font-weight: 600; text-align: right;">
                Итого: ${order.total} ₽
            </div>
        `;
        
        adminOrdersList.appendChild(orderElement);
    });
}

function updateOrderStatus(orderId, newStatus) {
    let allOrdersList = JSON.parse(localStorage.getItem('allOrders')) || [];
    const orderIndex = allOrdersList.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        // Обновляем в общем списке
        allOrdersList[orderIndex].status = newStatus;
        localStorage.setItem('allOrders', JSON.stringify(allOrdersList));
        
        // Обновляем у пользователя
        const order = allOrdersList[orderIndex];
        let userOrders = JSON.parse(localStorage.getItem(`orders_${order.userId}`)) || [];
        const userOrderIndex = userOrders.findIndex(o => o.id === orderId);
        
        if (userOrderIndex !== -1) {
            userOrders[userOrderIndex].status = newStatus;
            localStorage.setItem(`orders_${order.userId}`, JSON.stringify(userOrders));
        }
        
        showNotification(`Статус заказа ${orderId} обновлен`, 'success');
    }
}

// ===== УПРАВЛЕНИЕ СТРАНИЦАМИ =====
function showPage(pageId) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показываем нужную страницу
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // Загружаем данные если нужно
    if (pageId === 'products') {
        loadProducts();
    } else if (pageId === 'cart') {
        updateCart();
    } else if (pageId === 'orders') {
        loadUserOrders();
    }
}

function loadProducts() {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <div class="product-image">
                <span style="font-size: 3rem;">${product.image}</span>
            </div>
            <div class="product-info">
                <div style="color: #7c3aed; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">
                    ${product.category}
                </div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${product.price} ₽</div>
                <button onclick="addToCart(${product.id})" class="btn" style="width: 100%;">
                    <i class="fas fa-cart-plus"></i> В корзину
                </button>
            </div>
        `;
        
        productsList.appendChild(productElement);
    });
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showAuthModal(mode = 'login') {
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    
    if (mode === 'login') {
        authForm.innerHTML = `
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="auth-email" placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>Пароль</label>
                <input type="password" id="auth-password" placeholder="Пароль">
            </div>
            <button onclick="handleAuth('login')" class="btn" style="width: 100%; margin-bottom: 1rem;">Войти</button>
            <div style="text-align: center;">
                <a href="#" onclick="showAuthModal('register')" style="color: #2563eb; text-decoration: none;">
                    Нет аккаунта? Зарегистрироваться
                </a>
            </div>
        `;
        document.getElementById('auth-title').textContent = 'Вход в аккаунт';
    } else {
        authForm.innerHTML = `
            <div class="form-group">
                <label>Имя (необязательно)</label>
                <input type="text" id="auth-name" placeholder="Ваше имя">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="auth-email" placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>Пароль</label>
                <input type="password" id="auth-password" placeholder="Пароль">
            </div>
            <div class="form-group">
                <label>Подтвердите пароль</label>
                <input type="password" id="auth-confirm-password" placeholder="Пароль еще раз">
            </div>
            <button onclick="handleAuth('register')" class="btn" style="width: 100%; margin-bottom: 1rem;">Зарегистрироваться</button>
            <div style="text-align: center;">
                <a href="#" onclick="showAuthModal('login')" style="color: #2563eb; text-decoration: none;">
                    Уже есть аккаунт? Войти
                </a>
            </div>
        `;
        document.getElementById('auth-title').textContent = 'Регистрация';
    }
    
    authModal.classList.add('active');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function showCheckoutModal() {
    if (!currentUser) {
        showNotification('Для оформления заказа войдите в аккаунт', 'error');
        showAuthModal();
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Корзина пуста', 'error');
        return;
    }
    
    document.getElementById('checkout-modal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('active');
}

// ===== ФОРМА ОФОРМЛЕНИЯ ЗАКАЗА =====
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const orderData = {
        fullName: document.getElementById('full-name').value,
        email: document.getElementById('order-email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        comment: document.getElementById('comment').value
    };
    
    placeOrder(orderData);
});

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const text = document.getElementById('notification-text');
    
    notification.className = `notification ${type} active`;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    text.textContent = message;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// ===== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
function loadUserData() {
    if (!currentUser) return;
    
    // Загружаем корзину
    const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    checkAuth();
    
    // Загружаем товары
    loadProducts();
    
    // Закрытие модалок по клику вне окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Показываем главную страницу
    showPage('home');
});

// Функция для тестирования - создаем тестового пользователя
function createTestUser() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.some(u => u.email === 'test@test.com')) {
        const testUser = new User('test@test.com', 'test123', 'Тестовый Пользователь');
        users.push(testUser);
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Тестовый пользователь создан: test@test.com / test123', 'success');
    }
}
