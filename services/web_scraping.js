const puppeteer = require('puppeteer');
const $ = require('cheerio');
const { default: Axios } = require('axios');
const { io } = require('../app.js');
require('dotenv').config();

const ScrapedData = require('../models/ScrapedData.js');
const dataset = require('./dataset.js');

/**
 * * Run bot to start scraping data
 * @param {string} label
 * @param {string} url
 * @param {number} totalData
 * ? integer number
 */
const run = async (label, url, totalData) => {
  // open chromium
  const browser = await puppeteer
    .launch(
      process.env.APP_ENV.toLowerCase() === 'development'
        ? {
            headless: false,
            devtools: true,
          }
        : {
            headless: true,
            devtools: false,
          },
    )
    .catch((error) => console.error(error));

  // scraping news' urls
  const targetUrls = await scrapeTargetUrls(browser, url, totalData).catch(
    async (error) => {
      // close chromium
      await browser.close().catch((error) => console.error(error));
      throw new Error(error.message);
    },
  );

  // scraping proxies
  const proxies = await scrapeProxies(browser).catch(async (error) => {
    // close chromium
    await browser.close().catch((error) => console.error(error));
    throw new Error(error.message);
  });

  // scraping news data
  await scrapeNews(browser, targetUrls, proxies, label);

  // close chromium
  await browser.close().catch((error) => console.error(error));
};

/**
 * * Scraping target urls
 * @param {object} browser
 * ? const bowser = await puppeteer.launch()
 * @param {string} url
 * @param {number} totalData
 * ? integer number
 * @return {[string]}
 */
const scrapeTargetUrls = async (browser, url, totalData) => {
  // open new page for scraping news' urls
  const newsPage = await browser.newPage();
  await newsPage
    .goto(url, {
      waitUntil: 'networkidle2',
      timeout: 0,
    })
    .catch((error) => {
      console.error(error);
      throw new Error('Web scraping gagal, url scraping tidak valid.');
    });

  // error handling
  const errorMessage = await newsPage.evaluate(() =>
    window.location.pathname === '/404'
      ? 'Web scraping gagal, url scraping tidak valid.'
      : '',
  );
  if (errorMessage) throw new Error(errorMessage);

  // fetch saved url
  const [datasetUrls, scrapedUrls] = await Promise.all([
    dataset
      .readDatasetsWhere({})
      .then((datasets) => datasets.map((dataset) => dataset.url)),
    readDatasWhere({}).then((datas) => datas.map((data) => data.url)),
  ]).catch((error) => console.error(error));
  const savedUrls = [...datasetUrls, ...scrapedUrls];

  // scraping news' urls
  const targetUrls = await newsPage
    .evaluate(
      async ({ totalData, savedUrls }) => {
        const targetUrls = [];
        let startIndex = 0;
        while (targetUrls.length < totalData) {
          // extract urls
          const domUrls = Array.from(
            document.querySelectorAll('.f20.ln24.fbo.txt-oev-2'),
          ).slice(startIndex);
          if (domUrls.length === 0) break;

          // push urls
          for (const dom of Array.from(domUrls)) {
            const url = dom.getAttribute('href');
            if (
              targetUrls.length < totalData &&
              ![...savedUrls, ...targetUrls].includes(url)
            ) {
              targetUrls.push(url);
            } else {
              break;
            }
          }

          // fetch more data
          window.scrollTo(0, document.body.offsetHeight);

          // wait for data loaded
          await new Promise((resolve) => setTimeout(resolve, 1000));

          startIndex += startIndex === 0 ? 40 : 20;
        }

        return targetUrls;
      },
      { totalData, savedUrls },
    )
    .catch((error) => console.error(error));
  if (targetUrls.length === 0)
    throw new Error(
      'Web scraping gagal, tidak ada berita baru yang dapat ditambahkan.',
    );

  // close news page
  await newsPage.close().catch((error) => console.error(error));

  return targetUrls;
};

/**
 * * Scraping free proxies
 * @param {object} browser
 * ? const bowser = await puppeteer.launch()
 * @return {[string]}
 */
const scrapeProxies = async (browser) => {
  // open new page for scraping free proxies
  const proxyPage = await browser
    .newPage()
    .catch((error) => console.error(error));
  await proxyPage
    .goto('https://sslproxies.org/', {
      waitUntil: 'networkidle2',
      timeout: 0,
    })
    .catch((error) => console.error(error));

  // scraping free proxies
  const proxies = await proxyPage
    .evaluate(() => {
      // set desired conditions
      const dataEntriesDropdown = document.querySelector(
        'select[name="proxylisttable_length"]',
      );
      const eliteProxyOption = document.querySelector(
        'option[value="elite proxy"]',
      );
      dataEntriesDropdown.selectedIndex =
        dataEntriesDropdown.childElementCount - 1;
      eliteProxyOption.selected = true;

      // force triggering change event
      const event = new Event('change');
      dataEntriesDropdown.dispatchEvent(event);
      eliteProxyOption.parentElement.dispatchEvent(event);

      // get proxies
      const rowsData = Array.from(document.querySelectorAll('tr.odd, tr.even'));
      const proxies =
        rowsData.length === 0
          ? []
          : rowsData.map(
              (rowData) =>
                rowData.children[0].innerText +
                ':' +
                rowData.children[1].innerText,
            );

      return proxies;
    })
    .catch((error) => console.error(error));
  if (proxies.length === 0)
    throw new Error(
      'Web scraping gagal, tidak ada proxy yang dapat digunakan.',
    );

  // close news page
  await proxyPage.close().catch((error) => console.error(error));

  return proxies;
};

/**
 * * Scraping news data
 * @param {object} browser
 * ? const bowser = await puppeteer.launch()
 * @param {[string]} targetUrls
 * @param {[string]} proxies
 * @param {string} label
 */
const scrapeNews = async (browser, targetUrls, proxies, label) => {
  // scraping news data
  const [min, max] = [5000, 10000];
  for (const [index, url] of targetUrls.entries()) {
    const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min;
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    await new Promise((resolve) =>
      setTimeout(async () => {
        const response = await Axios({
          method: 'GET',
          url: url + '?page=all',
          proxyurl: `socks://${randomProxy}`,
        }).catch(async (error) => {
          console.error(error.response);
          const newProxies = await scrapeProxies(browser);
          await scrapeNews(browser, targetUrls.slice(index), newProxies, label);
        });

        const html = response.data;
        const title = $('h1#arttitle', html).text();
        const content = $('div.side-article.txt-article p:not(.baca)', html)
          .map(function () {
            return $(this).text();
          })
          .get()
          .join(' ')
          .replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g, ' ');
        const scrapedData = { title, url, content, label };

        // emit socket.io client
        io.emit('success scraping data', scrapedData);
        resolve();
      }, randomSeconds),
    );
  }
};

/**
 * * Save a data
 * @param {object} data
 * @return {object}
 */
const createData = async (data) => {
  const createdData = await new ScrapedData({ ...data })
    .save()
    .catch((error) => console.error(error));

  return createdData;
};

/**
 * * Save many datas
 * @param {[object]} datas
 * @return {[object]}
 */
const createDatas = async (datas) => {
  const createdDatas = await ScrapedData.insertMany(datas, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));

  return createdDatas;
};

/**
 * * Get many datas corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readDatasWhere = async (filter) => {
  const datas = await ScrapedData.find({ ...filter }).catch((error) =>
    console.error(error),
  );

  return datas;
};

/**
 * * Get a data match the id
 * @param {string} id
 * @return {object}
 */
const readDataById = async (id) => {
  const data = await ScrapedData.findOne({ _id: id }).catch((error) =>
    console.error(error),
  );

  return data;
};

/**
 * * Delete a data match the id
 * @param {string} id
 * @return {object}
 */
const deleteDataById = async (id) => {
  const deletedData = await ScrapedData.findOneAndDelete({
    _id: id,
  }).catch((error) => console.error(error));

  return deletedData;
};

/**
 * * Delete many datas corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteDatasWhere = async (filter) => {
  const response = await ScrapedData.deleteMany({ ...filter }).catch((error) =>
    console.error(error),
  );

  return response;
};

module.exports = {
  run,
  createData,
  createDatas,
  readDatasWhere,
  readDataById,
  deleteDataById,
  deleteDatasWhere,
};
