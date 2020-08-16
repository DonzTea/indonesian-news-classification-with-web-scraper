const stopword = require('../../services/stopword.js');

const create = async (req, res) => {
  const requestedStopword = req.body;

  if (requestedStopword.name)
    requestedStopword.name = requestedStopword.name.toLowerCase();

  try {
    const createdStopword = await stopword.createStopword(req.body);
    return res.status(201).send(createdStopword);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const read = async (_, res) => {
  try {
    const stopwords = await stopword.readStopwords();
    return res.status(200).send(stopwords);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const checkIsEmpty = async (_, res) => {
  try {
    const isEmpty = await stopword.isEmpty();
    return res.status(200).send(isEmpty);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const detail = async (req, res) => {
  const id = req.params.id;
  if (id) {
    try {
      const requestedStopword = await stopword.readStopword(id);
      return res.status(200).send(requestedStopword);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const update = async (req, res) => {
  const id = req.params.id;
  if (id) {
    try {
      const requests = req.body;
      requests.name = requests.name.toLowerCase();
      const requestedStopword = await stopword.updateStopword(id, req.body);
      return res.status(200).send(requestedStopword);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const destroy = async (req, res) => {
  const id = req.params.id;
  if (id) {
    try {
      const requestedStopword = await stopword.deleteStopword(id);
      return res.status(200).send(requestedStopword);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const search = async (req, res) => {
  const request = req.body;
  request.name = request.name.toLowerCase();

  const filter = {};
  for (const property of Object.keys(request)) {
    filter[property] = { $regex: '.*' + request[property] + '.*' };
  }

  try {
    const stopwords = await stopword.readStopwords(filter);
    return res.status(200).send(stopwords);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const destroyMany = async (req, res) => {
  try {
    const filter = req.body;
    const response = await stopword.deleteStopwordsWhere(filter);
    return res.status(200).send(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  create,
  read,
  checkIsEmpty,
  detail,
  update,
  destroy,
  search,
  destroyMany,
};
