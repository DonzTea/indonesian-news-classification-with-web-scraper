const dataset = require('../../services/dataset.js');
const stringUtils = require('../../utils/string.js');

const create = async (req, res) => {
  const datasetRequest = req.body;

  if (datasetRequest.type)
    datasetRequest.type = datasetRequest.type.toLowerCase();

  try {
    const createdDataset = await dataset.createDataset(datasetRequest);
    return res.status(201).send(createdDataset);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const detail = async (req, res) => {
  const id = req.params.id;

  if (id) {
    try {
      const datasetRequest = await dataset.readDatasetById(id);
      if (datasetRequest.label && datasetRequest.label.name)
        datasetRequest.label.name = stringUtils.titleCase(
          datasetRequest.label.name,
        );

      if (datasetRequest.type)
        datasetRequest.type = stringUtils.titleCase(datasetRequest.type);

      return res.status(200).send(datasetRequest);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(204);
  }
};

const update = async (req, res) => {
  const id = req.params.id;

  if (id) {
    const datasetRequest = req.body;

    if (datasetRequest.type)
      datasetRequest.type = datasetRequest.type.toLowerCase();

    try {
      const updatedDataset = await dataset.updateDatasetById(
        id,
        datasetRequest,
      );
      return res.status(200).send(updatedDataset);
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
      const deletedDataset = await dataset.deleteDatasetById(id);
      return res.status(200).send(deletedDataset);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const filter = async (req, res) => {
  const filter = req.body;
  try {
    const datasets = await dataset.readDatasetsWhere(filter);
    res.status(200).send(datasets.length > 0 ? datasets : []);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const destroyMany = async (req, res) => {
  const filter = req.body;
  try {
    const response = await dataset.deleteDatasetsWhere(filter);
    return res.status(200).send(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  create,
  detail,
  update,
  destroy,
  filter,
  destroyMany,
};
