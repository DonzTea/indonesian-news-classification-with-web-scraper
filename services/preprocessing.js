const sastrawi = require('sastrawijs');

const PreprocessingResult = require('../models/PreprocessingResult.js');
const stopword = require('./stopword.js');

const stemmer = new sastrawi.Stemmer();

/**
 * * Remove numbers, meta characters, and multi space from a string
 * @param {string} string
 * @return {string}
 */
const cleaning = (string) =>
  string
    .replace(/\u00A0/g, ' ') // replace non-breaking space into normal space
    .replace(/[0-9]/g, ' ') // remove numbers
    .replace(/[^\w\s]/gi, ' ') // remove meta characters
    .replace(/\s\s+/g, ' ') // remove multi space
    .trim(); // clear spaces before and after string

/**
 * * Turn string into lowercase form
 * @param {string} string
 * @return {string}
 */
const caseFolding = (string) => string.toLowerCase();

/**
 * * Split string into tokens
 * @param {string} string
 * @return {[string]}
 */
const tokenizing = (string) =>
  string
    .split(' ') // split string separated by space into array
    .filter((token) => token.length > 1); // filter element with length greater than 1 characters

/**
 * * Remove suffix and prefix of tokens
 * @param {[string]} tokens
 * @return {[string]}
 */
const stemming = (tokens) => tokens.map((token) => stemmer.stem(token));

/**
 * * Eliminates unnecessary tokens
 * @param {[string]} tokens
 * @param {[string]} stopwords
 * @return {[string]}
 */
const stopwordRemoval = (tokens, stopwords) =>
  tokens.filter((token) => !stopwords.includes(token));

/**
 * * Doing preprocessing of a string
 * @param {string} string
 * @return {object}
 */
const generate = async (string) => {
  const stopwords = await stopword.readStopwords();
  const stopwordsArray = stopwords.map((stopword) => stopword.name);

  const cleaning_result = cleaning(string);
  const case_folding_result = caseFolding(cleaning_result);
  const tokenizing_result = tokenizing(case_folding_result);
  const stemming_result = stemming(tokenizing_result);
  const stopword_removal_result = stopwordRemoval(
    stemming_result,
    stopwordsArray,
  );

  const preprocessingResult = {
    cleaning_result,
    case_folding_result,
    tokenizing_result,
    stemming_result,
    stopword_removal_result,
  };

  return preprocessingResult;
};

/**
 * * Doing preprocessing of a dataset and save its result into database
 * @param {object} dataset
 * @return {object}
 */
const generateAndWrite = async (dataset) => {
  if (dataset && dataset._id && dataset.content && dataset.type) {
    const preprocessingResult = await generate(dataset.content);
    const createdPreprocessingResult = await PreprocessingResult({
      ...preprocessingResult,
      dataset: dataset._id,
      source: dataset.type,
    })
      .save()
      .catch((error) => console.error(error));

    return createdPreprocessingResult;
  }
};

/**
 * * Get a preprocessing result having a certain dataset id
 * @param {string} datasetId
 * @return {object}
 */
const readResultWhereDatasetId = async (datasetId) => {
  const preprocessingResult = await PreprocessingResult.findOne({
    dataset: datasetId,
  })
    .populate({
      path: 'dataset',
      populate: {
        path: 'label',
      },
    })
    .exec()
    .catch((error) => console.error(error));
  return preprocessingResult;
};

/**
 * * Get preprocessing results corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readResultsWhere = async (filter) => {
  const preprocessingResults = await PreprocessingResult.find({ ...filter })
    .populate({
      path: 'dataset',
      populate: {
        path: 'label',
      },
    })
    .exec()
    .catch((error) => console.error(error));
  return preprocessingResults;
};

/**
 * * Delete a preprocessing result having a certain dataset id
 * @param {string} datasetId
 * @return {object}
 */
const deleteResult = async (datasetId) => {
  const deletedResult = await PreprocessingResult.findOneAndDelete({
    dataset: datasetId,
  }).catch((error) => console.error(error));
  return deletedResult;
};

/**
 * * Delete preprocessing results corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteResultsWhere = async (filter) => {
  const response = await PreprocessingResult.deleteMany({
    ...filter,
  }).catch((error) => console.error(error));
  return response;
};

module.exports = {
  generate,
  generateAndWrite,
  readResultWhereDatasetId,
  deleteResult,
  deleteResultsWhere,
  readResultsWhere,
};
