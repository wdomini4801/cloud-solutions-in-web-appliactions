import mysql from 'mysql2/promise';
import { setTimeout } from 'timers/promises';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const dbConfig = {
    host: 'database-1.ckzm6c1fbrsp.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'database1234',
    database: 'resultsdb',
};

const cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });
const consecutiveWins = {};

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

const publishMetric = async (playerName) => {
  const params = {
      MetricData: [
          {
              MetricName: 'ThreeConsecutiveWins',
              Dimensions: [
                  {
                      Name: 'PlayerName',
                      Value: playerName,
                  },
              ],
              Unit: 'Count',
              Value: 1,
          },
      ],
      Namespace: 'GameMetrics',
  };

  try {
      const command = new PutMetricDataCommand(params);
      await cloudwatchClient.send(command);
      console.log(`Metryka przesłana dla gracza ${playerName}`);
  } catch (error) {
      console.error('Błąd podczas przesyłania metryki:', error);
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

      if (messageBody.result === 'win') {
        const playerName = messageBody.playerName;

        consecutiveWins[playerName] = (consecutiveWins[playerName] || 0) + 1;

        if (consecutiveWins[playerName] === 3) {
            console.log(`${playerName} wygrał 3 razy z rzędu!`);
            await publishMetric(playerName);

            consecutiveWins[playerName] = 0;
        }
    } else {
        const playerName = messageBody.playerName;
        consecutiveWins[playerName] = 0;
    }

  }
  console.log('Zakończono przetwarzanie wiadomości.');
};
