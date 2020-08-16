const preprocessing = require('./preprocessing.js');
const features_extraction = require('./features_extraction.js');
const naive_bayes = require('./naive_bayes.js');
const arrayUtils = require('../utils/array.js');
const stringUtils = require('../utils/string.js');

/**
 * * Classifying news content into a category / label
 * @param {string} newsContent
 * @return {string}
 */
const generate = async (newsContent) => {
  // format data
  const testingSets = [{ content: newsContent }];

  // fetch data
  const [
    preprocessingResult,
    idfs,
    classificationModels,
    priors,
    tfIdfModels,
  ] = await Promise.all([
    preprocessing.generate(testingSets[0].content),
    features_extraction.readIdfsWhere({ used_for_classification: true }),
    naive_bayes.readClassificationModelsWhere({ fold_number: 0 }),
    naive_bayes.readPriorsWhere({ fold_number: 0 }),
    naive_bayes.readTfIdfModelsWhere({ fold_number: 0 }),
  ]).catch((error) => console.error(error));

  // mapping idfs data for algorithm optimization
  const mappedIdfs = {};
  for (const idfData of idfs) {
    mappedIdfs[idfData.term] = parseFloat(idfData.idf);
  }

  // calculating tf-idfs
  const tokensOfDocument = preprocessingResult.stopword_removal_result,
    tfIdfsOfDocument = new Map();
  for (const [term, frequency] of Object.entries(
    arrayUtils.getArrayElementFrequency(tokensOfDocument),
  )) {
    if (mappedIdfs[term])
      tfIdfsOfDocument.set(term, mappedIdfs[term] * frequency);
  }

  // classification
  const { classificationResults } = naive_bayes.testing(
    tfIdfModels,
    classificationModels,
    priors,
    testingSets,
    [{ tf_idfs: tfIdfsOfDocument }],
  );
  const predicted_label = stringUtils.capitalizeFirstLetter(
    classificationResults[0].predicted_label,
  );

  return predicted_label;
};

module.exports = {
  generate,
};
