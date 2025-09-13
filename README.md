# 🤖 Puppeteer Service

The **Puppeteer Service** is a headless browser scraper built on **Chrome + Puppeteer**.  
It powers data collection by scraping links and content from multiple sources depending on the request.  

✨ Use case scenarios:
- 🔍 **Search Engine Scraping** – fetch all links from [search.brave.com](https://search.brave.com) (default configured).  
- 🌐 **External URL Scraping** – scrape content directly from URLs if an `_external` database is already built in TiDB.  
- 🏢 **Internal Knowledge Base Scraping** – crawl internal company websites for knowledge-based content.  

---

## 🚀 Getting Started

### Download the Image

```bash
docker pull ghcr.io/hendram/puppeteerservice
```
▶️ Start

```bash
docker run -it -d --network=host ghcr.io/hendram/puppeteerservice bash
```

🔍 Check Running Container

```bash
docker ps
```

```bash
CONTAINER ID   IMAGE                                 NAME              STATUS
123abc456def   ghcr.io/hendram/puppeteerservice      pedantic_payne    Up 5 minutes
```

📦 Enter Container

```bash
docker exec -it infallible_mclean /bin/bash
```

🏃 Run the Service

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
