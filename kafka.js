import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "puppeteer-worker",
  brokers: ["localhost:9092"], // adjust if Kafka is in Docker
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "puppeteer-group",
       heartbeatInterval: 30000,      // send heartbeat every 30s
  sessionTimeout: 480000,    });

export async function initKafka() {
  await producer.connect();
  await consumer.connect();
}
