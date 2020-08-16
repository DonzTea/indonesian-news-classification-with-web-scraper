const IDF = require('../models/IDF.js');
const TF = require('../models/TF.js');
const TF_IDF = require('../models/TF_IDF.js');

const term = require('./term.js');
const naive_bayes = require('./naive_bayes.js');
const performance_measure = require('./performance_measure.js');
const preprocessing = require('./preprocessing.js');
const arrayUtils = require('../utils/array.js');

/**
 * * Doing features extraction and save its results into database
 * @return {object}
 */
const generateAndWrite = async () => {
  // fetch data
  const [
    trainingTokens,
    trainingPreprocessings,
    testingPreprocessings,
  ] = await Promise.all([
    term.readTermsFrom('training set'),
    preprocessing.readResultsWhere({ source: 'training set' }),
    preprocessing.readResultsWhere({ source: 'testing set' }),
    deleteTfs({}),
    deleteIdfsWhere({}),
    deleteTfIdfs({}),
    naive_bayes.deleteGaussiansWhere({}),
    naive_bayes.deleteClassificationResultsWhere({}),
    performance_measure.deleteConfusionMatrixWhere({}),
    performance_measure.deletePerformanceMeasuresWhere({
      fold_number: { $ne: 0 },
    }),
  ]).catch((error) => console.error(error));

  // if any data
  if (trainingPreprocessings.length > 0 && testingPreprocessings.length > 0) {
    // get idfs and mapping its data for algorithm optimization
    const idfs = [],
      mappedIdfs = {};
    for (const token of trainingTokens) {
      // count document frequency of tokens
      let df = 0;
      for (const preprocessingResult of trainingPreprocessings) {
        const tokensOfDocument = preprocessingResult.stopword_removal_result;
        if (tokensOfDocument.includes(token.name)) df++;
      }

      // calculating inverse document frequency of tokens
      const idf = Math.log(trainingPreprocessings.length / df) + 1;
      idfs.push({
        term: token.name,
        df,
        idf,
        used_for_classification: false,
      });
      mappedIdfs[token.name] = idf;
    }

    // initializing tfs and tf-idfs container
    const trainingTfs = [],
      testingTfs = [],
      trainingTfIdfs = [],
      testingTfIdfs = [];

    //  get training tfs and tf-idfs
    for (const preprocessingResult of trainingPreprocessings) {
      const tokensOfDocument = preprocessingResult.stopword_removal_result,
        tfsOfDocument = {},
        tfIdfsOfDocument = {};

      // get tfs and calculating tf-idfs
      for (const [term, frequency] of Object.entries(
        arrayUtils.getArrayElementFrequency(tokensOfDocument),
      )) {
        tfsOfDocument[term] = frequency;
        if (mappedIdfs[term])
          tfIdfsOfDocument[term] = mappedIdfs[term] * frequency;
      }

      // append tfs of document to tfs container
      trainingTfs.push({
        dataset: preprocessingResult.dataset._id,
        label: preprocessingResult.dataset.label._id,
        tfs: tfsOfDocument,
        source: 'training set',
      });

      // append tf-idfs of document to tf-idfs container
      trainingTfIdfs.push({
        dataset: preprocessingResult.dataset._id,
        label: preprocessingResult.dataset.label._id,
        tf_idfs: tfIdfsOfDocument,
        source: 'training set',
      });
    }

    // get testing tfs and tf-idfs
    for (const preprocessingResult of testingPreprocessings) {
      const tokensOfDocument = preprocessingResult.stopword_removal_result,
        tfsOfDocument = {},
        tfIdfsOfDocument = {};

      // get tfs and calculating tf-idfs
      for (const [term, frequency] of Object.entries(
        arrayUtils.getArrayElementFrequency(tokensOfDocument),
      )) {
        tfsOfDocument[term] = frequency;
        if (mappedIdfs[term])
          tfIdfsOfDocument[term] = mappedIdfs[term] * frequency;
      }

      // append tfs of document to tfs container
      testingTfs.push({
        dataset: preprocessingResult.dataset._id,
        label: preprocessingResult.dataset.label._id,
        tfs: tfsOfDocument,
        source: 'testing set',
      });

      // append tf-idfs of document to tf-idfs container
      testingTfIdfs.push({
        dataset: preprocessingResult.dataset._id,
        label: preprocessingResult.dataset.label._id,
        tf_idfs: tfIdfsOfDocument,
        source: 'testing set',
      });
    }

    // insert features extraction result
    if (trainingTfIdfs.length > 0 && testingTfIdfs.length > 0) {
      const [
        writtenIdfs,
        writtenTrainingTfs,
        writtenTrainingTfIdfs,
        writtenTestingTfs,
        writtenTestingTfIdfs,
      ] = await Promise.all([
        IDF.insertMany(idfs, { ordered: false, lean: true }),
        TF.insertMany(trainingTfs, { ordered: false, lean: true }),
        TF_IDF.insertMany(trainingTfIdfs, { ordered: false, lean: true }),
        TF.insertMany(testingTfs, { ordered: false, lean: true }),
        TF_IDF.insertMany(testingTfIdfs, { ordered: false, lean: true }),
      ]).catch((error) => console.error(error));

      return {
        idfs: writtenIdfs,
        trainingTfs: writtenTrainingTfs,
        trainingTfIdfs: writtenTrainingTfIdfs,
        testingTfs: writtenTestingTfs,
        testingTfIdfs: writtenTestingTfIdfs,
      };
    }
  }
};

/**
 * * Save many idfs data into database
 * @param {[object]} idfs
 * @return {[object]}
 */
const createIdfs = async (idfs) => {
  const createdIdfs = await IDF.insertMany(idfs).catch((error) =>
    console.error(error),
  );
  return createdIdfs;
};

/**
 * * Get many idfs data corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readIdfsWhere = async (filter) => {
  const idfs = await IDF.find(filter).catch((error) => console.error(error));
  return idfs;
};

/**
 * * Get an idf data corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const readIdfWhere = async (filter) => {
  const idf = await IDF.findOne(filter).catch((error) => console.error(error));
  return idf;
};

/**
 * * Update many idfs data corresponding to the filter
 * @param {object} filter
 * @param {object} idfData
 * @return {Query}
 */
const updateIdfsWhere = async (filter, idfData) => {
  const response = await IDF.updateMany(filter, idfData).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Delete many idfs data corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteIdfsWhere = async (filter) => {
  const response = await IDF.deleteMany(filter).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Get many tfs data from a certain dataset source
 * @param {string} source
 * ? string enum ['training set', 'testing set']
 * @return {[object]}
 */
const readTfsFrom = async (source) => {
  const tfs = await TF.find({ source })
    .populate('label')
    .exec()
    .catch((error) => console.error(error));
  return tfs;
};

/**
 * * Get a tf data from a certain dataset source
 * @param {string} source
 * ? string enum ['training set', 'testing set']
 * @return {object}
 */
const readTfFrom = async (source) => {
  const tf = await TF.findOne({ source }).catch((error) =>
    console.error(error),
  );
  return tf;
};

/**
 * * Delete all tfs data
 * @return {Query}
 */
const deleteTfs = async () => {
  const response = await TF.deleteMany({}).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Get tf idfs data from a certain dataset source
 * @param {string} source
 * ? string enum ['training set', 'testing set']
 * @return {[object]}
 */
const readTfIdfsFrom = async (source) => {
  const tfIdfs = await TF_IDF.find({ source })
    .populate('label')
    .exec()
    .catch((error) => console.error(error));
  return tfIdfs;
};

/**
 * * Get a tf idf data from a certain dataset source
 * @param {string} source
 * ? string enum ['training set', 'testing set']
 * @return {object}
 */
const readTfIdfFrom = async (source) => {
  const tfIdf = await TF_IDF.findOne({ source }).catch((error) =>
    console.error(error),
  );
  return tfIdf;
};

/**
 * * Delete all tf idfs data
 * @return {Query}
 */
const deleteTfIdfs = async () => {
  const response = await TF_IDF.deleteMany({}).catch((error) =>
    console.error(error),
  );
  return response;
};

module.exports = {
  generateAndWrite,
  createIdfs,
  readIdfsWhere,
  readIdfWhere,
  updateIdfsWhere,
  deleteIdfsWhere,
  readTfsFrom,
  readTfFrom,
  deleteTfs,
  readTfIdfFrom,
  readTfIdfsFrom,
  deleteTfIdfs,
};
