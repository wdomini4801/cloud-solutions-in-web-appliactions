const mysql = require('mysql');
const db = mysql.createConnection({
    user: 'admin',
    host: 'database-1.ckzm6c1fbrsp.us-east-1.rds.amazonaws.com',
    database: 'resultsdb',
    password: 'database1234',
    port: 3306,
});

db.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

const createResultsTableQuery = `
  CREATE TABLE IF NOT EXISTS GameResults (
    Player1 VARCHAR(50) NOT NULL,
    Result VARCHAR(50) NOT NULL,
    GameTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
  );
`;

const createMessagesTableQuery = `
  CREATE TABLE IF NOT EXISTS Messages (
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

db.query(createResultsTableQuery, (err, results) => {
    if (err) {
        console.error('Error creating table GameResults:', err.stack);
        return;
    }
});

db.query(createMessagesTableQuery, (err, results) => {
    if (err) {
        console.error('Error creating table Messages:', err.stack);
        return;
    }
});

const saveGameResult = (result) => {
    const insertQuery = `
      INSERT INTO GameResults (Player1, Result)
      VALUES (?, ? )`;
    const values = [result.result.playerName, result.result.result];

    db.query(insertQuery, values, (err, results) => {
        if (err) {
            console.error('Error saving game result:', err.stack);
            return;
        }
    });
};

async function _getResultsForPlayer(playerName) {
    const selectQuery = `
      SELECT * FROM GameResults
      WHERE Player1 = ?`;
    const values = [playerName];

    return new Promise((resolve, reject) => {
        db.query(selectQuery, values, (err, results) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(results);
            }
        });
    });
}

async function _getMessagesForPlayer(playerName) {
    const selectQuery = `
      SELECT * FROM Messages
      WHERE username = ?`;
    const values = [playerName];

    return new Promise((resolve, reject) => {
        db.query(selectQuery, values, (err, results) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(results);
            }
        });
    });
}

const getResultsForPlayer = async (playerName) => {
    try {
        const results = await _getResultsForPlayer(playerName);
        console.log(JSON.stringify(results));
        for(let i= 0; i < results.length; i++) {
            if(results[i].Result === "1") {
                results[i].Result = "Win";
            }
            else if(results[i].Result === "0") {
                results[i].Result = "Lose";
            }
            else {
                results[i].Result = "Draw";
            }
        }
        return results;
    }
    catch (error) {
        console.error('Error fetching results:', error);
        throw error;
    }
};

const getMessagesForPlayer = async (playerName) => {
    try {
        const messages = await _getMessagesForPlayer(playerName);
        console.log(JSON.stringify(results));
        return messages;
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

module.exports = {
    saveGameResult,
    getResultsForPlayer,
    getMessagesForPlayer
}
