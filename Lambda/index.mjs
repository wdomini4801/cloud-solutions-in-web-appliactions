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

      const messageBody = record.body;

      if (messageBody.trim() === "result") {
          try {
              await saveMessage('admin', messageBody);
              console.log(`Wiadomość zapisana: ${messageBody}`);
          } catch (error) {
              console.error(`Błąd podczas zapisywania wiadomości: ${messageBody}`, error);
          }
      } else {
          console.log(`Wiadomość nie zawiera wyniku, pominięto: ${messageBody}`);
      }
  }
  console.log('Zakończono przetwarzanie wiadomości.');
};
