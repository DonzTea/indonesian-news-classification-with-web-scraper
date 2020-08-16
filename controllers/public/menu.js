const term = require('../../services/term.js');
const features_extraction = require('../../services/features_extraction.js');
const performance_measure = require('../../services/performance_measure.js');
const cross_validation = require('../../services/k_fold_cross_validation.js');
const naive_bayes = require('../../services/naive_bayes.js');
const features_selection = require('../../services/features_selection.js');
const label = require('../../services/label.js');
const stringUtils = require('../../utils/string.js');
const timeUtils = require('../../utils/time.js');

const classification = (_, res) => {
  res.render('klasifikasi', {
    menu: 1,
  });
};

const featuresExtraction = async (_, res) => {
  // fetch data
  const [
    trainingToken,
    testingToken,
    idf,
    trainingTf,
    testingTf,
    trainingTfIdf,
    testingTfIdf,
  ] = await Promise.all([
    term.readTermFrom('training set'),
    term.readTermFrom('testing set'),
    features_extraction.readIdfWhere({ used_for_classification: false }),
    features_extraction.readTfFrom('training set'),
    features_extraction.readTfFrom('testing set'),
    features_extraction.readTfIdfFrom('training set'),
    features_extraction.readTfIdfFrom('testing set'),
  ]);

  res.render('ekstraksi_fitur', {
    menu: 3,
    trainingToken: trainingToken && trainingToken._id ? true : false,
    testingToken: testingToken && testingToken._id ? true : false,
    idf: idf && idf._id ? true : false,
    trainingTf: trainingTf && trainingTf._id ? true : false,
    testingTf: testingTf && testingTf._id ? true : false,
    trainingTfIdf: trainingTfIdf && trainingTfIdf._id ? true : false,
    testingTfIdf: testingTfIdf && testingTfIdf._id ? true : false,
  });
};

const crossValidation = async (_, res) => {
  // fetch data
  const [foldResponses, multiTestingResponses] = await Promise.all([
    performance_measure.readPerformanceMeasuresWhere({
      is_cross_validation_result: true,
      fold_number: { $ne: 0 },
    }),
    performance_measure.readPerformanceMeasuresWhere({
      is_cross_validation_result: false,
      fold_number: { $ne: 0 },
    }),
  ]).catch((error) => console.error(error));

  // extract data
  const foldPerformances =
    foldResponses.length === 10
      ? foldResponses.sort((a, b) => a.fold_number - b.fold_number)
      : false;
  const multiTestingPerformances =
    multiTestingResponses.length === 10
      ? multiTestingResponses.sort((a, b) => a.fold_number - b.fold_number)
      : false;
  const rankOfMultiTestingPerformances =
    multiTestingResponses.length === 10
      ? cross_validation
          .getSortedPerformances([...multiTestingResponses])
          .map((performance) => performance.fold_number)
      : false;

  const bestFolds = cross_validation.getBestFolds(multiTestingPerformances);

  res.render('k_fold_cross_validation', {
    menu: 4,
    foldPerformances,
    multiTestingPerformances,
    rankOfMultiTestingPerformances,
    bestFolds: bestFolds.length > 0 ? bestFolds : false,
  });
};

const classificationModel = async (_, res) => {
  // fetch data
  const [priors, performance] = await Promise.all([
    naive_bayes.readPriorsWhere({ fold_number: 0 }),
    performance_measure.readPerformanceMeasureWhere({ fold_number: 0 }),
  ]).catch((error) => console.error(error));

  // string manipulation
  for (const prior of priors) {
    prior.label = stringUtils.titleCase(prior.label);
  }

  res.render('model_klasifikasi', {
    menu: 5,
    priors,
    performance,
  });
};

const featuresSelection = async (_, res) => {
  // fetch data
  const [performance, tfIdfModels, localOptimums] = await Promise.all([
    performance_measure.readPerformanceMeasureWhere({ fold_number: 0 }),
    naive_bayes.readTfIdfModelsWhere({ fold_number: 0 }),
    features_selection.readLocalOptimumsWhere({}),
  ]).catch((error) => console.error(error));

  // extract data
  const bestIndividualEver =
    localOptimums.length > 0
      ? localOptimums.find((localOptimum) => localOptimum.is_best === true)
      : false;
  const accuracyDifference = bestIndividualEver
    ? Math.abs(
        parseFloat(bestIndividualEver.fitness) -
          parseFloat(performance.overall_accuracy),
      )
    : false;
  const totalFeaturesDifference = bestIndividualEver
    ? Math.abs(bestIndividualEver.selected_features.length - tfIdfModels.length)
    : false;
  const timeDifference = bestIndividualEver
    ? timeUtils.parse(
        Math.abs(
          bestIndividualEver.testing_execution_time -
            performance.testing_execution_time,
        ),
      )
    : false;

  // benchmarking
  const originalData = {
    accuracy: performance ? parseFloat(performance.overall_accuracy) : false,
    totalFeatures: tfIdfModels.length,
    testing_execution_time: performance
      ? performance.testing_execution_time
      : false,
    executionTimeString: performance
      ? timeUtils.parse(performance.testing_execution_time)
      : false,
  };
  const newData = {
    accuracy: bestIndividualEver
      ? parseFloat(bestIndividualEver.fitness)
      : false,
    totalFeatures: bestIndividualEver
      ? bestIndividualEver.selected_features.length
      : false,
    testing_execution_time: bestIndividualEver
      ? bestIndividualEver.testing_execution_time
      : false,
    executionTimeString: bestIndividualEver
      ? timeUtils.parse(bestIndividualEver.testing_execution_time)
      : false,
  };
  const comparisonResult = {
    accuracy: accuracyDifference,
    totalFeatures: totalFeaturesDifference,
    executionTimeString: timeDifference,
  };

  const originalAccuracy = originalData.accuracy;
  const newAccuracy = newData.accuracy;
  const originalTotalFeatures = originalData.totalFeatures;
  const newTotalFeatures = newData.totalFeatures;
  const originalExecutionTime = originalData.testing_execution_time;
  const newExecutionTime = newData.testing_execution_time;

  // set conclusion
  let accuracyReview = '<u><b>Akurasi</b></u> ';
  if (newAccuracy === originalAccuracy) {
    accuracyReview += 'tidak mengalami perubahan';
  } else if (comparisonResult.accuracy) {
    accuracyReview += `${
      newAccuracy > originalAccuracy ? 'meningkat' : 'menurun'
    } sebesar <b><span class="${
      newAccuracy > originalAccuracy ? 'text-success' : 'text-danger'
    }">${comparisonResult.accuracy.toFixed(2)} %</span></b>`;
  }
  let totalFeaturesReview = 'jumlah <u><b>fitur kata</b></u> ';
  if (newTotalFeatures === originalTotalFeatures) {
    totalFeaturesReview += 'tidak mengalami perubahan';
  } else {
    totalFeaturesReview += `${
      newTotalFeatures > originalTotalFeatures ? 'bertambah' : 'berkurang'
    } sebanyak <b><span class="${
      newTotalFeatures > originalTotalFeatures ? 'text-danger' : 'text-success'
    }">${comparisonResult.totalFeatures}</span></b> kata`;
  }
  let executionTimeReview = 'lama <u><b>waktu pengujian</b></u> ';
  if (newExecutionTime === originalExecutionTime) {
    executionTimeReview += 'tidak mengalami perubahan';
  } else {
    executionTimeReview += `lebih ${
      newExecutionTime > originalExecutionTime ? 'lama' : 'singkat'
    } <b><span class="${
      newExecutionTime > originalExecutionTime ? 'text-danger' : 'text-success'
    }">&plusmn; ${comparisonResult.executionTimeString}</span></b>`;
  }
  const conclusion = `<b>Kesimpulan :</b> ${accuracyReview}, ${totalFeaturesReview}, sementara ${executionTimeReview}.`;

  res.render('seleksi_fitur', {
    menu: 6,
    localOptimums,
    bestGenerationNumber: bestIndividualEver
      ? bestIndividualEver.generation_number
      : false,
    bestIndividuNumber: bestIndividualEver
      ? bestIndividualEver.individu_number
      : false,
    originalData,
    newData,
    conclusion,
    showSaveButton: newAccuracy >= originalAccuracy ? true : false,
  });
};

const webScraping = async (_, res) => {
  const labels = await label
    .readLabels({ scraping_url: { $ne: null } })
    .catch((error) => console.error(error));

  for (const label of labels) {
    label.name = stringUtils.titleCase(label.name);
  }

  res.render('web_scraping', {
    menu: 7,
    labels,
  });
};

module.exports = {
  classification,
  featuresExtraction,
  crossValidation,
  classificationModel,
  featuresSelection,
  webScraping,
};
