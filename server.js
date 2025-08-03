// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key'; // Use env var in production
let users = [];
let budgets = [];

// Public routes (no auth)
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (users.some(user => user.username === username || user.email === email)) {
    return res.status(409).json({ message: 'Username or email already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  users.push({ userId, username, email, password: hashedPassword });
  const token = jwt.sign({ userId, username }, SECRET_KEY, { expiresIn: '1h' });
  res.status(201).json({ token, userId, username });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  const token = jwt.sign({ userId: user.userId, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, userId: user.userId, username: user.username });
});

// Protected routes (use verifyToken middleware)
app.post('/api/income', verifyToken, (req, res) => {
  const { id, source, amount, frequency, date, month, year } = req.body;  // Include id if sent by client
  budgets.push({ userId: req.user.userId, type: 'income', data: { id, source, amount, frequency, date }, month, year });
  res.status(201).json({ message: 'Income added' });
});

app.post('/api/expense', verifyToken, (req, res) => {
  const { id, description, amount, category, date, month, year } = req.body;
  budgets.push({ userId: req.user.userId, type: 'expense', data: { id, description, amount, category, date }, month, year });
  res.status(201).json({ message: 'Expense added' });
});

app.post('/api/savings', verifyToken, (req, res) => {
  const { id, description, amount, category, date, month, year } = req.body;
  budgets.push({ userId: req.user.userId, type: 'savings', data: { id, description, amount, category, date }, month, year });
  res.status(201).json({ message: 'Savings added' });
});

app.post('/api/goals', verifyToken, (req, res) => {
  const { id, description, amount, date, type, saved, monthlyTarget, month, year } = req.body;
  budgets.push({ userId: req.user.userId, type: 'goal', data: { id, description, amount, date, type, saved, monthlyTarget }, month: month || null, year: year || null });
  res.status(201).json({ message: 'Goal added' });
});

app.put('/api/goals/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const updatedGoal = req.body;
  let found = false;
  budgets = budgets.map(b => {
    if (b.userId === req.user.userId && b.type === 'goal' && b.data.id === id) {
      found = true;
      return { ...b, data: { ...b.data, ...updatedGoal } };
    }
    return b;
  });
  if (!found) return res.status(404).json({ message: 'Goal not found' });
  res.json({ message: 'Goal updated' });
});

app.delete('/api/goals/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  budgets = budgets.filter(b => !(b.userId === req.user.userId && b.type === 'goal' && b.data.id === id));
  res.json({ message: 'Goal deleted' });
});

app.post('/api/budget', verifyToken, (req, res) => {
  const incomes = req.body.incomes || [];
  const expenses = req.body.expenses || [];
  const savings = req.body.savings || [];
  const goals = req.body.goals || [];
  const month = req.body.month;
  const year = req.body.year;
  budgets = budgets.filter(b => !(b.userId === req.user.userId && b.month === month && b.year === year));
  incomes.forEach(data => budgets.push({ userId: req.user.userId, type: 'income', data, month, year }));
  expenses.forEach(data => budgets.push({ userId: req.user.userId, type: 'expense', data, month, year }));
  savings.forEach(data => budgets.push({ userId: req.user.userId, type: 'savings', data, month, year }));
  goals.forEach(data => budgets.push({ userId: req.user.userId, type: 'goal', data, month, year }));
  res.status(201).json({ message: 'Budget saved' });
});

app.get('/api/budget', verifyToken, (req, res) => {
  const { month, year } = req.query;
  const userBudget = budgets.filter(b => b.userId === req.user.userId && b.month === month && b.year === year);
  res.json({
    incomes: userBudget.filter(b => b.type === 'income').map(b => b.data),
    expenses: userBudget.filter(b => b.type === 'expense').map(b => b.data),
    savings: userBudget.filter(b => b.type === 'savings').map(b => b.data),
    goals: userBudget.filter(b => b.type === 'goal').map(b => b.data)
  });
});

app.post('/api/budget/reset', verifyToken, (req, res) => {
  const { month, year } = req.body;
  budgets = budgets.filter(b => !(b.userId === req.user.userId && b.month === month && b.year === year));
  res.json({ message: 'Budget reset' });
});

// Add GET /api/goals for client compatibility (if needed)
app.get('/api/goals', verifyToken, (req, res) => {
  const userGoals = budgets.filter(b => b.userId === req.user.userId && b.type === 'goal').map(b => b.data);
  res.json(userGoals);
});

// Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

app.listen(3000, () => console.log('Server running on port 3000'));