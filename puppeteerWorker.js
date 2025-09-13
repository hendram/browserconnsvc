import * as puppeteer from "puppeteer";

// helper
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function logSearchResults({ links, topicsArray, searched }) {
  console.log(JSON.stringify({
    level: "INFO",
    timestamp: new Date().toISOString(),
    logger: "web-scraper",
    message: "Search completed successfully",
    topics: topicsArray,
    searched_query: searched,
    results_count: links.length,
    sample_link: links.length > 0 ? links[0] : null
  }));
}

export async function runScraper(query) {

let resultscorporate = {};

  try {
    // --- CORPORATE SHORTCUT ---
if (query.query && query.query.corporate) {
  const url = query.query.corporate;
  let browser, page, html = "";

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--window-size=1280,800",
      ],
    });

    page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await wait(5000);

    try {
      html = await page.evaluate(() => {
        function getTextWithTag(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
              const parentTag = node.parentElement
                ? node.parentElement.tagName.toLowerCase()
                : "unknown";
              return `<${parentTag}> ${text} </${parentTag}>`;
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            return Array.from(node.childNodes)
              .map(getTextWithTag)
              .filter(Boolean)
              .join("\n");
          }
          return null;
        }
        return getTextWithTag(document.body);
      });
    } catch (err) {
      console.log(" ^}^l Failed to extract corporate HTML:", err.message);
    }

      resultscorporate = {
        corporate: [
          {
            text: html,
            metadata: {
              url,
              retrieved_at: new Date().toISOString(),
              sourcekb: "internal",
              topic: query.query.topic,
            },
          },
        ],
      };

// --- Sanity check for corporate result format ---
const corporateEntry = resultscorporate?.corporate?.[0];
const isValidCorporate =
  corporateEntry &&
  typeof corporateEntry.text === "string" &&
  corporateEntry.metadata &&
  typeof corporateEntry.metadata.url === "string" &&
  typeof corporateEntry.metadata.topic === "string" &&
  typeof corporateEntry.metadata.retrieved_at === "string";

// Format timestamp like [2025-09-13 19:34:10,724]
const now = new Date();
const ts = now
  .toISOString()
  .replace("T", " ")
  .replace("Z", "")
  .replace(/\.\d+/, (ms) => {
    const padded = (ms.slice(1, 4) + "000").slice(0, 3); // force 3 digits
    return "," + padded;
  });

if (isValidCorporate) {
  console.log(
    `[${ts}] INFO [CorporateValidator] Corporate payload sent successfully (puppeteerWorker.js)`
  );
} else {
  console.log(
    `[${ts}] ERROR [CorporateValidator] Corporate payload missing required fields (puppeteerWorker.js)`
  );
}
 

 return  { resultscorporate  };

  } catch (err) {
    console.error("Corporate scrape failed:", err);
    return {
      error: "Corporate scraping failed",
      details: err.message,
    };
  } finally {
    if (page) try { await page.close(); } catch {}
    if (browser) try { await browser.close(); } catch {}
  }
}

 const searched = query.query.searched || ""; // make sure it's a string
  if(!searched){
   return await scrapeonlysite(query);     
 }   
  const words = searched.split(/\s+/); // split by spaces

  // take all words before first "=" filter
  const topicsArray = [];
  for (const word of words) {
    if (word.includes("=")) break; // stop when hitting first filter
    topicsArray.push(word);
  }

  const results = [];

    // --- NORMAL SEARCH FLOW ---
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--window-size=1280,800",
      ],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    await page.goto(`https://${query.query.searchEngine}`, {
      waitUntil: "domcontentloaded",
    });
    await wait(3000);

    await page.type("textarea#searchbox", query.query.searched, { delay: 50 });
    await wait(1000);
    await page.click("#submit-button");
    await wait(10000);

    const links = await page.$$eval("#results a[href]", (els) =>
      els.map((a) => a.href).filter((href) => !href.includes("search.brave.com"))
    );

    await page.close();
    await browser.close();

    logSearchResults({ links, topicsArray, searched });

  return {links, topicsArray, searched};
}
catch (err) {
    console.error("Error in Puppeteer run:", err);
    return { error: "Scraping failed", details: err.message };
  }
}

// Utility function for resultssite structured logging
function logResultssite(resultssite) {
  const inserted_count = resultssite.length;
  const allOk = inserted_count > 0; // simple check: at least one site scraped

  console.log(JSON.stringify({
    level: allOk ? "INFO" : "WARN",
    timestamp: new Date().toISOString(),
    logger: "resultssite",
    message: allOk ? "All sites scraped successfully" : "Some sites failed to scrape",
    inserted_count: inserted_count,
    sample_url: inserted_count > 0 ? resultssite[0].metadata.url : null
  }));
}


    // --- SCRAPE SPECIFIC SITES ---
async function scrapeonlysite(query) {
  const resultssite = [];
  let newscraprequest = [];

     if(query.query.site){
        newscraprequest = query.query.site;
      }
     else {
        newscraprequest = query.query.onlyforsite
      }

    for (const linksite of newscraprequest) {
      let linksiteBrowser;
      let tabsite;
      let htmlsite = "";

      try {
        linksiteBrowser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--window-size=1280,800",
          ],
        });

        tabsite = await linksiteBrowser.newPage();
        await tabsite.goto(`${linksite}`, { waitUntil: "domcontentloaded", timeout: 25000 });
        await wait(5000);

        try {
          htmlsite = await tabsite.evaluate(() => {
            function getTextWithTag(node) {
              if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                  const parentTag = node.parentElement
                    ? node.parentElement.tagName.toLowerCase()
                    : "unknown";

                  return `<${parentTag}> ${text} </${parentTag}>`;
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                return Array.from(node.childNodes)
                  .map(getTextWithTag)
                  .filter(Boolean)
                  .join("\n");
              }
              return null;
            }
            return getTextWithTag(document.body);
          });
        } catch (frameErr) {
          console.log("Frame detached or JS error, skipping:", frameErr.message);
        }

        if (htmlsite) {
          resultssite.push({ htmlsite, metadata: { url: linksite, date: new Date().toISOString(), sourcekb: "external", 
          searched: query.query.searched || query.query.ignoresearched}});
        }
      } catch (err) {
        console.log(" ^}^l Failed to scrape site:", linksite, err.message);
      } finally {
        if (tabsite) try { await tabsite.close(); } catch {}
        if (linksiteBrowser) try { await linksiteBrowser.close(); } catch {}
      }
    }

// Example usage after scraping
if (resultssite && Array.isArray(resultssite)) {
  logResultssite(resultssite);
}

    return {resultssite };

}
