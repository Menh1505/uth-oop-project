import * as amqp from 'amqplib';


const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672';

export class MessageConsumer {
  static async start() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange('auth_exchange', 'direct', { durable: true });
    const q = await channel.assertQueue('', { exclusive: true });
    channel.bindQueue(q.queue, 'auth_exchange', 'user.logged_in');

    console.log('User service listening for user.logged_in events...');
    
    channel.consume(q.queue, async (msg: any) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        console.log('Received event:', event);

        channel.ack(msg);
      }
    }, { noAck: false });
  }
}
