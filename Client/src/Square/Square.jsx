import React, { useState } from "react";
import "./Square.css";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const circleSvg = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
            {" "}
            <path
                d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#ffffff"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            ></path>{" "}
        </g>
    </svg>
);

const crossSvg = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
            {" "}
            <path
                d="M19 5L5 19M5.00001 5L19 19"
                stroke="#fff"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            ></path>{" "}
        </g>
    </svg>
);

const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/801415982270/websocket-message-queue';

const sqsClient = new SQSClient({ 
    region: "us-east-1",
    credentials: {
        accessKeyId: "ASIA3VGA5NS7KENOEID3",
        secretAccessKey: "XEgnAwJQ0K0nny/q2FUPdb+zjM6TchfJkehad+L3",
        sessionToken: "IQoJb3JpZ2luX2VjEEYaCXVzLXdlc3QtMiJIMEYCIQDTQ3H\
        cfbKiY7LY2YRvPCySd590cxxW2b2nL5ZsIWhRowIhAK8Say5W4294uitf5GuSIX\
        ApO8xniUj2cPFotRzFShmzKqsCCE8QARoMODAxNDE1OTgyMjcwIgyGDFzHh8bxqP\
        NeqfYqiAKPwe/HR+Kdu4yRnZgMxaqIsapss5VePk7SIK+rnbqZrgjjXNJjkWlhbZc\
        4mA87YhD5YXkRVNkzqMiTfXQWtaG/WwZEdTdaeOIZC87vNG8dJfEwN7Rb/NqzoovmY\
        dr1BSEhMmBPGBk8tGSMmm2dJzWu58t9oi766ClLyZKSWKKxcsTSNmGrdw73OaQ5o+k\
        HdRrZ4ONubtooyEurgWxB8YEs3FlflNIvxb/FaXK/WMB9Kn8eUXI75YUXfRTSiNfDxE\
        gm9veA3aQ6IRdkSwinclT0K3bRQGZIiNcNKlSmFCnQLln2fB2c/fy1vV5I3SBiyJdrSJ\
        rcQAxuRdTZrb7NC/cTAD64JKY+qL4wy+javAY6nAE9cCFaj/UxkAFOVF0hxEmCkIlb87\
        SI5YOZ502XGlhSb6529YVKaK0mDTwtU/FbQ2zIC6TfYTiLjLDBsliyXQtQeM8e5iIRkp2\
        TkT6vXZ7GpOSR0o9bgQvmlgXcT4EtR6YWvmJ6WCexYaN4o195J5c/vHOIwOvwU5sNGhtt\
        cPwr8FJ2Nd/7EhE1XRfXCeEsxcVswUuv4dl/IC7eN20="
    }, 
});

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

const Square = ({
                    gameState,
                    setGameState,
                    socket,
                    playingAs,
                    currentElement,
                    finishedArrayState,
                    setFinishedState,
                    finishedState,
                    id,
                    currentPlayer,
                    setCurrentPlayer,
                }) => {
    const [icon, setIcon] = useState(null);

    const clickOnSquare = () => {
        if (playingAs !== currentPlayer) {
            return;
        }

        if (finishedState) {
            return;
        }

        if (!icon) {
            if (currentPlayer === "circle") {
                setIcon(circleSvg);
            }
            else {
                setIcon(crossSvg);
            }
            console.log("currentPlayer", currentPlayer);
            console.log("playingAs", playingAs);
            console.log("currentElement", currentElement);
            console.log("finishedArrayState", finishedArrayState);
            console.log("finishedState", finishedState);
            console.log("gameState", gameState);

            if (currentElement !== "circle" && currentElement !== "cross") {
                const myCurrentPlayer = currentPlayer;
                socket.emit("playerMoveFromClient", {
                    state: {
                        id,
                        sign: myCurrentPlayer,
                    },
                });

                sendMessageToSQS({
                    type: 'player_move',
                    state: {
                        id,
                        sign: myCurrentPlayer,
                    },
                });

                setCurrentPlayer(currentPlayer === "circle" ? "cross" : "circle");

                setGameState((prevState) => {
                    let newState = [...prevState];
                    const rowIndex = Math.floor(id / 3);
                    const colIndex = id % 3;
                    newState[rowIndex][colIndex] = myCurrentPlayer;
                    return newState;
                });
            }
        }
    };

    return (
        <div
            onClick={clickOnSquare}
            className={`
            square 
            ${finishedState ? "not-allowed" : ""}
            ${currentElement === "circle" || currentElement === "cross" ? "not-allowed" : ""}
            ${currentPlayer !== playingAs ? "not-allowed" : ""}
            ${finishedArrayState.includes(id) ? finishedState + "-won" : ""}
            `}
        >
            {currentElement === "circle"
                ? circleSvg
                : currentElement === "cross"
                    ? crossSvg
                    : icon}
        </div>
    );
};

export default Square;
