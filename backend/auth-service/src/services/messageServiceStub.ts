// Stub MessageService to prevent RabbitMQ crashes
export class MessageService {
  static async publish(topic: string, data: any): Promise<void> {
    // No-op - RabbitMQ disabled
  }
}
