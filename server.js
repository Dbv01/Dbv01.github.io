// server.js - Простой сервер для демонстрации
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// API для заказов
app.get('/api/orders', (req, res) => {
    if (fs.existsSync('orders.json')) {
        const orders = JSON.parse(fs.readFileSync('orders.json', 'utf8'));
        res.json(orders);
    } else {
        res.json([]);
    }
});

app.post('/api/orders', (req, res) => {
    const orders = fs.existsSync('orders.json') 
        ? JSON.parse(fs.readFileSync('orders.json', 'utf8')) 
        : [];
    
    const newOrder = {
        id: 'ORD-' + Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
    res.json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', (req, res) => {
    const orders = fs.existsSync('orders.json') 
        ? JSON.parse(fs.readFileSync('orders.json', 'utf8')) 
        : [];
    
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
        orders[index].status = req.body.status;
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('Админ: danya@admin.com / admin123');
    console.log('Тестовый пользователь: test@test.com / test123');
});
