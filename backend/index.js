const http = require('http');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const pool = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

async function ensureMessageImageColumn() {
  try {
    await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT');
  } catch (error) {
    console.warn('Message image column check note:', error.message);
  }
}

// Setup Socket.IO with CORS for frontend communication
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware for Express REST endpoints
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Fallback decoding for Supabase/OAuth tokens
      try {
        const decoded = jwt.decode(token);
        if (decoded && (decoded.sub || decoded.email)) {
          req.user = {
            id: decoded.sub || decoded.id,
            email: decoded.email,
            name: decoded.user_metadata?.name || decoded.email?.split('@')[0] || 'User',
          };
          return next();
        }
      } catch (e) {}
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// Helper: Ensure user exists in PostgreSQL users table and return numeric ID
async function resolveDbUserId(user) {
  if (!user) return 1;

  try {
    const email = user.email ? user.email.toLowerCase().trim() : '';
    if (email) {
      const res = await pool.query('SELECT id, name FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
      if (res.rows.length > 0) {
        return res.rows[0].id;
      }
      const ins = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [user.name || email.split('@')[0], email, 'oauth-managed-auth']
      );
      return ins.rows[0].id;
    }
    if (Number.isInteger(Number(user.id))) {
      return Number(user.id);
    }
  } catch (err) {
    console.warn('resolveDbUserId fallback note:', err.message);
  }

  // Fallback to first existing user
  try {
    const fallback = await pool.query('SELECT id FROM users LIMIT 1');
    return fallback.rows[0]?.id || 1;
  } catch {
    return 1;
  }
}

// ----------------------------------------------------
// REST ROUTES: AUTHENTICATION
// ----------------------------------------------------

// POST /signup - Register a new user
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, email, password) are required.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);

    if (userCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUserResult = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const newUser = newUserResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('Error during user signup:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// POST /login - Authenticate user and return JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = userResult.rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error during user login:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// ----------------------------------------------------
// REST ROUTES: CHANNELS & MESSAGES
// ----------------------------------------------------

// Helper: Ensure default workspace and channels exist in PostgreSQL
async function ensureDefaultChannels() {
  try {
    let wsResult = await pool.query('SELECT id FROM workspaces LIMIT 1');
    let workspaceId;

    if (wsResult.rows.length === 0) {
      let userRes = await pool.query('SELECT id FROM users LIMIT 1');
      let ownerId;
      if (userRes.rows.length > 0) {
        ownerId = userRes.rows[0].id;
      } else {
        const dummyHash = await bcrypt.hash('system-default-password', 10);
        const sysUser = await pool.query(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
          ['Aura System', 'system@aura.local', dummyHash]
        );
        ownerId = sysUser.rows[0].id;
      }

      const newWs = await pool.query(
        'INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id',
        ['Aura Workspace', ownerId]
      );
      workspaceId = newWs.rows[0].id;
    } else {
      workspaceId = wsResult.rows[0].id;
    }

    const defaultChannelNames = ['general', 'announcements', 'random'];
    for (const chName of defaultChannelNames) {
      const chCheck = await pool.query(
        'SELECT id FROM channels WHERE workspace_id = $1 AND LOWER(name) = LOWER($2)',
        [workspaceId, chName]
      );
      if (chCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO channels (workspace_id, name) VALUES ($1, $2)',
          [workspaceId, chName]
        );
      }
    }
  } catch (err) {
    console.warn('Default channels check note:', err.message);
  }
}

// GET /channels - Fetch list of available channels
app.get('/channels', async (req, res) => {
  try {
    await ensureDefaultChannels();
    const channelsResult = await pool.query('SELECT id, name, created_at FROM channels ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      channels: channelsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.status(200).json({
      success: true,
      channels: [
        { id: 1, name: 'general' },
        { id: 2, name: 'announcements' },
        { id: 3, name: 'random' },
      ],
    });
  }
});

// GET /channels/:channelIdentifier/messages - Load message history for a channel
app.get('/channels/:channelIdentifier/messages', async (req, res) => {
  const { channelIdentifier } = req.params;

  try {
    let query;
    let params;

    if (isNaN(channelIdentifier)) {
      query = `
        SELECT m.id, m.content as text, m.created_at, m.channel_id, m.image_url,
               u.id as user_id, u.name as sender, u.email as sender_email
        FROM messages m
        JOIN channels c ON m.channel_id = c.id
        JOIN users u ON m.user_id = u.id
        WHERE LOWER(c.name) = LOWER($1)
        ORDER BY m.created_at ASC
        LIMIT 100;
      `;
      params = [channelIdentifier];
    } else {
      query = `
        SELECT m.id, m.content as text, m.created_at, m.channel_id, m.image_url,
               u.id as user_id, u.name as sender, u.email as sender_email
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.channel_id = $1
        ORDER BY m.created_at ASC
        LIMIT 100;
      `;
      params = [parseInt(channelIdentifier, 10)];
    }

    const result = await pool.query(query, params);

    const formattedMessages = result.rows.map((row) => ({
      id: row.id,
      channelId: row.channel_id,
      text: row.text || '',
      imageUrl: row.image_url || null,
      sender: row.sender,
      userId: row.user_id,
      senderEmail: row.sender_email,
      createdAt: row.created_at,
      time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(200).json({ success: true, messages: [] });
  }
});

// POST /channels/:channelIdentifier/messages - Send a message via REST & Broadcast via Socket
app.post('/channels/:channelIdentifier/messages', authenticateToken, async (req, res) => {
  const { channelIdentifier } = req.params;
  // Accept senderName/Email/Id from body as fallback for Supabase users
  const { text, imageUrl, senderName: bodySenderName, senderEmail: bodySenderEmail } = req.body;
  const user = req.user;

  const trimmedText = typeof text === 'string' ? text.trim() : '';
  const normalizedImageUrl = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;

  if (!trimmedText && !normalizedImageUrl) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  try {
    // 1. Resolve channel ID
    let channelId;
    if (isNaN(channelIdentifier)) {
      let chRes = await pool.query('SELECT id FROM channels WHERE LOWER(name) = LOWER($1) LIMIT 1', [channelIdentifier]);
      if (chRes.rows.length === 0) {
        const wsRes = await pool.query('SELECT id FROM workspaces LIMIT 1');
        const wsId = wsRes.rows[0]?.id || 1;
        const newCh = await pool.query('INSERT INTO channels (workspace_id, name) VALUES ($1, $2) RETURNING id', [wsId, channelIdentifier]);
        channelId = newCh.rows[0].id;
      } else {
        channelId = chRes.rows[0].id;
      }
    } else {
      channelId = parseInt(channelIdentifier, 10);
    }

    // 2. Resolve DB user ID (merges Supabase user with our users table)
    const mergedUser = {
      ...user,
      email: user.email || bodySenderEmail || '',
      name: user.name || bodySenderName || user.email?.split('@')[0] || 'User',
    };
    const dbUserId = await resolveDbUserId(mergedUser);

    // 3. Insert into PostgreSQL messages table (Source of Truth)
    const insertResult = await pool.query(
      'INSERT INTO messages (channel_id, user_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING id, content, image_url, created_at',
      [channelId, dbUserId, trimmedText, normalizedImageUrl]
    );

    const savedMessage = insertResult.rows[0];
    const senderName = mergedUser.name;

    // 4. Construct payload
    const messagePayload = {
      id: savedMessage.id,
      channelId: channelId,
      channelName: isNaN(channelIdentifier) ? channelIdentifier : undefined,
      text: savedMessage.content || '',
      imageUrl: savedMessage.image_url || null,
      sender: senderName,
      userId: user.id || dbUserId,
      senderEmail: mergedUser.email || '',
      createdAt: savedMessage.created_at,
      time: new Date(savedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 5. Broadcast to Socket.IO Channel Room
    io.to(`channel_${channelId}`).emit('new-message', messagePayload);
    if (isNaN(channelIdentifier)) {
      io.to(`channel_${channelIdentifier.toLowerCase()}`).emit('new-message', messagePayload);
    }

    return res.status(201).json({
      success: true,
      message: messagePayload,
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return res.status(500).json({ success: false, message: 'Failed to save message to database.' });
  }
});

// ----------------------------------------------------
// SOCKET.IO REAL-TIME EVENT HANDLERS
// ----------------------------------------------------

// Maintain online users in server memory (userId -> Set of socketIds)
const onlineUsers = new Map(); // userId -> { user: { id, name, email }, sockets: Set }

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  const userPayload = socket.handshake.auth?.user;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, name, email }
    } catch (err) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && (decoded.sub || decoded.email)) {
          socket.user = {
            id: decoded.sub || decoded.id,
            email: decoded.email,
            name: decoded.user_metadata?.name || decoded.email?.split('@')[0] || 'User',
          };
        }
      } catch (e) {}
    }
  }

  if (!socket.user && userPayload) {
    socket.user = userPayload;
  }

  next();
});

io.on('connection', (socket) => {
  const user = socket.user;

  // Handle Online Presence
  if (user && (user.id || user.email)) {
    const userKey = user.id || user.email;

    if (!onlineUsers.has(userKey)) {
      onlineUsers.set(userKey, {
        user: { id: user.id || userKey, name: user.name || user.email?.split('@')[0] || 'User', email: user.email },
        sockets: new Set([socket.id]),
      });
    } else {
      onlineUsers.get(userKey).sockets.add(socket.id);
    }

    // Broadcast updated online presence to all connected clients
    const onlineList = Array.from(onlineUsers.values()).map((entry) => entry.user);
    io.emit('presence:update', onlineList);
  }

  // --- Channel Rooms: Join Channel ---
  socket.on('join-channel', (channelIdentifier) => {
    if (!channelIdentifier) return;
    const roomName = `channel_${String(channelIdentifier).toLowerCase()}`;

    // Leave prior channel room if switching
    if (socket.currentRoom && socket.currentRoom !== roomName) {
      socket.leave(socket.currentRoom);
    }

    socket.join(roomName);
    socket.currentRoom = roomName;
    socket.currentChannel = channelIdentifier;
  });

  // --- Channel Rooms: Leave Channel ---
  socket.on('leave-channel', (channelIdentifier) => {
    if (!channelIdentifier) return;
    const roomName = `channel_${String(channelIdentifier).toLowerCase()}`;
    socket.leave(roomName);
    if (socket.currentRoom === roomName) {
      socket.currentRoom = null;
      socket.currentChannel = null;
    }
  });

  // --- Real-Time Message via Socket ---
  socket.on('send-message', async (data) => {
    const { channelIdentifier, text, imageUrl } = data;
    const sender = socket.user;
    const trimmedText = typeof text === 'string' ? text.trim() : '';
    const normalizedImageUrl = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;
    if ((!trimmedText && !normalizedImageUrl) || !sender) return;

    try {
      let channelId;
      if (isNaN(channelIdentifier)) {
        let chRes = await pool.query('SELECT id FROM channels WHERE LOWER(name) = LOWER($1) LIMIT 1', [channelIdentifier]);
        if (chRes.rows.length === 0) {
          const wsRes = await pool.query('SELECT id FROM workspaces LIMIT 1');
          const wsId = wsRes.rows[0]?.id || 1;
          const newCh = await pool.query('INSERT INTO channels (workspace_id, name) VALUES ($1, $2) RETURNING id', [wsId, channelIdentifier]);
          channelId = newCh.rows[0].id;
        } else {
          channelId = chRes.rows[0].id;
        }
      } else {
        channelId = parseInt(channelIdentifier, 10);
      }

      const dbUserId = await resolveDbUserId(sender);

      // Save to PostgreSQL (Source of Truth)
      const insertResult = await pool.query(
        'INSERT INTO messages (channel_id, user_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING id, content, image_url, created_at',
        [channelId, dbUserId, trimmedText, normalizedImageUrl]
      );
      const savedMsg = insertResult.rows[0];

      const messagePayload = {
        id: savedMsg.id,
        channelId: channelId,
        channelName: isNaN(channelIdentifier) ? channelIdentifier : undefined,
        text: savedMsg.content || '',
        imageUrl: savedMsg.image_url || null,
        sender: sender.name || sender.email?.split('@')[0] || 'User',
        userId: sender.id || dbUserId,
        senderEmail: sender.email || '',
        createdAt: savedMsg.created_at,
        time: new Date(savedMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Broadcast to room
      const roomName = `channel_${String(channelIdentifier).toLowerCase()}`;
      io.to(roomName).emit('new-message', messagePayload);
      io.to(`channel_${channelId}`).emit('new-message', messagePayload);
    } catch (err) {
      console.error('Socket message save error:', err);
    }
  });

  // --- Real-Time Typing Indicator: Start ---
  socket.on('typing:start', ({ channelIdentifier, userName }) => {
    if (!channelIdentifier) return;
    const roomName = `channel_${String(channelIdentifier).toLowerCase()}`;
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(roomName).emit('user-typing', {
      channelIdentifier,
      userName: socket.user?.name || userName || 'Someone',
      userId: socket.user?.id,
    });
  });

  // --- Real-Time Typing Indicator: Stop ---
  socket.on('typing:stop', ({ channelIdentifier, userName }) => {
    if (!channelIdentifier) return;
    const roomName = `channel_${String(channelIdentifier).toLowerCase()}`;
    socket.to(roomName).emit('user-stop-typing', {
      channelIdentifier,
      userName: socket.user?.name || userName || 'Someone',
      userId: socket.user?.id,
    });
  });

  // --- Handle Disconnection ---
  socket.on('disconnect', () => {
    if (user && (user.id || user.email)) {
      const userKey = user.id || user.email;
      if (onlineUsers.has(userKey)) {
        const userEntry = onlineUsers.get(userKey);
        userEntry.sockets.delete(socket.id);

        if (userEntry.sockets.size === 0) {
          onlineUsers.delete(userKey);
        }

        // Broadcast updated online presence
        const onlineList = Array.from(onlineUsers.values()).map((entry) => entry.user);
        io.emit('presence:update', onlineList);
      }
    }
  });
});

// Start Server with both Express & Socket.IO on the same HTTP server
ensureMessageImageColumn().finally(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Aura Backend & Socket.IO server running on http://localhost:${PORT}`);
  });
});
