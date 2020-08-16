const Prior = require('../models/Prior.js');
const ClassificationModel = require('../models/ClassificationModel.js');
const TF_IDF_Model = require('../models/TF_IDF_Model.js');
const Gaussian = require('../models/Gaussian.js');
const ClassificationResult = require('../models/ClassificationResult.js');

const label = require('./label.js');

/**
 * * Training classification model
 * @param {[string]} trainingTokens
 * @param {[object]} trainingSets
 * @param {[object]} trainingSetsTfIdfs
 * @param {number} fold_number
 * ? integer number enum [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @return {object}
 */
const training = async (
  trainingTokens,
  trainingSets,
  trainingSetsTfIdfs,
  fold_number,
) => {
  // fetch labels
  const labels = await label
    .readLabels({})
    .catch((error) => console.error(error));

  // build tf-idf models
  const tfIdfModels = [];
  for (const token of trainingTokens) {
    const tf_idfs = [];
    for (const tfIdfData of trainingSetsTfIdfs) {
      const tfIdf = tfIdfData.tf_idfs.get(token);
      if (tfIdf) tf_idfs.push(parseFloat(tfIdf));
    }
    tfIdfModels.push({
      term: token,
      tf_idfs: [...new Set(tf_idfs)],
      fold_number,
    });
  }

  // calculating priors probability
  const priors = [];
  const totalTrainingSets = trainingSets.length;
  for (const labelData of labels) {
    const totalTrainingSetsInLabel = trainingSets.filter(
      (document) => document.label._id.toString() === labelData._id.toString(),
    ).length;

    const prior = totalTrainingSetsInLabel / totalTrainingSets;
    priors.push({
      label: labelData.name,
      value: prior,
      fold_number,
    });
  }

  // build classification models
  const classificationModels = [];
  for (const labelData of labels) {
    const tfIdfsInLabel = trainingSetsTfIdfs.filter(
      (document) => document.label._id.toString() === labelData._id.toString(),
    );
    const means = new Map();
    const stdevs = new Map();

    for (const token of trainingTokens) {
      tfIdfsOfTermInLabel = [];
      for (const tfIdfData of tfIdfsInLabel) {
        const tfIdfOfTermInDocument = tfIdfData.tf_idfs.get(token);
        tfIdfsOfTermInLabel.push(parseFloat(tfIdfOfTermInDocument || 0));
      }

      const totalTfIdfsInLabel = tfIdfsOfTermInLabel.length;
      const mean =
        tfIdfsOfTermInLabel.reduce((a, b) => a + b, 0) / totalTfIdfsInLabel;
      const stdev =
        mean !== 0
          ? Math.sqrt(
              tfIdfsOfTermInLabel
                .map((tfIdf) => (tfIdf - mean) ** 2)
                .reduce((a, b) => a + b, 0) /
                (totalTfIdfsInLabel - 1),
            )
          : 1;

      means.set(token, mean);
      stdevs.set(token, stdev);
    }

    // push result
    classificationModels.push({
      label: labelData.name,
      means,
      stdevs,
      fold_number,
    });
  }

  return { priors, classificationModels, tfIdfModels };
};

/**
 * * Testing classification model
 * @param {[object]} tfIdfModels
 * @param {[object]} classificationModels
 * @param {[object]} priors
 * @param {[object]} testingSets
 * @param {[object]} testingSetsTfIdfs
 * @param {number} fold_number
 * ? integer number enum [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @param {boolean} is_cross_validation_result
 * @return {object}
 */
const testing = (
  tfIdfModels,
  classificationModels,
  priors,
  testingSets,
  testingSetsTfIdfs,
  fold_number = 0,
  is_cross_validation_result = false,
) => {
  const gaussianDistributions = calculateGaussianDistributions(
    tfIdfModels,
    classificationModels,
    testingSetsTfIdfs,
    fold_number,
    is_cross_validation_result,
  );

  const classificationResults = classification(
    testingSets,
    priors,
    gaussianDistributions,
    fold_number,
    is_cross_validation_result,
  );

  return { gaussianDistributions, classificationResults };
};

/**
 * * Calculating gaussian distributions for each term of testing sets
 * @param {[object]} tfIdfModels
 * @param {[object]} classificationModels
 * @param {[object]} testingSetsTfIdfs
 * @param {number} fold_number
 * ? integer number enum [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @param {boolean} is_cross_validation_result
 * @return {[object]}
 */
const calculateGaussianDistributions = (
  tfIdfModels,
  classificationModels,
  testingSetsTfIdfs,
  fold_number,
  is_cross_validation_result,
) => {
  const gaussianDistributions = [];

  // algorithm optimization
  const mappedTfIdfModel = {};
  for (const data of tfIdfModels) {
    mappedTfIdfModel[data.term] = data.tf_idfs.map((tf_idf) =>
      parseFloat(tf_idf),
    );
  }

  // calculating gaussian distributions
  for (const document of testingSetsTfIdfs) {
    const datasetId =
      testingSetsTfIdfs.length > 1 ? document.dataset._id.toString() : '';
    for (const [term, tfIdf] of document.tf_idfs) {
      if (
        mappedTfIdfModel[term] &&
        mappedTfIdfModel[term].includes(parseFloat(tfIdf))
      ) {
        const distributions = new Map();
        for (const model of classificationModels) {
          const mean = parseFloat(model.means.get(term));
          const stdev = parseFloat(model.stdevs.get(term));
          const distribution =
            mean && stdev
              ? (1 / (stdev * Math.sqrt(2 * Math.PI))) *
                Math.E ** -((tfIdf - mean) ** 2 / (2 * stdev ** 2))
              : (1 / Math.sqrt(2 * Math.PI)) * Math.E ** -(tfIdf ** 2 / 4);
          distributions.set(model.label, distribution);
        }
        gaussianDistributions.push({
          dataset: datasetId,
          term: term,
          tf_idf: parseFloat(tfIdf),
          distributions,
          fold_number,
          is_cross_validation_result,
        });
      }
    }
  }

  return gaussianDistributions;
};

/**
 * * Determine classification result for each testing set based on highest probability
 * @param {[object]} testingSets
 * @param {[object]} priors
 * @param {[object]} gaussianDistributions
 * @param {number} fold_number
 * ? integer number enum [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @param {boolean} is_cross_validation_result
 * @return {[object]}
 */
const classification = (
  testingSets,
  priors,
  gaussianDistributions,
  fold_number,
  is_cross_validation_result,
) => {
  const classificationResults = [];

  for (const document of testingSets) {
    // initializing probability with priors probability
    const probabilities = new Map(
      priors.map((prior) => [prior.label, prior.value]),
    );

    // get gaussian distributions of current document
    const gaussianDistributionsOfDocument =
      testingSets.length > 1
        ? gaussianDistributions.filter(
            (data) => data.dataset === document._id.toString(),
          )
        : gaussianDistributions;

    // accumulating gaussian distributions to priors probability
    if (gaussianDistributionsOfDocument.length > 0) {
      for (const data of gaussianDistributionsOfDocument) {
        for (const [labelName, distribution] of data.distributions) {
          probabilities.set(
            labelName,
            parseFloat(probabilities.get(labelName)) * parseFloat(distribution),
          );
        }
      }
    }

    // determines label of document
    let predicted_label = 'negatif';
    if (
      Object.values(Object.fromEntries(probabilities)).some(
        (probability) => probability > 0,
      )
    ) {
      // estimate possible labels with highest probability
      const probabilityEntries = Array.from(probabilities);
      const highestProbability = Math.max(
        ...probabilityEntries.map((entries) => entries[1]),
      );
      const possibleLabels = probabilityEntries
        .filter((entries) => entries[1] === highestProbability)
        .map((entries) => entries[0]);

      // pick a possible label as predicted label
      predicted_label =
        possibleLabels[
          possibleLabels.length === 1
            ? 0
            : Math.floor(Math.random() * possibleLabels.length)
        ];
    }

    // push result
    classificationResults.push({
      dataset: testingSets.length > 1 ? document._id.toString() : '',
      probabilities,
      actual_label: testingSets.length > 1 ? document.label.name : '',
      predicted_label,
      fold_number,
      is_cross_validation_result,
    });
  }

  return classificationResults;
};

/**
 * * Save priors probability into database
 * @param {[object]} priors
 * @return {[object]}
 */
const createPriors = async (priors) => {
  const response = await Prior.insertMany(priors, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Get a prior probability corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const readPriorWhere = async (filter) => {
  const prior = await Prior.findOne(filter).catch((error) =>
    console.error(error),
  );
  return prior;
};

/**
 * * Get priors probability corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readPriorsWhere = async (filter) => {
  const priors = await Prior.find(filter).catch((error) =>
    console.error(error),
  );
  return priors;
};

/**
 * * Update priors probability corresponding to the filter
 * @param {object} filter
 * @param {object} priorData
 * @return {Query}
 */
const updatePriorsWhere = async (filter, priorData) => {
  const response = await Prior.updateMany(filter, {
    ...priorData,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Delete priors probability corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deletePriorsWhere = async (filter) => {
  const response = await Prior.deleteMany(filter).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Save classification models into database
 * @param {[object]} classificationModels
 * @return {[object]}
 */
const createClassificationModels = async (classificationModels) => {
  const response = await ClassificationModel.insertMany(classificationModels, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Get a classification model corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const readClassificationModelWhere = async (filter) => {
  const classificationModel = await ClassificationModel.findOne({
    ...filter,
  }).catch((error) => console.error(error));
  return classificationModel;
};

/**
 * * Get classification models corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readClassificationModelsWhere = async (filter) => {
  const classificationModels = await ClassificationModel.find({
    ...filter,
  }).catch((error) => console.error(error));
  return classificationModels;
};

/**
 * * Update classification models corresponding to the filter
 * @param {object} filter
 * @param {object} classificationModelData
 * @return {Query}
 */
const updateClassificationModelsWhere = async (
  filter,
  classificationModelData,
) => {
  const response = await ClassificationModel.updateMany(filter, {
    ...classificationModelData,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Delete classification models corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteClassificationModelsWhere = async (filter) => {
  const response = await ClassificationModel.deleteMany({
    ...filter,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Save tf idf models into database
 * @param {[object]} tfIdfModels
 * @return {[object]}
 */
const createTfIdfModels = async (tfIdfModels) => {
  const createdTfIdfModels = await TF_IDF_Model.insertMany(tfIdfModels, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));
  return createdTfIdfModels;
};

/**
 * * Get a tf idf model corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const readTfIdfModelWhere = async (filter) => {
  const tfIdfModel = await TF_IDF_Model.findOne(filter).catch((error) =>
    console.error(error),
  );
  return tfIdfModel;
};

/**
 * * Get tf idf models corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readTfIdfModelsWhere = async (filter) => {
  const tfIdfModels = await TF_IDF_Model.find(filter).catch((error) =>
    console.error(error),
  );
  return tfIdfModels;
};

/**
 * * Update tf idf models corresponding to the filter
 * @param {object} filter
 * @param {object} tfIdfModelData
 * @return {Query}
 */
const updateTfIdfModelsWhere = async (filter, tfIdfModelData) => {
  const response = await TF_IDF_Model.updateMany(filter, {
    ...tfIdfModelData,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Delete tf idf models corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteTfIdfModelsWhere = async (filter) => {
  const response = await TF_IDF_Model.deleteMany({
    ...filter,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Save gaussian distributions into database
 * @param {[object]} gaussianDistributions
 * @return {[object]}
 */
const createGaussians = async (gaussianDistributions) => {
  const createdGaussianDistributions = await Gaussian.insertMany(
    gaussianDistributions,
    {
      ordered: false,
      lean: true,
    },
  ).catch((error) => console.error(error));
  return createdGaussianDistributions;
};

/**
 * * Get gaussian distributions corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readGaussiansWhere = async (filter) => {
  const gaussianDistributions = await Gaussian.find(filter).catch((error) =>
    console.error(error),
  );
  return gaussianDistributions;
};

/**
 * * Delete gaussian distributions corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteGaussiansWhere = async (filter) => {
  const response = await Gaussian.deleteMany(filter).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Save classification results into database
 * @param {[object]} classificationResults
 * @return {[object]}
 */
const createClassificationResults = async (classificationResults) => {
  const createdClassificationResults = await ClassificationResult.insertMany(
    classificationResults,
    { ordered: false, lean: true },
  ).catch((error) => console.error(error));
  return createdClassificationResults;
};

/**
 * * Get classification results corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readClassificationResultsWhere = async (filter) => {
  const classificationResults = await ClassificationResult.find({
    ...filter,
  }).catch((error) => console.error(error));
  return classificationResults;
};

/**
 * * Delete classification results corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteClassificationResultsWhere = async (filter) => {
  const classificationResults = await ClassificationResult.deleteMany({
    ...filter,
  }).catch((error) => console.error(error));
  return classificationResults;
};

module.exports = {
  training,
  testing,
  createPriors,
  readPriorWhere,
  readPriorsWhere,
  updatePriorsWhere,
  deletePriorsWhere,
  createClassificationModels,
  readClassificationModelWhere,
  readClassificationModelsWhere,
  updateClassificationModelsWhere,
  deleteClassificationModelsWhere,
  createTfIdfModels,
  readTfIdfModelWhere,
  readTfIdfModelsWhere,
  updateTfIdfModelsWhere,
  deleteTfIdfModelsWhere,
  createGaussians,
  readGaussiansWhere,
  deleteGaussiansWhere,
  createClassificationResults,
  readClassificationResultsWhere,
  deleteClassificationResultsWhere,
};
