const web_scraping = require('../../services/web_scraping.js');

const run = async (req, res) => {
  const label = req.body.label;
  const url = req.body.url;
  const totalData = parseInt(req.body.totalData);
  if (!label || !url || !totalData || isNaN(totalData)) {
    return res.sendStatus(400);
  }

  try {
    await web_scraping.run(label, url, totalData);
  } catch (error) {
    return res.status(400).send(error.message);
  }

  res.sendStatus(200);
};

const create = async (req, res) => {
  const scrapedData = req.body.scrapedData;
  if (scrapedData) {
    try {
      const createdData = await web_scraping.createData(scrapedData);
      return res.status(200).send(createdData);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const detail = async (req, res) => {
  const id = req.params.id;

  // error handling
  if (!id) {
    return res.sendStatus(204);
  }

  try {
    const scrapedData = await web_scraping.readDataById(id);
    return res.status(200).send(scrapedData);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const destroy = async (req, res) => {
  const id = req.params.id;
  if (id) {
    try {
      const deletedData = await web_scraping.deleteDataById(id);
      return res.status(200).send(deletedData);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const destroyMany = async (req, res) => {
  try {
    const filter = req.body;
    const response = await web_scraping.deleteDatasWhere(filter);
    return res.status(200).send(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  run,
  create,
  detail,
  destroy,
  destroyMany,
};
