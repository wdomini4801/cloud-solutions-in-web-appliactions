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
        accessKeyId: "ASIA3VGA5NS7GPLN3U3U",
        secretAccessKey: "KHeE7v2pLenOvxFCK3PEXWOtWwPb4vyXs/sFlgIh",
        sessionToken: "IQoJb3JpZ2luX2VjEFkaCXVzLXdlc3QtMiJHMEUCIQCXd\
        WgI6euGxYDHeRYBoqradqzUcJZbw6d16ICFSuqzSwIgC+PclPoVg1jiqDtPQ\
        qW/sntR23i4AcpjUW8G2TyR5M0qqwIIYhABGgw4MDE0MTU5ODIyNzAiDPU55\
        hct8y0CZ3EWKiqIAjyMvsbNaHWwtjBOgP95ILMdpvnDlVjno/AmrjBGxnGW0\
        XoYohq1C2PuT8VzTJegPIjEUIR88o8G6MlnAMIxi+aRuBa/HhOcTjOu006nQ\
        sOg0OoUyGMwkikD715R/mQ8S1v+sHTv93C/smzV5wAFw0Ha1xXb9U8ufqsjb\
        0nBgBbBHtcd3gBWJfVq6lCmeydpzRJxtQ17QTNk0zvqqiioBI3GquiDxnLa5\
        8rbjiNSqixbnfTZ4E+YYbGz1E/yS2fPf8bhW9VEQP2wrXwaxwZIQVtjWVkJM\
        mpyz2IGkWvKc/SzH3Gqp0zmtAXQQ/a07hdXvydDNdY0lKMvcFPEF9JCtw18m\
        Nv40Ai8ajDa7d68BjqdAXZW2iN1wN2gTKSpmcZ67qz85ZtkFfAt4y7DOicr3\
        Mf3l2Iqk8fgkAGQimFTn7UFfcguwV07V6EqMFyqcZ+V394qsec5wTm0cxUkX\
        VdDYpJXY8vcHcbWnFjnVyZILZqzyKbu/sfpEN3ISZLHtQ+zbJuZ6Gb2lbYbl\
        R8hteK1ohgbTIYB1ujhZq4srFDuVJuwu0pudSj25zB2Xvstgx0="
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
