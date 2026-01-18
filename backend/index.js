const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const auth = require('./auth');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create HTTP server and Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Join user-specific room
  socket.join(`user:${socket.userId}`);
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Helper to emit to user
const emitToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ProsjektRavn API is running' });
});

// ============ AUTH ============

app.post('/api/auth/register', (req, res) => {
  auth.register(req, res, pool);
});

app.post('/api/auth/login', (req, res) => {
  auth.login(req, res, pool);
});

app.get('/api/auth/me', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PROJECTS ============

app.get('/api/projects', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', auth.authenticate, async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, color, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, color, req.user.userId]
    );
    const project = result.rows[0];
    emitToUser(req.user.userId, 'project:created', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', auth.authenticate, async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, color = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, description, color, req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = result.rows[0];
    emitToUser(req.user.userId, 'project:updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    emitToUser(req.user.userId, 'project:deleted', { id: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TASKS ============

app.get('/api/tasks', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:projectId/tasks', auth.authenticate, async (req, res) => {
  try {
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.user.userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [req.params.projectId, req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', auth.authenticate, async (req, res) => {
  const { title, description, status = 'pending', priority, due_date, project_id, assigned_to } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, status, priority, due_date, project_id, assigned_to, req.user.userId]
    );
    const task = result.rows[0];
    emitToUser(req.user.userId, 'task:created', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', auth.authenticate, async (req, res) => {
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assigned_to = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
      [title, description, status, priority, due_date, assigned_to, req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = result.rows[0];
    emitToUser(req.user.userId, 'task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    emitToUser(req.user.userId, 'task:deleted', { id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ NOTIFICATIONS ============

app.post('/api/notifications/register', auth.authenticate, async (req, res) => {
  const { token } = req.body;
  try {
    await pool.query(
      `INSERT INTO fcm_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT (user_id, token) DO NOTHING`,
      [req.user.userId, token]
    );
    res.json({ message: 'Token registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DOCUMENTS ============

app.get('/api/documents', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', auth.authenticate, async (req, res) => {
  const { title, content, folder } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO documents (user_id, title, content, folder) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, title, content, folder || 'General']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', auth.authenticate, async (req, res) => {
  const { title, content, folder } = req.body;
  try {
    const result = await pool.query(
      'UPDATE documents SET title = $1, content = $2, folder = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, content, folder, req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FILES ============

app.get('/api/files', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files', auth.authenticate, async (req, res) => {
  const { name, type, size } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO files (user_id, name, type, size) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, type, size]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/files/:id/status', auth.authenticate, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE files SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/files/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ RESOURCES ============

app.get('/api/resources', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM resources WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', auth.authenticate, async (req, res) => {
  const { name, role, capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO resources (user_id, name, role, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, role, capacity || 40]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/resources/:id', auth.authenticate, async (req, res) => {
  const { name, role, capacity } = req.body;
  try {
    const result = await pool.query(
      'UPDATE resources SET name = $1, role = $2, capacity = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, role, capacity, req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resources/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM resources WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TEAM MEMBERS ============

app.get('/api/team', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/team', auth.authenticate, async (req, res) => {
  const { name, email, role, avatar } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO team_members (user_id, name, email, role, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, name, email, role, avatar || '👤']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/team/:id', auth.authenticate, async (req, res) => {
  const { name, email, role, avatar } = req.body;
  try {
    const result = await pool.query(
      'UPDATE team_members SET name = $1, email = $2, role = $3, avatar = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, email, role, avatar, req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/team/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM team_members WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json({ message: 'Team member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ COMMENTS ============

app.get('/api/comments', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:taskId/comments', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE task_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [req.params.taskId, req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comments', auth.authenticate, async (req, res) => {
  const { task_id, author, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, task_id, author, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, task_id, author, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', auth.authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});