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

How It Works

Backend Request → The service first receives jobs from chunkgeneratorforaimodel.

Decision Flow:

Scrape search engine links only 🟣

Scrape external site (if _external DB is built on TiDB) 🔵

Scrape internal company knowledge base 🟢

Return Data → Results are sent back to the backend for further processing.

