const express = require('express');
const expressWs = require('express-ws');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Message = require('./models/message');

const app = express();
expressWs(app);

const PORT = 3000;
const MONGO_URI = 'mongodb://localhost:27017/ChatAppSprint';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'chat-app-secret',
  resave: false,
  saveUninitialized: true
}));

const backfillCreatedAt = async () => {
  try {
    const usersWithoutCreatedAt = await User.find({ createdAt: { $exists: false } });
    for (const user of usersWithoutCreatedAt) {
      user.createdAt = user._id.getTimestamp(); 
      await user.save();
    }
    console.log('Backfilled missing createdAt fields for existing users.');
  } catch (err) {
    console.error('Error backfilling createdAt:', err);
  }
};

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/');
};

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
      res.render('index/authenticated', { user: req.session.user, onlineUsers: connectedClients.size });
  } else {
      res.render('index/unauthenticated', { user: null, onlineUsers: connectedClients.size });
  }
});


app.get('/signup', (req, res) => {
  res.render('signup', { user: null, errorMessage: null });
});

app.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;

  if (role && role !== 'user' && role !== 'admin') {
    return res.status(400).send('Invalid role');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error signing up');
  }
});


app.get('/login', (req, res) => {
  res.render('login', { user: null, errorMessage: null }); 
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { user: null, errorMessage: 'Invalid username or password!' });
    }
    req.session.user = user;
    res.redirect('/chat');
  } catch (err) {
    console.error(err);
    res.render('login', { user: null, errorMessage: 'Failed to log in. Try again.' });
  }
});


app.get('/chat', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); 
    }
    res.render('index/authenticated', { user: req.session.user });
});


app.get('/profile/:username', requireLogin, async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).send('User not found');
  res.render('profile', { user });
});


app.post('/logout', (req, res) => {
  connectedClients.delete(req.session.user.username);
  req.session.destroy();
  res.redirect('/');
});

const connectedClients = new Map(); 

const broadcastUserList = () => {
  const onlineUsers = Array.from(connectedClients.keys());
  connectedClients.forEach((client) => {
    client.send(
      JSON.stringify({
        type: 'userList',
        users: onlineUsers,
      })
    );
  });
};

app.ws('/ws', (ws, req) => {
  const username = req.session?.user?.username;
  if (!username) return ws.close();

  connectedClients.set(username, ws);

  connectedClients.forEach((client) => {
    client.send(
      JSON.stringify({
        system: true,
        text: `${username} has joined the chat.`,
      })
    );
  });

  broadcastUserList();

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);

      if (!msg.text || msg.text.trim() === '') {
        ws.send(
          JSON.stringify({
            error: 'Message text is required.',
          })
        );
        return;
      }

      await Message.create({
        sender: username,
        text: msg.text,
      });

      connectedClients.forEach((client) => {
        client.send(
          JSON.stringify({
            sender: username,
            text: msg.text,
            timestamp: new Date(),
          })
        );
      });
    } catch (err) {
      console.error(err);
      ws.send(
        JSON.stringify({
          error: 'Failed to process the message.',
        })
      );
    }
  });

  ws.on('close', () => {
    connectedClients.delete(username);

    connectedClients.forEach((client) => {
      client.send(
        JSON.stringify({
          system: true,
          text: `${username} has left the chat.`,
        })
      );
    });

    broadcastUserList();
  });
});

  app.get('/admin', requireLogin, async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied.');
    }

    try {
        const users = await User.find();
        const messages = await Message.find();

        res.render('admin', { user: req.session.user, users, messages });
    } catch (error) {
        console.error('Error fetching data for admin dashboard:', error);
        res.status(500).send('Internal server error.');
    }
});

  
  app.post('/admin/delete-user/:id', requireLogin, async (req, res) => {
    if (req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }
    try {
      await User.findByIdAndDelete(req.params.id);
      res.redirect('/admin');
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to delete user.');
    }
  });

  
  