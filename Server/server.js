const express = require('express');
const bodyParser = require('body-parser');
const { createServer } = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const {validateToken} = require("./auth");
const exchange_code = require('./auth').exchange_code;
const fetch = require('sync-fetch')
const { readFileSync} = require("fs");
const {saveGameResult, getResultsForPlayer, getMessagesForPlayer} = require("./db");

// Create an Express application
const app = express();

let ip = process.env.VITE_CLIENT_IP;

if (process.env.VITE_DEPLOYMENT_TYPE === "local") {
  ip = "localhost";
}

let port = process.env.VITE_CLIENT_PORT;
// let port = "5173";
let origin = "";

if (port === "80") {
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
  let auth_code = req.query.auth_code;
  exchange_code(auth_code).then((data) => {res.status(200).json({ data })}).catch(
      res => res.status(400).json({ error: res.message })
  );
});

app.get('/results', (req, res) => {
  let player = req.query.player;
  getResultsForPlayer(player).then((data) => {res.status(200).json({ data })});
});

app.get('/messages', (req, res) => {
  let player = req.query.player;
  getMessagesForPlayer(player).then((data) => {res.status(200).json({ data })});
});

const privateKey = readFileSync('key.pem');
const certificate = readFileSync('cert.pem');

const httpsServer = createServer({
  key: privateKey,
  cert: certificate
}, app);
// const httpsServer = createServer(app);

httpsServer.listen(3000);

const io = new Server(httpsServer, {
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
    waitingForMove: false,
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

      currentUser.waitingForMove = true;
      opponentPlayer.waitingForMove = false;

      currentUser.socket.emit("OpponentFound", {
        opponentName: opponentPlayer.playerName,
        playingAs: "circle",
      });

      opponentPlayer.socket.emit("OpponentFound", {
        opponentName: currentUser.playerName,
        playingAs: "cross",
      });

      currentUser.socket.on("playerMoveFromClient", (data) => {
        if (currentUser.waitingForMove) {
          opponentPlayer.socket.emit("playerMoveFromServer", {
            ...data,
          });

          currentUser.waitingForMove = false;
          opponentPlayer.waitingForMove = true;
        }
      });

      opponentPlayer.socket.on("playerMoveFromClient", (data) => {
        if (opponentPlayer.waitingForMove) {
          currentUser.socket.emit("playerMoveFromServer", {
            ...data,
          });

          opponentPlayer.waitingForMove = false;
          currentUser.waitingForMove = true;
        }
      });
    }
    else {
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
  socket.on("results",(results)=> {
    console.log(results);
    saveGameResult(results);
  })
});

console.log('Server is listening on port 3000');
