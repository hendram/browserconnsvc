# 🤖 Puppeteer Service

The **Puppeteer Service** is a headless browser scraper built on **Chrome + Puppeteer**.  
It powers data collection by scraping links and content from multiple sources depending on the request.  

✨ Use case scenarios:
- 🔍 **Search Engine Scraping** – fetch all links from [search.brave.com](https://search.brave.com) (default configured).  
- 🌐 **External URL Scraping** – scrape content directly from URLs if an `_external` database is already built in TiDB.  
- 🏢 **Internal Knowledge Base Scraping** – crawl internal company websites for knowledge-based content.  

---

## 🚀 Getting Started

###  Download the Image

```bash
docker pull ghcr.io/hendram/puppeteerservice
```

### ▶️ Start

```bash
docker run -it -d --network=host ghcr.io/hendram/puppeteerservice bash
```

### 🔍 Check Running Container

```bash
docker ps
```

```bash
CONTAINER ID   IMAGE                                 NAME              STATUS
123abc456def   ghcr.io/hendram/puppeteerservice      pedantic_payne    Up 5 minutes
```

### 📦 Enter Container

```bash
docker exec -it infallible_mclean /bin/bash
```

### 🏃 Run the Service

```bash
cd /home/browserconnsvc
node index.js
```

## ⚙️ How It Works

Every job starts from the **backend (`chunkgeneratorforaimodel`)** and flows through the Puppeteer Service.  
Depending on the type of request, the service decides what to scrape:  

1. 📩 **Receive Job**  
   The backend sends a request to the Puppeteer Service with scraping instructions.  

2. 🔀 **Decision Stage**  
   The service chooses the scraping mode:  
   - 🟣 **Search Engine Mode** → Collects links from [Brave Search](https://search.brave.com).  
   - 🔵 **External Mode** → Scrapes a target URL if `_external` data already exists in **TiDB**.  
   - 🟢 **Internal Mode** → Crawls internal company knowledge base websites.  

3. 📤 **Return Results**  
   Once scraping is complete, the extracted data is sent back to the backend for processing, storage, or downstream AI models.  

---

# Code Summarization

# 🤖  `index.js` Code Overview

This service runs inside the **Puppeteer worker container**.  
It consumes jobs from Kafka (`fromscrap` topic), executes scraping tasks using Puppeteer, and publishes the results back to Kafka (`toscrap-results` topic).  

---

## ⚡ Workflow

```bash
Kafka Job (fromscrap) → Puppeteer Worker → Scraping Result → Kafka (toscrap-results)
```

## 📂 Core Components


###  1️⃣ Kafka Setup

```bash
import { consumer, producer, initKafka } from "./kafka.js";
```


Initializes Kafka connection

####  Provides:

consumer → listens for jobs on fromscrap

producer → sends back results on toscrap-results


###  2️⃣ Puppeteer Integration

```bash
import { runScraper } from "./puppeteerWorker.js";
```

Handles browser automation and scraping

Input: Job payload (search topic, site, etc.)

Output: Structured scraping result

###  3️⃣ Consumer Logic

```bash
await consumer.subscribe({ topic: "fromscrap", fromBeginning: false });
```

Subscribes only to new jobs

Uses manual offset commit for reliability

###  4️⃣ Job Handling

```bash
eachMessage: async ({ topic, partition, message }) => { ... }
```

Parse job JSON

If invalid → skip + commit offset

Run Puppeteer scraping

Calls runScraper(job)

Send results to Kafka

Publishes to toscrap-results


####  Error Handling

Logs structured error

Does not commit offset → ensures redelivery

🛡️ Reliability Features
✔️ Manual offset commit → prevents job loss
✔️ Skip invalid JSON → avoids blocking consumer
✔️ Retries on failure → uncommitted jobs are redelivered
✔️ Separation of concerns → Kafka logic in kafka.js, scraping logic in puppeteerWorker.js


---


# 📡 Kafka Client (`kafka.js`) Code Overview

This module provides the **Kafka integration layer** for the Puppeteer Worker service.  
It defines a **producer** and a **consumer**, handles connections, and ensures fault-tolerant communication with the Kafka cluster.  

---

## ⚙️ Kafka Configuration

```bash
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "puppeteer-worker",
  brokers: ["localhost:9092"], // adjust if Kafka runs inside Docker
});
```

clientId → identifies this worker in Kafka logs/metrics

brokers → points to the Kafka bootstrap server(s)

Replace localhost:9092 if using Docker networking (e.g., kafka:9092)

#### 🚀 Producer

```bash
export const producer = kafka.producer();
```

Publishes scraping results to Kafka

Used by index.js to send messages to toscrap-results

#### 🎧 Consumer

```bash
export const consumer = kafka.consumer({
  groupId: "puppeteer-group",
  heartbeatInterval: 30000, // send heartbeat every 30s
  sessionTimeout: 480000,   // session timeout (8 minutes)
});
```

Listens for scraping jobs on Kafka

Belongs to the puppeteer-group (multiple workers can share jobs)

Heartbeat interval → keeps the worker marked alive

Session timeout → defines how long Kafka waits before rebalancing

### 🔌 Initialization

```bash
export async function initKafka() {
  await producer.connect();
  await consumer.connect();
}
```

Called by index.js at startup

Ensures both producer & consumer are ready before job processing begins

---

# 🌐 Scraper Module (puppeteerWorker.js)

This module provides web scraping capabilities using Puppeteer, with specialized flows for corporate sites, general search engines, and specific site scraping. It includes structured logging and validation to ensure reliable downstream processing.

## ⚡ Key Features

###  1️⃣ Helper Utilities

```bash
wait(ms) → simple sleep utility for throttling actions.

logSearchResults({ links, topicsArray, searched })
```

Logs search results in JSON (INFO level).

Includes query, topics, result count, and sample link.

```bash
logResultssite(resultssite)
```

Logs site scraping success/failure.

Reports inserted count and sample URL.


###  2️⃣ Corporate Scraping Flow

```bash
if (query.query.corporate) { ... }
```

Launches Puppeteer in headless mode.

Navigates to the provided corporate URL.

Extracts full page text with HTML tags preserved via recursive getTextWithTag.

###  Packages result into resultscorporate with metadata:

```bash
url

topic

retrieved_at (ISO timestamp)

sourcekb = "internal"
```

#### ✅ Includes payload validator:

Confirms fields are strings and metadata is complete.

Logs [INFO] Corporate payload sent successfully or [ERROR] missing required fields.


###  3️⃣ General Search Flow

```bash
const searched = query.query.searched || "";
```

Uses a search engine (e.g. Brave).

Extracts topics (words before first = filter).

Navigates to the search page:

Sets language and UA headers.

Inputs search query, waits for results.

Collects result links (#results a[href]).

Logs structured result summary with logSearchResults.

```bash
Returns { links, topicsArray, searched }.
```

###  4️⃣ Specific Site Scraping Flow

```bash
async function scrapeonlysite(query) { ... }
```

Iterates through query.query.site or query.query.onlyforsite.

####  For each site:

Opens page, extracts text via getTextWithTag.

####  Stores in resultssite with metadata:

```bash
url

date

sourcekb = "external"

searched (or ignoresearched)
```


Handles frame detachment and JS errors gracefully.

Logs results via logResultssite.

```bash
Returns { resultssite }.
```

###  5️⃣ Error Handling & Cleanup

All browser/page objects are closed in finally blocks.

Malformed HTML or detached frames are logged but do not stop execution.

####  Returns structured error objects when scraping fails:

```bash
{ error: "Scraping failed", details: err.message }
```

### 🔗 Workflow

```bash
Corporate query → corporate scrape → corporate validator
Else if "searched" → general search engine scrape
Else → scrapeonlysite (specific site list)
```
