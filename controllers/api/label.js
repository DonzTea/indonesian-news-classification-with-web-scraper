const label = require('../../services/label.js');
const stringUtils = require('../../utils/string.js');

const create = async (req, res) => {
  const requestedLabel = req.body;

  if (requestedLabel.name)
    requestedLabel.name = requestedLabel.name.toLowerCase();

  try {
    const createdLabel = await label.createLabel(req.body);
    res.status(201).send(createdLabel);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const read = async (_, res) => {
  try {
    const labels = await label.readLabels();
    for (const label of labels) {
      label.name = stringUtils.titleCase(label.name);
    }
    return res.status(200).send(labels);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const checkIsEmpty = async (_, res) => {
  try {
    const isEmpty = await label.isEmpty();
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
      const requestedLabel = await label.readLabel(id);
      if (requestedLabel.name)
        requestedLabel.name = stringUtils.titleCase(requestedLabel.name);
      return res.status(200).send(requestedLabel);
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
      const requestedLabel = await label.updateLabel(id, req.body);
      return res.status(200).send(requestedLabel);
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
      const deletedLabel = await label.deleteLabel(id);
      return res.status(200).send(deletedLabel);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const destroyWhere = async (req, res) => {
  try {
    const filter = req.body;
    const response = await label.deleteLabelsWhere(filter);
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
  destroyWhere,
};
