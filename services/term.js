const Term = require('../models/Term.js');
const preprocessing = require('./preprocessing.js');

/**
 * * Extract preprocessing results into unique tokens
 * @param {[object]} preprocessingResults
 * @return {[object]}
 */
const getUniqueTokensFromPreprocessingResults = (preprocessingResults) => [
  ...new Set(
    preprocessingResults
      .map((result) => result.stopword_removal_result)
      .flat(Infinity),
  ),
];

/**
 * * Extract tokens having source match with a certain document type and saved its result into database
 * @param {string} docType
 * ? string enum ['training set', 'testing set']
 * @return {[object]}
 */
const generateAndWrite = async (docType) => {
  // fetch data
  const preprocessingResults = await preprocessing
    .readResultsWhere({
      source: docType,
    })
    .catch((error) => console.error(error));

  if (preprocessingResults.length > 0) {
    // get unique tokens
    const tokens = getUniqueTokensFromPreprocessingResults(
      preprocessingResults,
    ).map((token) => {
      return { name: token, source: docType };
    });

    // create tokens
    const createdTokens = await Term.insertMany(tokens, {
      ordered: false,
      lean: true,
    }).catch((error) => console.error(error));

    // return created tokens
    return createdTokens;
  } else {
    return [];
  }
};

/**
 * * Get tokens having source match with a certain document type
 * @param {string} docType
 * ? string enum ['training set', 'testing set']
 * @return {[object]}
 */
const readTermsFrom = async (docType) => {
  const terms = await Term.find({ source: docType }).catch((error) =>
    console.error(error),
  );
  return terms;
};

/**
 * * Get a token having source match with a certain document type
 * @param {string} docType
 * ? string enum ['training set', 'testing set']
 * @return {object}
 */
const readTermFrom = async (docType) => {
  const term = await Term.findOne({ source: docType }).catch((error) =>
    console.error(error),
  );
  return term;
};

/**
 * * Delete tokens having source match with a certain document type
 * @param {string} docType
 * ? string enum ['training set', 'testing set']
 * @return {Query}
 */
const deleteTermsFrom = async (docType) => {
  const response = await Term.deleteMany({ source: docType }).catch((error) =>
    console.error(error),
  );
  return response;
};

module.exports = {
  getUniqueTokensFromPreprocessingResults,
  generateAndWrite,
  readTermsFrom,
  readTermFrom,
  deleteTermsFrom,
};
