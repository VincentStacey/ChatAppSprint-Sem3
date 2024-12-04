const express = require('express');
const expressWs = require('express-ws');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');

const PORT = 3000;
//TODO: Replace with the URI pointing to your own MongoDB setup
const MONGO_URI = 'mongodb://localhost:27017/keyin_test';
const app = express();
expressWs(app);

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

let connectedClients = [];

//Note: These are (probably) not all the required routes, but are a decent starting point for the routes you'll probably need

app.ws('/ws', (socket, request) => {    
    socket.on('message', (rawMessage) => {
        const parsedMessage = JSON.parse(rawMessage);
        
    });

    socket.on('close', () => {
        
    });
});

app.get('/', async (request, response) => {
    response.render('index/unauthenticated');
});

app.get('/login', async (request, response) => {
    
});

app.get('/signup', async (request, response) => {
    return response.render('signup', {errorMessage: null});
});

app.post('/signup', async (request, response) => {

});

app.get('/dashboard', async (request, response) => {

    return response.render('index/authenticated');
});

app.get('/profile', async (request, response) => {
    
});

app.post('/logout', (request, response) => {

});

mongoose.connect(MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
    .catch((err) => console.error('MongoDB connection error:', err));

/**
 * Handles a client disconnecting from the chat server
 * 
 * This function isn't necessary and should be deleted if unused. But it's left as a hint to how you might want 
 * to handle the disconnection of clients
 * 
 * @param {string} username The username of the client who disconnected
 */
function onClientDisconnected(username) {
   
}

/**
 * Handles a new client connecting to the chat server
 * 
 * This function isn't necessary and should be deleted if unused. But it's left as a hint to how you might want 
 * to handle the connection of clients
 * 
 * @param {WebSocket} newSocket The socket the client has opened with the server
 * @param {string} username The username of the user who connected
 */
function onNewClientConnected(newSocket, username) {
    
}

/**
 * Handles a new chat message being sent from a client
 * 
 * This function isn't necessary and should be deleted if unused. But it's left as a hint to how you might want 
 * to handle new messages
 * 
 * @param {string} message The message being sent
 * @param {string} username The username of the user who sent the message
 * @param {strng} id The ID of the user who sent the message
 */
async function onNewMessage(message, username, id) {
    
}