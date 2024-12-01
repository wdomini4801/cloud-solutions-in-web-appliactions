const express = require('express');
const bodyParser = require('body-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {validateToken} = require("./auth");
const exchange_code = require('./auth').exchange_code;

// Create an Express application
const app = express();
const ip = process.env.VITE_CLIENT_IP;
let port = process.env.VITE_CLIENT_PORT;
let origin = ""
if (port === "80"){
  origin = "http://"+ip;
}
else if (port === "443") {
  origin = "https://"+ip;
}
else {
  origin = "http://"+ip+":"+port;
}

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// CORS configuration
const corsOptions = {
  origin: origin,
  methods: ['GET', 'POST'],
};

app.use(cors(corsOptions));

app.get('/exchange-code', (req, res) => {
  let auth_code = req.query.auth_code
  exchange_code(auth_code).then((data) => {res.status(200).json({ data })});
});

// Create HTTP server
const httpServer = createServer(app);
httpServer.listen(3000);

const io = new Server(httpServer, {
  cors: {
    origin: origin,
    methods: ["GET", "POST"]
  },
});

const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {
  const accessToken = socket.handshake.headers.authorization;
  const isValid = validateToken(accessToken);

  if (!accessToken || accessToken === "null" || !isValid) {
    socket.disconnect(true);
    console.error("Unauthorized connection")
    return;
  }

  allUsers[socket.id] = {
    socket: socket,
    online: true,
  };

  socket.on("request_to_play", (data) => {
    const currentUser = allUsers[socket.id];
    currentUser.playerName = data.playerName;

    let opponentPlayer;

    for (const key in allUsers) {
      const user = allUsers[key];
      if (user.playerName === currentUser.playerName) {
        continue;
      }
      if (user.online && !user.playing && socket.id !== key) {
        opponentPlayer = user;
        break;
      }
    }

    if (opponentPlayer) {
      allRooms.push({
        player1: opponentPlayer,
        player2: currentUser,
      });

      currentUser.playing = true;
      opponentPlayer.playing = true;

      currentUser.socket.emit("OpponentFound", {
        opponentName: opponentPlayer.playerName,
        playingAs: "circle",
      });

      opponentPlayer.socket.emit("OpponentFound", {
        opponentName: currentUser.playerName,
        playingAs: "cross",
      });

      currentUser.socket.on("playerMoveFromClient", (data) => {
        opponentPlayer.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });

      opponentPlayer.socket.on("playerMoveFromClient", (data) => {
        currentUser.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });
    } else {
      currentUser.socket.emit("OpponentNotFound");
    }
  });

  socket.on("disconnect", function () {
    const currentUser = allUsers[socket.id];
    currentUser.online = false;
    currentUser.playing = false;

    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];

      if (player1.socket.id === socket.id) {
        allRooms.splice(index, 1);
        player2.socket.emit("opponentLeftMatch");
        break;
      }

      if (player2.socket.id === socket.id) {
        allRooms.splice(index, 1);
        player1.socket.emit("opponentLeftMatch");
        break;
      }
    }
  });
  socket.on("results",(results)=>{
    console.log(results);
  })
});

console.log('Server is listening on port 3000');
