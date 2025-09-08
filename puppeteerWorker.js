import * as puppeteer from "puppeteer";

// helper
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runScraper(query) {
 
  try {
    // --- CORPORATE SHORTCUT ---
if (query.query.corporate) {
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
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

    return {
      results: {
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
      },
    };
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
   return await scrapeonlysite(query, []);
       }
  const words = searched.split(/\s+/); // split by spaces

  // take all words before first "=" filter
  const topicsArray = [];
  for (const word of words) {
    if (word.includes("=")) break; // stop when hitting first filter
    topicsArray.push(word);
  }
  console.log("topicsArray:", topicsArray);

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



    // --- SCRAPE SEARCH RESULTS LINKS ---

    for (const link of links) {
      let linkBrowser;
      let tab;
      let text = "";

      try {
        linkBrowser = await puppeteer.launch({
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

        tab = await linkBrowser.newPage();
        await tab.goto(link, { waitUntil: "domcontentloaded", timeout: 25000 });
        await wait(5000);

        try {
          text = await tab.evaluate(() => document.body.innerText);
        } catch (frameErr) {
          console.log("Frame detached or JS error, skipping:", frameErr.message);
        }

        if (text) {
          const found = topicsArray.some((word) =>
            text.toLowerCase().includes(word.toLowerCase())
          );
          if (found) {
            results.push({ text, metadata: { url: link, date: new Date().toISOString(), sourcekb: "external", searched: searched } });
            console.log(" ^|^e Found query in link:", link);
          }
        }
      } catch (err) {
        console.log(" ^}^l Failed to scrape link:", link, err.message);
      } finally {
        if (tab) try { await tab.close(); } catch {}
        if (linkBrowser) try { await linkBrowser.close(); } catch {}
      }
    }
return await scrapeonlysite(query, results);

  } catch (err) {
    console.error("Error in Puppeteer run:", err);
    return { error: "Scraping failed", details: err.message };
  }

}

    // --- SCRAPE SPECIFIC SITES ---
async function scrapeonlysite(query, results) {
  const resultssite = [];
  let newscraprequest = [];

     if(query.query.site){
        newscraprequest = query.query.site;
      }
     else {
        newscraprequest = query.query.onlyforsite.site
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
          searched: query.query.searched || query.query.onlyforsite.ignoresearched}});
          console.log(" ^|^e Found query in site:", linksite);
        }
      } catch (err) {
        console.log(" ^}^l Failed to scrape site:", linksite, err.message);
      } finally {
        if (tabsite) try { await tabsite.close(); } catch {}
        if (linksiteBrowser) try { await linksiteBrowser.close(); } catch {}
      }
    }
    return { results, resultssite };

}
