const { io } = require('../app.js');
const timer = require('perf_hooks').performance;

const IDF = require('../models/IDF.js');
const TF = require('../models/TF.js');
const TF_IDF = require('../models/TF_IDF.js');

const dataset = require('./dataset.js');
const preprocessing = require('./preprocessing.js');
const term = require('./term.js');
const features_extraction = require('./features_extraction.js');
const naive_bayes = require('./naive_bayes.js');
const performance_measure = require('./performance_measure.js');
const arrayUtils = require('../utils/array.js');

/**
 * * Doing 10 fold cross validation and save its results into database
 * @return {[object]}
 */
const generateAndWrite = async () => {
  // fetch clear data
  const k = 10;
  const [trainingSets, preprocessingResults, tfIdfs] = await Promise.all([
    dataset.readDatasetsWhere({ type: 'training set' }),
    preprocessing.readResultsWhere({ source: 'training set' }),
    features_extraction.readTfIdfsFrom('training set'),
    naive_bayes.deletePriorsWhere({ fold_number: { $ne: 0 } }),
    naive_bayes.deleteClassificationModelsWhere({ fold_number: { $ne: 0 } }),
    naive_bayes.deleteTfIdfModelsWhere({ fold_number: { $ne: 0 } }),
    naive_bayes.deleteGaussiansWhere({}),
    naive_bayes.deleteClassificationResultsWhere({}),
    performance_measure.deleteConfusionMatrixWhere({}),
    performance_measure.deletePerformanceMeasuresWhere({
      fold_number: { $ne: 0 },
    }),
  ]).catch((error) => console.error(error));

  // extract data
  const shuffledDatasets = arrayUtils.shuffleArray(trainingSets);
  const totalTrainingSets = shuffledDatasets.length;
  const foldSpace =
    totalTrainingSets >= k ? Math.floor(totalTrainingSets / k) : 1;

  // split dataset to each fold
  const folds = [];
  for (let i = 0; i < k; i++) {
    const startIndex = foldSpace * i;
    const innerTrainingSets = [...shuffledDatasets];
    const validationSets = innerTrainingSets.splice(startIndex, foldSpace);
    folds.push({ innerTrainingSets, validationSets });
  }

  // split remaining dataset to each fold
  const totalRemainingDatasets = totalTrainingSets % k;
  if (totalRemainingDatasets > 0) {
    const startIndex = totalTrainingSets - totalRemainingDatasets;
    const remainingDatasets = shuffledDatasets.slice(startIndex);

    let i = 0;
    while (remainingDatasets.length > 0) {
      const remainingDataset = remainingDatasets.shift();

      folds[i].validationSets.push(remainingDataset);

      const targetIndex = folds[i].innerTrainingSets.findIndex(
        (dataset) => dataset === remainingDataset,
      );
      if (targetIndex > -1) folds[i].innerTrainingSets.splice(targetIndex, 1);
      i = i < folds.length ? i + 1 : 0;
    }
  }

  // cross validation
  const performances = [];
  for (const [index, fold] of folds.entries()) {
    // error handling
    if (fold.innerTrainingSets.length === 0)
      throw new Error('inner training sets is empty.');
    if (fold.validationSets.length === 0)
      throw new Error('validation sets is empty.');

    // get inner training sets and validation sets id
    const innerTrainingSetsId = fold.innerTrainingSets.map((dataset) =>
      dataset._id.toString(),
    );
    const validationSetsId = fold.validationSets.map((dataset) =>
      dataset._id.toString(),
    );

    // get both preprocessing and features extraction results
    const preprocessingResultsOfInnerTrainingSets = innerTrainingSetsId.map(
      (id) =>
        preprocessingResults.find(
          (result) => result.dataset._id.toString() === id,
        ),
    );
    const innerTrainingSetsTfIdfs = innerTrainingSetsId.map((id) =>
      tfIdfs.find((tfIdf) => tfIdf.dataset._id.toString() === id),
    );
    const validationSetsTfIdfs = validationSetsId.map((id) =>
      tfIdfs.find((tfIdf) => tfIdf.dataset._id.toString() === id),
    );

    // get tokens
    const innerTrainingTokens = term.getUniqueTokensFromPreprocessingResults(
      preprocessingResultsOfInnerTrainingSets,
    );

    // training
    const {
      priors,
      classificationModels,
      tfIdfModels,
    } = await naive_bayes.training(
      innerTrainingTokens,
      fold.innerTrainingSets,
      innerTrainingSetsTfIdfs,
      index + 1,
    );

    // testing
    const {
      gaussianDistributions,
      classificationResults,
    } = naive_bayes.testing(
      tfIdfModels,
      classificationModels,
      priors,
      fold.validationSets,
      validationSetsTfIdfs,
      index + 1,
      true,
    );

    // performance measurement
    const { confusionMatrix, performance } = await performance_measure.generate(
      classificationResults,
      index + 1,
      true,
    );

    // save result into database
    await Promise.all([
      naive_bayes.createPriors(priors),
      naive_bayes.createClassificationModels(classificationModels),
      naive_bayes.createTfIdfModels(tfIdfModels),
      naive_bayes.createGaussians(gaussianDistributions),
      naive_bayes.createClassificationResults(classificationResults),
      performance_measure.createConfusionMatrix(confusionMatrix),
      performance_measure.createPerformanceMeasure(performance),
    ]);

    // push fold performance
    performances.push(performance);

    // socket.io emit client
    io.emit('cross validation', performance);
  }

  return performances;
};

/**
 * * Doing multi testing on 10 fold cross validation results and save its results into database
 * @return {object}
 */
const multiTesting = async () => {
  // fetch clear data
  const [
    tfIdfModels,
    classificationModels,
    priors,
    testingSets,
    testingSetsTfIdfs,
  ] = await Promise.all([
    naive_bayes.readTfIdfModelsWhere({}),
    naive_bayes.readClassificationModelsWhere({}),
    naive_bayes.readPriorsWhere({}),
    dataset.readDatasetsWhere({ type: 'testing set' }),
    features_extraction.readTfIdfsFrom('testing set'),
    naive_bayes.deleteGaussiansWhere({ is_cross_validation_result: false }),
    naive_bayes.deleteClassificationResultsWhere({
      is_cross_validation_result: false,
    }),
    performance_measure.deleteConfusionMatrixWhere({
      is_cross_validation_result: false,
    }),
    performance_measure.deletePerformanceMeasuresWhere({
      is_cross_validation_result: false,
      fold_number: { $ne: 0 },
    }),
  ]).catch((error) => console.error(error));

  // multi testing
  const performances = [];
  for (let index = 0; index < 10; index++) {
    // extract data
    const tfIdfModelsInFold = tfIdfModels.filter(
      (model) => model.fold_number === index + 1,
    );
    const classificationModelsInFold = classificationModels.filter(
      (model) => model.fold_number === index + 1,
    );
    const priorsInFold = priors.filter(
      (model) => model.fold_number === index + 1,
    );

    // set start testing time
    const timeStart = timer.now();

    // testing
    const {
      gaussianDistributions,
      classificationResults,
    } = naive_bayes.testing(
      tfIdfModelsInFold,
      classificationModelsInFold,
      priorsInFold,
      testingSets,
      testingSetsTfIdfs,
      index + 1,
    );

    // set finish testing time
    const timeFinish = timer.now();

    // performance measurement
    const { confusionMatrix, performance } = await performance_measure.generate(
      classificationResults,
      index + 1,
    );

    // save data into database
    await Promise.all([
      naive_bayes.createGaussians(gaussianDistributions),
      naive_bayes.createClassificationResults(classificationResults),
      performance_measure.createConfusionMatrix(confusionMatrix),
      performance_measure.createPerformanceMeasure({
        ...performance,
        testing_execution_time: timeFinish - timeStart,
      }),
    ]).catch((error) => console.error(error));

    // push fold performance
    performances.push(performance);

    // socket.io emit client
    io.emit('multi testing', performance);
  }

  // sorting fold performances based its accuracy and f1-score
  const sortedPerformances = getSortedPerformances(performances);

  // get folds with highest f1-score among folds having highest accuracy
  const bestFolds = getBestFolds(sortedPerformances);

  return { performances: sortedPerformances, bestFolds };
};

/**
 * * Sorting fold performances based its accuracy and f1-score
 * @param {[object]} performances
 * @return {[object]}
 */
const getSortedPerformances = (performances) => {
  return performances.sort((a, b) => {
    const [accuracy1, accuracy2, f1Score1, f1Score2] = [
      a.overall_accuracy,
      b.overall_accuracy,
      a.avg_f1_score,
      b.avg_f1_score,
    ];
    if (accuracy2 > accuracy1) return 1;
    if (accuracy2 < accuracy1) return -1;
    if (f1Score2 > f1Score1) return 1;
    if (f1Score2 < f1Score1) return -1;
    return 0;
  });
};

/**
 * * Get folds with highest f1-score among folds having highest accuracy
 * @param {[object]} sortedPerformances
 * @return {[object]}
 */
const getBestFolds = (sortedPerformances) => {
  if (sortedPerformances.length > 0) {
    const highestAccuracy = Math.max(
      ...sortedPerformances.map((performance) =>
        parseFloat(performance.overall_accuracy),
      ),
    );

    const highestAccuracyFolds = sortedPerformances.filter(
      (performance) =>
        parseFloat(performance.overall_accuracy) === highestAccuracy,
    );

    const highestF1Score = Math.max(
      ...highestAccuracyFolds.map((performance) =>
        parseFloat(performance.avg_f1_score),
      ),
    );

    const bestFolds = highestAccuracyFolds
      .filter(
        (performance) =>
          parseFloat(performance.avg_f1_score) === highestF1Score,
      )
      .map((performance) => performance.fold_number);

    return bestFolds;
  } else {
    return [];
  }
};

/**
 * * Check whether system have features extraction result completely
 * @return {boolean}
 */
const isReady = async () => {
  let isComplete = false;

  try {
    const [
      idf,
      trainingTf,
      testingTf,
      trainingTfIdf,
      testingTfIdf,
    ] = await Promise.all([
      IDF.findOne({}),
      TF.findOne({ source: 'training set' }),
      TF.findOne({ source: 'testing set' }),
      TF_IDF.findOne({ source: 'training set' }),
      TF_IDF.findOne({ source: 'testing set' }),
    ]);

    if (idf && trainingTf && testingTf && trainingTfIdf && testingTfIdf)
      isComplete = true;
  } catch (error) {
    console.error(error);
  }

  return isComplete;
};

module.exports = {
  generateAndWrite,
  multiTesting,
  getSortedPerformances,
  getBestFolds,
  isReady,
};
