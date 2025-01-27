import mysql from 'mysql2/promise';
import { setTimeout } from 'timers/promises';

const dbConfig = {
    host: 'database-1.ckzm6c1fbrsp.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'database1234',
    database: 'resultsdb',
};

const saveMessage = async (username, message) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
      const query = 'INSERT INTO Messages (username, message) VALUES (?, ?)';
      await connection.execute(query, [username, message]);
  } catch (error) {
      console.error('Błąd podczas zapisywania do bazy:', error);
      throw error;
  } finally {
      await connection.end();
  }
};

export const handler = async (event) => {
    console.log('Rozpoczęcie przetwarzania wiadomości...');

    for (const record of event.Records) {
      console.log('Przetwarzanie wiadomości:', record.body);

      await setTimeout(5000);

      const messageBody = JSON.parse(record.body);

      if (messageBody.result) {
          try {
              await saveMessage('admin', record.body);
              console.log(`Wiadomość zapisana: ${record.body}`);
          } catch (error) {
              console.error(`Błąd podczas zapisywania wiadomości: ${record.body}`, error);
          }
      } else {
          console.log(`Wiadomość nie zawiera wyniku, pominięto: ${record.body}`);
      }
  }
  console.log('Zakończono przetwarzanie wiadomości.');
};
