import React, {useState, useEffect, useRef} from "react";
import { useNavigate } from 'react-router-dom';
import "./Game.css";
import Square from "../Square/Square.jsx";
import {io} from "socket.io-client";
import Swal from "sweetalert2";
import {getUsername, isTokenExpired, refreshToken} from "../Login/Auth.jsx";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const renderFrom = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];

const Game = () => {
    const navigate = useNavigate();
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
    const finishedStateRef = useRef(finishedState);

    const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/801415982270/websocket-message-queue';

    const sqsClient = new SQSClient({ 
        region: "us-east-1",
        credentials: {
            accessKeyId: "ASIA3VGA5NS7ACYVVZP5",
            secretAccessKey: "w7C1tL4oIkDsAoow6ELx56SDdMbvS+67kY+KKYH2",
            sessionToken: "IQoJb3JpZ2luX2VjEF0aCXVzLXdlc3QtMiJGMEQCIAgni\
            jRyh4qa7f1HoYchyXiBA2fe18c3rGjYn/HkhaETAiAx2/w0XBqxjPOu8IP5y\
            WeYFPRulcFbD7zbFp9GFf2RWiqrAghmEAEaDDgwMTQxNTk4MjI3MCIMFjeYz\
            VoagOZV0329KogCnvs+RdlBUBHD8IB7hF+EPkIhM0nEGuZtvS632ZzOiLIHY\
            u9f9ECv8Dk1f5fcuE5ZrBPf4CKuWOe05d5QoC6Leg4NJyeC0tnL6+9sU7wdf\
            eVdUsQHKTX3pXsmPQrCIQ/kTcMnHeLD80kyc9WdQh9O3sN+ciB9siafMaxM4\
            Cd02lYzg1AgKbze3MHsgVd+ufTEgV+5BwdgtlE+LQ3hDuq5fdVu9IWkubyce\
            G12g6lTnhG/jDdiiHkBvvXT3lWyf0O3a7ABjDMTDyd7IgQCv1bUa1nx+b2vu\
            qiPby9jGiVF4dnTqAQz9V68d+X6uXvkKg70qAT0dg38k/l/th1BppPAhxyqS\
            NP8ChiQMO/l37wGOp4ByczD9eIcVPDP52jXxsqghk3M4UpmE7hf+WkBG39Ed\
            4hFJ9GqOVu6ffNclzmyKASW47I/awvz5orJZHgikd6QrP635G2fF4p80FgwZ\
            GtF2Mz1wlh8WOG7AAc4QTYW9J43qR7J/ev66COmLWyG5af/ltXtSbDrz55GJ\
            QYa2W+fNDiw60W2gGoDdasPcsYioNLsuspJGmQ2sD1g/BViOlc="
        }, 
    });

    useEffect(() => {
        finishedStateRef.current = finishedState;
    }, [finishedState]);

    const handleResults = () => {
        navigate('/results');
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    }

    const sendMessageToSQS = async (messageBody) => {
        try {
            const params = {
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify(messageBody),
            };
            const command = new SendMessageCommand(params);
            const response = await sqsClient.send(command);
            console.log("Message sent to SQS:", response);
        } catch (error) {
            console.error("Error sending message to SQS:", error);
        }
    };

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
        if (winner && !finishedStateRef.current) {
            setFinishedState(winner);

            if (winner !== "opponentLeftMatch" && winner !== "draw") {
                if (socket) {
                    socket.emit("results", {
                        result: {
                            playerName: playerName,
                            result: winner === playingAs ? 1 : 0,
                        },
                    });
                }
                sendMessageToSQS({
                    type: 'game_over',
                    result: winner === playingAs ? "win" : "loss",
                    playerName: playerName,
                });
            }

            if (winner === "draw") {
                if (socket) {
                    socket.emit("results", {
                        result: {
                            playerName: playerName,
                            result: 0.5,
                        },
                    });
                }
                sendMessageToSQS({
                    type: 'game_over',
                    result: "draw",
                    playerName: playerName,
                });
            }
        }
    }, [gameState, socket, playerName, playingAs]);

    socket?.on("opponentLeftMatch", () => {
        if (!finishedStateRef.current) {
            setFinishedState("opponentLeftMatch");
        }
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
            "Authorization": `Bearer ${window.localStorage.getItem("access_token")}`
        }

        const newSocket = io("https://"+ip+":3000", {
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
        if (socket) {
            socket.disconnect();
        }
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
                <button onClick={playOnlineClick} className="clickButton">
                    Play Tic-tac-toe
                </button>
                <button onClick={handleResults} className="clickButton">
                    View results
                </button>
                <button onClick={handleLogout} className="clickButton">
                    Logout
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
