import amqp from 'amqplib';

class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      
      // Declare exchanges and queues
      await this.channel.assertExchange('catalog.events', 'topic', { durable: true });
      await this.channel.assertQueue('catalog.product.created', { durable: true });
      await this.channel.assertQueue('catalog.product.updated', { durable: true });
      await this.channel.assertQueue('catalog.product.deleted', { durable: true });
      await this.channel.assertQueue('catalog.inventory.updated', { durable: true });
      
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishEvent(routingKey: string, data: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const message = {
      ...data,
      timestamp: new Date().toISOString(),
      service: 'catalog-service'
    };

    await this.channel.publish(
      'catalog.events',
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

export default new RabbitMQService();