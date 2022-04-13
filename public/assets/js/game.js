/**
 *  Game js
 */

 const socket = io();
 const startEl = document.querySelector('#start');
 const gameWrapperEl = document.querySelector('#game-wrapper');
 const usernameForm = document.querySelector('#username-form');
 const gameForm = document.querySelector('#form-div');
 const gameUl = document.querySelector('#gameUl');
 
 
 let room = null;
 let username = null;
 
 const addVirus = (message, ownMsg = false) => {
	 // create new `li` element
	 const liEl = document.createElement('li');
 
	 // set class of `li` to `message`
	 liEl.classList.add('message');
 
	 if (ownMsg) {
		 liEl.classList.add('you');
	 }
 
	 // get human readable time
	 const time = moment(message.timestamp).format('HH:mm:ss');

	 liEl.scrollIntoView();
 }
 
 
 const addNoticeToChat = notice => {
	 const liEl = document.createElement('li');
	 liEl.classList.add('notice');
 
	 liEl.innerText = notice;
 
	 liEl.scrollIntoView();
 }
 
 const resetScore = () => {
	 addPointsToCurrentUser(0, 0),
	 addPointsToEnemyUser(0, 0)
 }
 
 // handels points
 const addPointsToCurrentUser = (points, time) => {
	 const pointEl = document.querySelector('[data-your-score]');
	 const timeEl = document.querySelector('#time');
	 pointEl.textContent = points;
	 timeEl.textContent = time
 }
 
 const addPointsToEnemyUser = (points, time) => {
	 const pointEl = document.querySelector('[data-computer-score]');
	 const timeEl = document.querySelector('#enemy-time');
	 pointEl.textContent = points
	 timeEl.textContent = time
 }
 
 const addPoints = (user, points, time) => {
	 if (user === username) {
		 addPointsToCurrentUser(points, time)
	 } else {
		 addPointsToEnemyUser(points, time)
	 }
 }
 
 const endGame = (username) => {
	 alert(username + ' wins the game!');
	 virus.style.display = 'none';
	 document.querySelector('#startGame').style.display = 'block';
 
 }
 
 // update user list
 const updateUserList = users => {
	 document.querySelector('#online-users').innerHTML =
		 Object.values(users).map(username => `<li><span class="fa-solid fa-user-astronaut"></span> ${username}</li>`).join("");
 }
 
 // listen for when a new user connects
 socket.on('user:connected', (username) => {
	 addNoticeToChat(`${username} connected 🥳`);
 });
 
 // listen for when a user disconnects
 socket.on('user:disconnected', (username) => {
	 addNoticeToChat(`${username} disconnected 😢`);
 });
 
 // listen for when we receive an updated list of online users (in this room)
 socket.on('user:list', users => {
	 updateUserList(users);
 })
 
 // listen for when we're disconnected
 socket.on('disconnect', (reason) => {
	 if (reason === 'io server disconnect') {
		 // reconnect to the server
		 socket.connect();
	 }
	 addNoticeToChat(`You were disconnected. Reason: ${reason} 😳`);
 });
 
 // listen for when we're reconnected
 socket.on('reconnect', () => {
	 // join room? but only if we were in the chat previously
	 if (username) {
		 socket.emit('user:joined', username, room, (status) => {
			 addNoticeToChat(`You reconnected 🥳`);
		 });
	 }
 });
 
 socket.on('damageDone', (username, time, row, column) => {
	 makeVirus(row, column);
 })
 
 const startGame = () => {
	 socket.emit('room:startGame', room)
	 document.querySelector('#startGame').style.display = 'none'
	 virus.style.display = 'block';
	 resetScore()
 }
 
 socket.on('startGame', (username, time, row, column) => {
	 makeVirus(row, column);
 })
 
 
 // Test randomize makes virus jump all the time
 socket.on('room:randomize', (row, column) => {
	 makeVirus(row, column);
 })
 
 socket.on('room:point', (username, userpoint, time) => {
	 //addNoticeToChat(`Damage done from ${username} in ${userpoint}`);
	 addPoints(username, userpoint, time);
 })
 
 socket.on('room:endgame', (username) => {
	 endGame(username);
 })
 
 // listen for incoming messages
 socket.on('game:message', message => {
	 console.log("Someone said something:", message);
 
	 addVirus(message);
 });
 
 // get username and room from form and emit `user:joined` and then show chat
 usernameForm.addEventListener('submit', e => {
	 e.preventDefault();
 
	 room = usernameForm.room.value;
	 username = usernameForm.username.value;
	 
	 console.log(`User ${username} wants to join room '${room}'s`);
	 
	 socket.emit('user:joined', username, room, (status) => {
		 // we've received acknowledgement from the server
		 console.log("Server acknowledged that user joined", status);
		 if (status.success) {
			 // hide start view
			 startEl.classList.add('hide');
 
			 // show view
			 gameWrapperEl.classList.remove('hide');
 
			 // set room name as game title game-title
			 document.querySelector('#room').innerText = status.roomName;
 
			 // update list of users in room
			 updateUserList(status.users);
		 } else {
			 alert('Room is full')
		 }
	 });
 });
 
 // send gameForm to server
 gameForm.addEventListener('submit', e => {
	 e.preventDefault();
 
	 if (!gameUl.value) {
		 return;
	 }
 
	 const msg = {
		 username,
		 room,
		 content: gameUl.value,
		 timestamp: Date.now(),
	 }
 
	 // send game to server
	 socket.emit('chat:message', msg);
 
	 // add virus
	 addVirus(msg, true);
 
	 // clear game input element and focus
	 gameUl.value = '';
	 gameUl.focus();
 });
 
 
 
  "use strict";  
  const container = document.querySelector(".container");
  const users = document.querySelector(".users");
  const virus = document.createElement("img");
  virus.setAttribute("id", "virus-icon");
  virus.setAttribute('style', `grid-column-start: ${8}; grid-row-start: ${8}`)
  virus.setAttribute("src", "assets/icons/corona-virus.svg");
 
 const changeVirusPosition = (row, column) => {
	 virus.style.gridColumnStart = column;
	 virus.style.gridRowStart = row;
 }
 
 let clickedTime, createdTime, reactionTime;
 
 makeVirus = (row, column) => {
	 container.appendChild(virus);
 
	let time = Math.random();
	time=time*5000;
	
	setTimeout(function() {
	  if (Math.random() > 0.5) {
		virus.style.borderRadius="100px";
	  } else {
		virus.style.borderRadius="0";
	  }
	  
	  let top=Math.random();
	  top=top*300;
	  
	  let left=Math.random();
	  left=left*500;
	  
	  changeVirusPosition(row, column);
	  
	  document.getElementById("virus-icon").style.display = "block";
	  createdTime = Date.now();
	}, time);
  }
 
  virus.onclick = function() {
	clickedTime = Date.now();
	reactionTime = (clickedTime-createdTime)/1000;
	document.getElementById("time").innerHTML = reactionTime;
	  this.style.display = "none";
	  socket.emit('user:fire', username, room, reactionTime);
  }
 