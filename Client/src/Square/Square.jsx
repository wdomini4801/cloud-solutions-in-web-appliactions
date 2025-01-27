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
        accessKeyId: "ASIA3VGA5NS7OEZ6KKMT",
            secretAccessKey: "RfrZNOERzOGzqmRJLCP/qOKSNVzoqHbcNolw3msw",
            sessionToken: "IQoJb3JpZ2luX2VjEFUaCXVzLXdlc3QtMiJHMEUCIAgfe\
            +OFfOBVO31kdrfiJUD6F8YKUK0vNaGgSsPVRiXlAiEAqeKdABWfRyroE7RPIh\
            lGjhI6hzXDl3068Mszmh9NiU8qqwIIXhABGgw4MDE0MTU5ODIyNzAiDNSOdC2v\
            xRfjmO4g7yqIAtkBKa7kbgkZGFP37zZSHxuqUwpSAF64WeS9hUD9n2d8d7iv4w\
            oKuy+5/cDjpdBgomZa/DJV1BucCYBhCvn7JeqMVO3L9wYSauIODovdq3sPUI8t\
            zZqMVoYqbkeYPX+cJrDkOSlnn5dGg41UNIaHVmQwOCGljNhhcNH6GgORUNG7f5w\
            zPG7JoFTsnd4e6x89ZNOXSXZWr+9U0tXHUqxu9p4nwddGQQwdHk33876MLTGvXT\
            m6nKFlgThcww5RnpnHA93WJARcUoTuRrUMIgYkN+CYSs24V+Xx2Uc9xLfrPZfS4\
            cM0SuyEJyPdNZiOsHhI9fwJ8l3WFF91TFMld670XZCl1YVw9KXbETDQhd68BjqdA\
            eAk0WiTA0qgnjmU+1NumZ4M42zs1CU2BzNEIT8dl4jfjfDhIEFkUgXvOouHyeuvh\
            21tXyHTsggNHPqcNytrIn5AQNzuyQ/1rzYW/AtwKYPbHggTeEJfmduty43S9SvpU\
            udOn8siMKyLO2RM/uNxqh5Bj+NxNg19UMZIccdfk/seprf/BLdMaK+gUqAmMwj6l\
            v0bg3kH4nFbbC3v5R0="
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
