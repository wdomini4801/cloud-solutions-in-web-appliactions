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
