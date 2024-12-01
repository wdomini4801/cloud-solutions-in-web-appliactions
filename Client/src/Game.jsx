import React, {useState, useEffect} from "react";
import "./Game.css";
import Square from "./Square/Square";
import {io} from "socket.io-client";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import {getUsername, isTokenExpired, refreshToken} from "./Auth.jsx";

const renderFrom = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];

const Game = () => {
    const ip = window.location.hostname;
    const [gameState, setGameState] = useState(JSON.parse(JSON.stringify(renderFrom)));
    const [currentPlayer, setCurrentPlayer] = useState("circle");
    const [finishedState, setFinishedState] = useState(false);
    const [finishedArrayState, setFinishedArrayState] = useState([]);
    const [playOnline, setPlayOnline] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!window.localStorage.getItem("access_token"));
    const [socket, setSocket] = useState(null);
    const [playerName, setPlayerName] = useState("");
    const [opponentName, setOpponentName] = useState(null);
    const [playingAs, setPlayingAs] = useState(null);
    const [newGame, setNewGame] = useState(false);

    const checkWinner = () => {
        // row dynamic
        for (let row = 0; row < gameState.length; row++) {
            if (
                gameState[row][0] === gameState[row][1] &&
                gameState[row][1] === gameState[row][2]
            ) {
                setFinishedArrayState([row * 3, row * 3 + 1, row * 3 + 2]);
                return gameState[row][0];
            }
        }

        // column dynamic
        for (let col = 0; col < gameState.length; col++) {
            if (
                gameState[0][col] === gameState[1][col] &&
                gameState[1][col] === gameState[2][col]
            ) {
                setFinishedArrayState([col, 3 + col, 2 * 3 + col]);
                return gameState[0][col];
            }
        }

        if (
            gameState[0][0] === gameState[1][1] &&
            gameState[1][1] === gameState[2][2]
        ) {
            setFinishedArrayState([0, 4, 8]);
            return gameState[0][0];
        }

        if (
            gameState[0][2] === gameState[1][1] &&
            gameState[1][1] === gameState[2][0]
        ) {
            setFinishedArrayState([2, 4, 6]);
            return gameState[0][2];
        }

        const isDrawMatch = gameState.flat().every((e) => {
            if (e === "circle" || e === "cross") return true;
        });

        if (isDrawMatch) return "draw";

        return null;
    };

    useEffect(() => {
        const winner = checkWinner();
        if (winner) {
            setFinishedState(winner);
        }
    }, [gameState]);

    if (finishedState && finishedState !== "opponentLeftMatch" && finishedState !== "draw") {
        socket.emit("results", {
            result: {
                playerName: playerName,
                result: finishedState === playingAs ? 0 : 1,
            },
        });
        console.log("Sending result to server");
    }

    socket?.on("opponentLeftMatch", () => {
        setFinishedState("opponentLeftMatch");
    });

    socket?.on("playerMoveFromServer", (data) => {
        const id = data.state.id;
        setGameState((prevState) => {
            let newState = [...prevState];
            const rowIndex = Math.floor(id / 3);
            const colIndex = id % 3;
            newState[rowIndex][colIndex] = data.state.sign;
            return newState;
        });
        setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
    });

    socket?.on("connect", function () {
        setPlayOnline(true);
    });

    socket?.on("OpponentNotFound", function () {
        setOpponentName(false);
    });

    socket?.on("OpponentFound", function (data) {
        setPlayingAs(data.playingAs);
        setOpponentName(data.opponentName);
    });

    async function connectToServer() {
        if (isTokenExpired()) {
            await refreshToken();
        }

        const headers = {
            Authorization: `Bearer ${window.localStorage.getItem("access_token")}`
        }

        const newSocket = io("http://"+ip+":3000", {
            autoConnect: true,
            extraHeaders: headers
        });

        newSocket?.emit("request_to_play", {
            playerName: playerName,
        });

        setSocket(newSocket);
    }

    async function playOnlineClick(){
        const username = getUsername();
        setPlayerName(username);
        setNewGame(true);
    }

    useEffect(() => {
        if (newGame) {
            connectToServer();
            setNewGame(false);
        }
    }, [newGame]);

    function playAgainClick() {
        socket.disconnect();
        setGameState(JSON.parse(JSON.stringify(renderFrom)));
        setFinishedState(false);
        setFinishedArrayState([]);
        setCurrentPlayer("circle");
        setOpponentName(null);
        setPlayingAs(null);
        setPlayOnline(false);
        setNewGame(true);
    }

    if(!isAuthenticated) {
        Swal.fire({
            title: "You need to log in first",
            icon: "error",
        });
        document.location.href = "/login";
    }

    if (!playOnline) {
        return (
            <div className="main-div">
                <button onClick={playOnlineClick} className="playOnline">
                    Play Tic-tac-toe
                </button>
            </div>
        );
    }

    if (playOnline && !opponentName) {
        return (
            <div className="waiting">
                <p>Waiting for opponent</p>
            </div>
        );
    }

    return (
        <div className="main-div">
            <h1 className="game-heading water-background">Tic-tac-toe</h1>
            {!finishedState && opponentName && (
                <h2>You are playing against {opponentName}</h2>
            )}
            {finishedState && finishedState === "opponentLeftMatch" && (
                <h2>Opponent has left the game</h2>
            )}
            {finishedState &&
                finishedState !== "opponentLeftMatch" &&
                finishedState !== "draw" && (
                    <h3 className="finished-state">
                        {finishedState === playingAs ? "You won " : "You lost "} the
                        game
                    </h3>
                )}
            {finishedState &&
                finishedState !== "opponentLeftMatch" &&
                finishedState === "draw" && (
                    <h3 className="finished-state">It's a Draw</h3>
                )}
            {!finishedState && opponentName && (
                <h2>
                    {currentPlayer === playingAs
                        ? "Your turn"
                        : "Your opponent's turn"}
                </h2>
            )}

            <div className="move-detection">
                <div
                    className={`left ${!finishedState &&
                    currentPlayer === playingAs ? "current-move-" + currentPlayer : ""
                    }`}
                >
                    {playerName}: {playingAs === "circle" ? "O" : "X"}
                </div>
                <div
                    className={`right ${!finishedState &&
                    currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""
                    }`}
                >
                    {opponentName}: {playingAs === "circle" ? "X" : "O"}
                </div>
            </div>
            <div>
                <div className="square-wrapper">
                    {gameState.map((arr, rowIndex) =>
                        arr.map((e, colIndex) => {
                            return (
                                <Square
                                    socket={socket}
                                    playingAs={playingAs}
                                    gameState={gameState}
                                    finishedArrayState={finishedArrayState}
                                    finishedState={finishedState}
                                    currentPlayer={currentPlayer}
                                    setCurrentPlayer={setCurrentPlayer}
                                    setGameState={setGameState}
                                    id={rowIndex * 3 + colIndex}
                                    key={rowIndex * 3 + colIndex}
                                    currentElement={e}
                                />
                            );
                        })
                    )}
                </div>
            </div>
            {finishedState && (
                <button onClick={playAgainClick} className="playAgain">
                    Play again
                </button>
            )}
        </div>
    );
};

export default Game;
