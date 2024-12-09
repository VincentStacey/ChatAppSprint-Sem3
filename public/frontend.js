const ws = new WebSocket(`ws://${window.location.host}/ws`);

// Handle incoming WebSocket messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.system) {
    const systemMessage = `<li class="system-message">${message.text}</li>`;
    document.getElementById('messages').innerHTML += systemMessage;
  } else {
    const chatMessage = `
      <li class="chat-message">
        <strong>${message.sender}</strong>: ${message.text} 
        <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
      </li>`;
    document.getElementById('messages').innerHTML += chatMessage;
  }
};

// Send messages when the form is submitted
document.getElementById('message-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const messageInput = document.getElementById('message-input');
  const text = messageInput.value.trim();

  if (text) {
    ws.send(JSON.stringify({ text }));
    messageInput.value = ''; 
  } else {
    alert('Message cannot be empty.');
  }
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
  
    if (message.type === 'userList') {
      const userList = document.getElementById('user-list');
      userList.innerHTML = ''; 
      message.users.forEach((user) => {
        const listItem = document.createElement('li');
        listItem.textContent = user;
        userList.appendChild(listItem);
      });
    } else if (message.system) {
      
      const systemMessage = `<li class="system-message">${message.text}</li>`;
      document.getElementById('messages').innerHTML += systemMessage;
    } else {
      
      const chatMessage = `
        <li class="chat-message">
          <strong>${message.sender}</strong>: ${message.text}
          <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </li>`;
      document.getElementById('messages').innerHTML += chatMessage;
    }
  };
});

