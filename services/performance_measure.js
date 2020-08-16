const ConfusionMatrix = require('../models/ConfusionMatrix.js');
const PerformanceMeasure = require('../models/PerformanceMeasure.js');

const label = require('./label.js');

/**
 * * Doing performance measurement based on classification results
 * @param {[object]} classificationResults
 * @param {number} fold_number
 * ? integer number enum [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @param {boolean} is_cross_validation_result
 * @return {object}
 */
const generate = async (
  classificationResults,
  fold_number = 0,
  is_cross_validation_result = false,
) => {
  const labels = await label.readLabels({});
  const labelNames = labels.map((labelData) => labelData.name);

  const confusionMatrix = getConfusionMatrix(
    labelNames,
    classificationResults,
    fold_number,
    is_cross_validation_result,
  );
  const performance = getPerformance(
    labelNames,
    confusionMatrix,
    fold_number,
    is_cross_validation_result,
  );

  return { confusionMatrix, performance };
};

/**
 * * Build confussion matrix based on classification results
 * @param {[string]} labelNames
 * @param {[object]} classificationResults
 * @param {number} fold_number
 * ? integer number enum [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @param {boolean} is_cross_validation_result
 * @return {[object]}
 */
const getConfusionMatrix = (
  labelNames,
  classificationResults,
  fold_number,
  is_cross_validation_result,
) => {
  const confusionMatrix = [];
  const predictedLabelsOption = [...labelNames, 'negatif'];

  for (const actualLabel of labelNames) {
    // initializing predicted labels map object
    const predicted_labels = new Map();
    for (const labelName of predictedLabelsOption) {
      predicted_labels.set(labelName, 0);
    }

    // fiter classification results having current actual label
    const resultsInLabel = classificationResults.filter(
      (result) => result.actual_label === actualLabel,
    );

    // assign classification results to predicted_labels
    if (resultsInLabel.length > 0) {
      for (const result of resultsInLabel) {
        predicted_labels.set(
          result.predicted_label,
          predicted_labels.get(result.predicted_label) + 1,
        );
      }
    }

    // push data
    confusionMatrix.push({
      actual_label: actualLabel,
      predicted_labels,
      fold_number: fold_number || 0,
      is_cross_validation_result,
    });
  }

  return confusionMatrix;
};

/**
 * * Get performance of classification model based on classification results
 * @param {[string]} labelNames
 * @param {[object]} confusionMatrix
 * @param {number} fold_number
 * ? integer number enum [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * @param {boolean} is_cross_validation_result
 * @return {object}
 */
const getPerformance = (
  labelNames,
  confusionMatrix,
  fold_number,
  is_cross_validation_result,
) => {
  // initializing performance map object
  const [accuracies, recalls, precisions, f1_scores] = [
    new Map(),
    new Map(),
    new Map(),
    new Map(),
  ];
  let [totalCorrect, totalData] = [0, 0];

  // assinging performance map object with performance values for each label
  for (const labelName of labelNames) {
    let [totalCorrectInLabel, totalDataInLabel] = [0, 0];
    let [tp, tn, fp, fn] = [0, 0, 0, 0];

    for (const matrix of confusionMatrix) {
      const actualLabel = matrix.actual_label;
      for (const [predictedLabel, value] of matrix.predicted_labels) {
        if (actualLabel === labelName) {
          totalDataInLabel += value;
          if (actualLabel === predictedLabel) totalCorrectInLabel += value;
          predictedLabel === labelName ? (tp += value) : (fn += value);
        } else {
          predictedLabel === labelName ? (fp += value) : (tn += value);
        }
      }
    }

    totalCorrect += totalCorrectInLabel;
    totalData += totalDataInLabel;

    const accuracy = parseFloat(
      parseFloat((totalCorrectInLabel / totalDataInLabel) * 100).toFixed(2),
    );
    const recall = parseFloat(
      parseFloat(tp + fn > 0 ? (tp / (tp + fn)) * 100 : '0.00').toFixed(2),
    );
    const precision = parseFloat(
      parseFloat(tp + fp > 0 ? (tp / (tp + fp)) * 100 : '0.00').toFixed(2),
    );
    const f1_score = parseFloat(
      parseFloat(
        recall + precision > 0
          ? (2 * recall * precision) / (recall + precision)
          : '0.00',
      ).toFixed(2),
    );

    accuracies.set(labelName, accuracy);
    recalls.set(labelName, recall);
    precisions.set(labelName, precision);
    f1_scores.set(labelName, f1_score);
  }

  // calculating average values for each performance criteria
  const overall_accuracy = parseFloat(
    parseFloat((totalCorrect / totalData) * 100).toFixed(2),
  );

  const avg_recall = parseFloat(
    parseFloat(
      recalls.size > 0
        ? Array.from(recalls)
            .map((entries) => parseFloat(entries[1]))
            .reduce((a, b) => a + b, 0) / recalls.size
        : '0.00',
    ).toFixed(2),
  );

  const avg_precision = parseFloat(
    parseFloat(
      precisions.size > 0
        ? Array.from(precisions)
            .map((entries) => parseFloat(entries[1]))
            .reduce((a, b) => a + b, 0) / precisions.size
        : '0.00',
    ).toFixed(2),
  );

  const avg_f1_score = parseFloat(
    parseFloat(
      f1_scores.size > 0
        ? Array.from(f1_scores)
            .map((entries) => parseFloat(entries[1]))
            .reduce((a, b) => a + b, 0) / f1_scores.size
        : '0.00',
    ).toFixed(2),
  );

  const performance = {
    accuracies,
    recalls,
    precisions,
    f1_scores,
    overall_accuracy,
    avg_recall,
    avg_precision,
    avg_f1_score,
    fold_number,
    is_cross_validation_result,
  };

  return performance;
};

/**
 * * Save confusion matrix into database
 * @param {[object]} confusionMatrix
 * @return {[object]}
 */
const createConfusionMatrix = async (confusionMatrix) => {
  const createdConfusionMatrix = await ConfusionMatrix.insertMany(
    confusionMatrix,
    { ordered: false, lean: true },
  ).catch((error) => console.error(error));
  return createdConfusionMatrix;
};

/**
 * * Get confusion matrix corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readConfusionMatrixWhere = async (filter) => {
  const confusionMatrix = await ConfusionMatrix.find({
    ...filter,
  }).catch((error) => console.error(error));
  return confusionMatrix;
};

/**
 * * Delete confusion matrix corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteConfusionMatrixWhere = async (filter) => {
  const response = await ConfusionMatrix.deleteMany({
    ...filter,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Save performance measure result into database
 * @param {object} performanceMeasure
 * @return {object}
 */
const createPerformanceMeasure = async (performanceMeasure) => {
  const createdPerformanceMeasure = await new PerformanceMeasure({
    ...performanceMeasure,
  })
    .save()
    .catch((error) => console.error(error));
  return createdPerformanceMeasure;
};

/**
 * * Get a performance measure result corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const readPerformanceMeasureWhere = async (filter) => {
  const performance = await PerformanceMeasure.findOne({
    ...filter,
  }).catch((error) => console.error(error));
  return performance;
};

/**
 * * Get performance measure results corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readPerformanceMeasuresWhere = async (filter) => {
  const performances = await PerformanceMeasure.find({
    ...filter,
  }).catch((error) => console.error(error));
  return performances;
};

/**
 * * Update a performance measure result corresponding to the filter
 * @param {object} filter
 * @param {object} performance
 * @return {Query}
 */
const updatePerformanceMeasureWhere = async (filter, performance) => {
  const response = await PerformanceMeasure.updateOne(filter, {
    ...performance,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Update performance measure results corresponding to the filter
 * @param {object} filter
 * @param {object} performance
 * @return {Query}
 */
const updatePerformanceMeasuresWhere = async (filter, performance) => {
  const response = await PerformanceMeasure.updateMany(filter, {
    ...performance,
  }).catch((error) => console.error(error));
  return response;
};

/**
 * * Delete performance measure results corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deletePerformanceMeasuresWhere = async (filter) => {
  const response = await PerformanceMeasure.deleteMany({
    ...filter,
  }).catch((error) => console.error(error));
  return response;
};

module.exports = {
  generate,
  createConfusionMatrix,
  readConfusionMatrixWhere,
  deleteConfusionMatrixWhere,
  createPerformanceMeasure,
  readPerformanceMeasureWhere,
  readPerformanceMeasuresWhere,
  updatePerformanceMeasureWhere,
  updatePerformanceMeasuresWhere,
  deletePerformanceMeasuresWhere,
};
