import mysql from 'mysql2/promise';
import util from 'util';

const delay = util.promisify(setTimeout);

const dbConfig = {
    host: 'database-1.ckzm6c1fbrsp.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'database1234',
    database: 'resultsdb',
};

export const handler = async (event) => {
    // TODO implement
    const connection = await mysql.createConnection(dbConfig);

    console.log('Odebrano wiadomość:');

    const query = 'INSERT INTO Messages (username, message) VALUES (?, ?)';
    const values = ['admin', 'hello'];

    await delay(5000);

    try {
      await connection.execute(query, values);
      console.log('Wiadomość została zapisana w bazie danych.');
    } catch (error) {
        console.error('Błąd podczas zapisywania wiadomości:', error);
    } finally {
        await connection.end();
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify('Gut!'),
    };
    return response;
};
