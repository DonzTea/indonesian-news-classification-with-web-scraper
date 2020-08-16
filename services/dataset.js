const Dataset = require('../models/Dataset.js');

const preprocessing = require('./preprocessing.js');
const features_extraction = require('./features_extraction.js');
const term = require('./term.js');

/**
 * * Save a dataset, doing preprocessing, and extracting its term
 * @param {object} dataset
 * @return {object}
 */
const createDataset = async (dataset) => {
  // create dataset
  const createdDataset = await new Dataset(dataset)
    .save()
    .catch((error) => console.error(error));

  // preprocessing
  await preprocessing
    .generateAndWrite(createdDataset)
    .catch((error) => console.error(error));

  // delete old data
  await Promise.all([
    term.deleteTermsFrom(createdDataset.type),
    features_extraction.deleteIdfsWhere({ used_for_classification: false }),
    features_extraction.deleteTfs(),
    features_extraction.deleteTfIdfs(),
  ]).catch((error) => console.error(error));

  // extract tokens
  await term
    .generateAndWrite(createdDataset.type)
    .catch((error) => console.error(error));

  return createdDataset;
};

/**
 * * Save many datasets, doing preprocessing, and extracting its term
 * @param {[object]} datasets
 * @param {string} type
 * @return {[object]}
 */
const createDatasets = async (datasets, type) => {
  // delete old data
  await Promise.all([
    deleteDatasetsWhere({ type }),
    preprocessing.deleteResultsWhere({ source: type }),
    term.deleteTermsFrom(type),
    features_extraction.deleteIdfsWhere({ used_for_classification: false }),
    features_extraction.deleteTfs(),
    features_extraction.deleteTfIdfs(),
  ]).catch((error) => console.error(error));

  // create datasets
  const createdDatasets = await Dataset.insertMany(datasets, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));

  // preprocessing all documents
  await Promise.all(
    createdDatasets.map((dataset) => preprocessing.generateAndWrite(dataset)),
  ).catch((error) => console.error(error));

  // extract tokens of all documents
  await term.generateAndWrite(type).catch((error) => console.error(error));

  return createdDatasets;
};

/**
 * * Get many datasets corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readDatasetsWhere = async (filter) => {
  const datasets = await Dataset.find({ ...filter })
    .populate('label')
    .exec()
    .catch((error) => console.error(error));
  return datasets;
};

/**
 * * Get a dataset match the id
 * @param {string} id
 * @return {object}
 */
const readDatasetById = async (id) => {
  const dataset = await Dataset.findOne({ _id: id })
    .populate('label')
    .exec()
    .catch((error) => console.error(error));
  return dataset;
};

/**
 * * Update a dataset match the id
 * @param {string} id
 * @param {object} dataset
 * @return {object}
 */
const updateDatasetById = async (id, dataset) => {
  // update dataset
  const newDataset = { _id: id, ...dataset };
  const oldDataset = await Dataset.findOneAndUpdate(
    { _id: id },
    dataset,
  ).catch((error) => console.error(error));

  // if news content updated
  if (newDataset.content !== oldDataset.content) {
    // delete old data and preprocessing
    await Promise.all([
      preprocessing.deleteResult(oldDataset._id),
      preprocessing.generateAndWrite(newDataset),
      term.deleteTermsFrom(oldDataset.type),
      features_extraction.deleteIdfsWhere({ used_for_classification: false }),
      features_extraction.deleteTfs(),
      features_extraction.deleteTfIdfs(),
    ]).catch((error) => console.error(error));

    // extract tokens
    await term
      .generateAndWrite(newDataset.type)
      .catch((error) => console.error(error));
  }

  return newDataset;
};

/**
 * * Delete a dataset match the id
 * @param {string} id
 * @return {object}
 */
const deleteDatasetById = async (id) => {
  // delete dataset
  const [deletedDataset] = await Promise.all([
    Dataset.findOneAndDelete({ _id: id }),
    preprocessing.deleteResult(id),
    features_extraction.deleteIdfsWhere({ used_for_classification: false }),
    features_extraction.deleteTfs(),
    features_extraction.deleteTfIdfs(),
  ]).catch((error) => console.error(error));

  // delete old tokens
  await term
    .deleteTermsFrom(deletedDataset.type)
    .catch((error) => console.error(error));

  // reextracting tokens
  await term
    .generateAndWrite(deletedDataset.type)
    .catch((error) => console.error(error));

  return deletedDataset;
};

/**
 * * Delete many datasets corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteDatasetsWhere = async (filter) => {
  const source = filter.type;

  let response;
  if (filter.$or && filter.$or.length > 0) {
    [response] = await Promise.all([
      Dataset.deleteMany({ ...filter }),
      term.deleteTermsFrom(source),
      preprocessing.deleteResultsWhere({
        $or: filter.$or.map((condition) => {
          return { dataset: condition._id };
        }),
        source,
      }),
      features_extraction.deleteIdfsWhere({ used_for_classification: false }),
      features_extraction.deleteTfs(),
      features_extraction.deleteTfIdfs(),
    ]).catch((error) => console.error(error));

    await term.generateAndWrite(source);
  } else {
    [response] = await Promise.all([
      Dataset.deleteMany({ ...filter }),
      term.deleteTermsFrom(source),
      preprocessing.deleteResultsWhere({ source }),
      features_extraction.deleteIdfsWhere({ used_for_classification: false }),
      features_extraction.deleteTfs(),
      features_extraction.deleteTfIdfs(),
    ]).catch((error) => console.error(error));
  }

  return response;
};

/**
 * * Check whether a specified number of data sets in a type are available
 * @param {string} type
 * ? enum ['training set','testing set']
 * @param {number} totalDocument
 * ? integer number
 * @return {boolean}
 */
const isExist = async (type, totalDocument = 1) => {
  let isExist = false;

  try {
    const datasets = await Dataset.find({ type }).limit(totalDocument);
    if (datasets.length >= totalDocument) isExist = true;
  } catch (error) {
    console.error(error);
  }

  return isExist;
};

module.exports = {
  createDataset,
  createDatasets,
  readDatasetsWhere,
  readDatasetById,
  updateDatasetById,
  deleteDatasetById,
  deleteDatasetsWhere,
  isExist,
};
