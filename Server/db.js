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

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS GameResults (
    Player1 VARCHAR(50) NOT NULL,
    Result VARCHAR(50) NOT NULL,
    GameTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
  );
`;

db.query(createTableQuery, (err, results) => {
    if (err) {
        console.error('Error creating table:', err.stack);
        return;
    }
    console.log('Table created successfully');
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
--       WHERE Player1 = ?`;
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
        console.log(JSON.stringify(results)); // Log results as JSON
        for(let i=0; i<results.length; i++){
            if(results[i].Result ==="1"){
                results[i].Result = "Win"
            }
            else if(results[i].Result ==="0"){
                results[i].Result = "Lose"
            }
        }
        return results;
    }
    catch (error) {
        console.error('Error fetching results:', error);
        throw error;
    }
};

module.exports = {
    saveGameResult,
    getResultsForPlayer
}
