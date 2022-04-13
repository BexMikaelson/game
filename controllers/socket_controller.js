/***
 *
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");
let io = null; 

// list of rooms and their connected users
const MAX_POINTS = 10;
const users = {};
const rooms = [
  {
    id: "room1",
    name: "Room one",
    users: {},
  },
  {
    id: "room2",
    name: "Room two",
    users: {},
  },
  {
    id: "room3",
    name: "Room three",
    users: {},
  },
  {
    id: "room4",
    name: "Room four",
    users: {},
  },
];

const handleDisconnect = function () {
  debug(`Client ${this.id} disconnected :(`);
  // find the room that this socket is part of
  const room = rooms.find((chatroom) => chatroom.users.hasOwnProperty(this.id));
  
  // if socket was not in a room, don't broadcast disconnect
  if (!room) {
    return;
  }

  if (room) {
    room.gameStarted = false
  }
  // let everyone in the room know that this user has disconnected
  this.broadcast.to(room.id).emit("user:disconnected", room.users[this.id]);

  // remove user from list of users in that room
  delete room.users[this.id];

  // broadcast list of users in room to all connected sockets EXCEPT ourselves
  this.broadcast.to(room.id).emit("user:list", room.users);
};

// Handle when a user has joined the chat
const handleUserJoined = function (username, room_id, callback) {
  debug(
    `User ${username} with socket id ${this.id} wants to join room '${room_id}'`
  );
  const room = rooms.find((chatroom) => chatroom.id === room_id);


  if (Object.keys(room.users).length === 2) {
    return callback({
      success: false,
      roomName: room.name,
      users: room.users,
    });
  }

  // join room
  this.join(room_id);


  // b) add socket to room's `users` object
  room.users[this.id] = username;


  // let everyone know that someone has connected to the game
  this.broadcast.to(room.id).emit("user:connected", username);

  // confirm join
  callback({
    success: true,
    roomName: room.name,
    users: room.users,
  });

  // broadcast list of users in room to all connected sockets EXCEPT ourselves
  this.broadcast.to(room.id).emit("user:list", room.users);
};

function randomColumnRow() {
  return Math.ceil(Math.random() * 8);
}

const handleStartGame = function (room_id) {
  const speedToMakeVirus = 3000;
  const row = randomColumnRow();
  const column = randomColumnRow();
  const room = rooms.find((rom) => rom.id === room_id);
  room.points = [];
  room.gameStarted = true;
	room.interval = setInterval(() => {
		randomize()
	}, speedToMakeVirus)
  io.to(room.id).emit("startGame", row, column);
}

// Handle when a user has joined the game
const handleUserFire = function (username, room_id, time) {

  const row = randomColumnRow();
  const column = randomColumnRow();

  const room = rooms.find((rom) => rom.id === room_id);

  if (!room.points) {
    room.points = [];
  }
  const currentPoint = {
    username: username,
    point: 1,
		time: time,
  };

  room.points.push(currentPoint);

  let userpoint = 0;
  room.points.forEach((eachPoint) => {
    if (username === eachPoint.username) {
      userpoint = userpoint + eachPoint.point;
    }

    console.log({userpoint});
  });

  // console.log({ room, username, time });
  io.to(room.id).emit("room:point", username, userpoint, time);
  
  if (userpoint === MAX_POINTS) {
    return handleEndGame(username, room.id)
  }
  io.to(room.id).emit("damageDone", username, time, row, column);
};

const handleEndGame = (username, room_id) => {
  const room = rooms.find((rom) => rom.id === room_id);
  room.gameStarted = false;
  clearInterval(room.interval)
  io.to(room_id).emit("room:endgame", username);
}

// Test Randomize makes virus jump all the time
const randomize = function (username, room_id, time) {
  function randomColumnRow() {
    return Math.ceil(Math.random() * 8);
  }
  const row = randomColumnRow();
  const column = randomColumnRow();
  rooms.forEach(room => {
    if (room.gameStarted) {
      io.to(room.id).emit("room:randomize", row, column);
    }
  })
};

const handleGame = function (message) {
  debug("Someone said something: ", message);

  // emit `chat:message` event to everyone EXCEPT the sender
  this.broadcast.to(message.room).emit("game:message", message);
};

module.exports = function (socket, _io) {
  io = _io;

  debug("a new client has connected", socket.id);

  io.emit("new-connection", "A new user connected");

  io.emit("new-connection", "A new user connected");

  // io.to(room).emit();
  socket.on("user:fire", handleUserFire); 
  
  socket.on("room:startGame", handleStartGame);

  // handle user disconnect
  socket.on("disconnect", handleDisconnect);

  // handle user joined
  socket.on("user:joined", handleUserJoined);

  // handle user emitting a new message
  socket.on("game:message", handleGame);
};
