import { consumer, producer, initKafka } from "./kafka.js";
import { runScraper } from "./puppeteerWorker.js";

async function startWorker() {
  await initKafka();

  await consumer.subscribe({ topic: "fromscrap", fromBeginning: false });

  console.log(" ^=^z^` Puppeteer worker is listening for jobs on 'fromscrap'...");

  await consumer.run({
    autoCommit: false, // manual commit
    eachMessage: async ({topic, partition, message }) => {
      const offset = message.offset;
      let job;

      try {
        job = JSON.parse(message.value.toString());
      } catch (err) {
        console.error("Invalid job JSON, skipping:", err);
        // commit offset to skip bad message
        await consumer.commitOffsets([{ topic, partition, offset: (Number(offset) + 1).toString() }]);
        return;
      }

      console.log(" ^=^s  Received job:", job);

      try {
        // Run Puppeteer scraping
        const result = await runScraper(job);

        // Send results back to Kafka
        await producer.send({
          topic: "toscrap-results",
          messages: [{ value: JSON.stringify(result) }],
        });

        console.log(" ✅ Job processed and results sent.");

        // Commit offset **after success**
        await consumer.commitOffsets([{ topic, partition, offset: (Number(offset) + 1).toString() }]);
      } catch (err) {
        console.error(" ^}^l Worker error:", err);
        // don't commit offset, message will be redelivered
      }
    },
  });
}

startWorker().catch(console.error);
