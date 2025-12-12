// auth-script.js - Логика авторизации и корзины

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let cart = [];
let orders = [];

// ===== УПРАВЛЕНИЕ АВТОРИЗАЦИЕЙ =====
function initAuth() {
    // Проверяем, есть ли сохранённый пользователь
    const savedUser = localStorage.getItem('techstore_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        loadCart();
    }
    
    // Добавляем кнопку корзины в навигацию
    addCartToNav();
}

// Обновляем UI пользователя
function updateUserUI() {
    const userSection = document.getElementById('user-section');
    if (!userSection) return;
    
    if (currentUser) {
        const firstLetter = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase();
        userSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${firstLetter}</div>
                <span>${currentUser.name || currentUser.email}</span>
            </div>
            <button class="logout-btn" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Выйти
            </button>
        `;
    } else {
        userSection.innerHTML = `
            <button class="btn btn-outline" onclick="showAuthModal('login')">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
        `;
    }
}

// Показываем модалку авторизации
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-title');
    const form = document.getElementById('auth-form');
    
    if (mode === 'login') {
        title.textContent = 'Вход в аккаунт';
        form.innerHTML = `
            <div class="auth-form-group">
                <label>Email</label>
                <input type="email" id="auth-email" placeholder="your@email.com">
            </div>
            <div class="auth-form-group">
                <label>Пароль</label>
                <input type="password" id="auth-password" placeholder="••••••••">
            </div>
            <button type="button" class="auth-btn" onclick="handleAuth('login')">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
            <div class="auth-switch">
                Нет аккаунта? <a href="#" onclick="showAuthModal('register')">Зарегистрироваться</a>
            </div>
        `;
    } else {
        title.textContent = 'Регистрация';
        form.innerHTML = `
            <div class="auth-form-group">
                <label>Имя (необязательно)</label>
                <input type="text" id="auth-name" placeholder="Ваше имя">
            </div>
            <div class="auth-form-group">
                <label>Email</label>
                <input type="email" id="auth-email" placeholder="your@email.com">
            </div>
            <div class="auth-form-group">
                <label>Пароль</label>
                <input type="password" id="auth-password" placeholder="••••••••">
            </div>
            <div class="auth-form-group">
                <label>Подтвердите пароль</label>
                <input type="password" id="auth-confirm-password" placeholder="••••••••">
            </div>
            <button type="button" class="auth-btn" onclick="handleAuth('register')">
                <i class="fas fa-user-plus"></i> Зарегистрироваться
            </button>
            <div class="auth-switch">
                Уже есть аккаунт? <a href="#" onclick="showAuthModal('login')">Войти</a>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Закрываем модалку
function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

// Обрабатываем авторизацию
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
    let users = JSON.parse(localStorage.getItem('techstore_users')) || [];
    
    if (action === 'login') {
        // Вход
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('techstore_user', JSON.stringify(currentUser));
            closeAuthModal();
            updateUserUI();
            loadCart();
            showNotification('Успешный вход!', 'success');
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    } else {
        // Регистрация
        if (users.some(u => u.email === email)) {
            showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            email,
            password,
            name,
            isAdmin: email === 'danya@admin.com' && password === 'admin123'
        };
        
        users.push(newUser);
        localStorage.setItem('techstore_users', JSON.stringify(users));
        
        currentUser = newUser;
        localStorage.setItem('techstore_user', JSON.stringify(currentUser));
        
        closeAuthModal();
        updateUserUI();
        showNotification('Регистрация успешна!', 'success');
        
        // Если админ, показываем админку
        if (currentUser.isAdmin) {
            showAdminPanel();
        }
    }
}

// Выход
function logout() {
    currentUser = null;
    localStorage.removeItem('techstore_user');
    updateUserUI();
    cart = [];
    updateCart();
    showNotification('Вы вышли из аккаунта', 'success');
    showPage('home');
}

// ===== УПРАВЛЕНИЕ КОРЗИНОЙ =====
function addCartToNav() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const cartLink = document.createElement('a');
    cartLink.href = '#';
    cartLink.className = 'cart-link';
    cartLink.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        Корзина
        <span class="cart-count">0</span>
    `;
    cartLink.onclick = (e) => {
        e.preventDefault();
        showPage('cart');
    };
    
    navLinks.insertBefore(cartLink, navLinks.children[2]);
}

// Добавление товара в корзину
function addToCart(productName, price, category) {
    if (!currentUser) {
        showNotification('Для добавления в корзину войдите в аккаунт', 'error');
        showAuthModal('login');
        return;
    }
    
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: Date.now(),
            name: productName,
            price: price,
            category: category,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${productName} добавлен в корзину`, 'success');
}

// Обновление корзины
function updateCart() {
    // Сохраняем корзину
    if (currentUser) {
        localStorage.setItem(`techstore_cart_${currentUser.id}`, JSON.stringify(cart));
    }
    
    // Обновляем счетчик
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    // Обновляем страницу корзины
    updateCartPage();
}

// Обновление страницы корзины
function updateCartPage() {
    const cartContainer = document.getElementById('cart-items-container');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    const cartTotal = document.getElementById('cart-total-price');
    
    if (!cartContainer || !emptyCart || !cartSummary) return;
    
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartContainer.style.display = 'none';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartContainer.style.display = 'block';
    cartSummary.style.display = 'block';
    
    // Обновляем список товаров
    cartContainer.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <div class="cart-item-icon">
                    ${getCategoryIcon(item.category)}
                </div>
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-category">${item.category}</div>
                <div class="cart-item-price">${item.price} ₽ × ${item.quantity}</div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
        
        cartContainer.appendChild(itemElement);
    });
    
    // Обновляем итоговую сумму
    if (cartTotal) {
        cartTotal.textContent = total;
    }
    
    // Обновляем общую сумму в корзине
    const cartTotalPrice = document.querySelector('.cart-total-price');
    if (cartTotalPrice) {
        cartTotalPrice.textContent = total;
    }
}

// Обновление количества товара
function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) {
            removeFromCart(itemId);
        } else {
            updateCart();
        }
    }
}

// Удаление товара из корзины
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCart();
}

// Загрузка корзины из localStorage
function loadCart() {
    if (!currentUser) return;
    
    const savedCart = localStorage.getItem(`techstore_cart_${currentUser.id}`);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Оформление заказа
function checkout() {
    if (!currentUser) {
        showNotification('Для оформления заказа войдите в аккаунт', 'error');
        showAuthModal('login');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Корзина пуста', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = {
        id: 'ORD-' + Date.now(),
        userId: currentUser.id,
        items: [...cart],
        total: total,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    // Сохраняем заказ
    let userOrders = JSON.parse(localStorage.getItem(`techstore_orders_${currentUser.id}`)) || [];
    userOrders.unshift(order);
    localStorage.setItem(`techstore_orders_${currentUser.id}`, JSON.stringify(userOrders));
    
    // Очищаем корзину
    cart = [];
    updateCart();
    
    showNotification(`Заказ ${order.id} оформлен! Сумма: ${total} ₽`, 'success');
}

// ===== УТИЛИТЫ =====
function getCategoryIcon(category) {
    switch(category) {
        case 'Смартфоны': return '📱';
        case 'Телевизоры': return '📺';
        case 'Ноутбуки': return '💻';
        default: return '📦';
    }
}

function showNotification(message, type = 'success') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        </div>
        <div class="notification-text">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем
    setTimeout(() => notification.classList.add('active'), 10);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    
    // Закрытие модалок
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Закрытие по клику вне модалки
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});
