const label = require('../../services/label.js');
const stopword = require('../../services/stopword.js');
const preprocessing = require('../../services/preprocessing.js');
const naive_bayes = require('../../services/naive_bayes.js');
const performance_measure = require('../../services/performance_measure.js');
const stringUtils = require('../../utils/string.js');

const labelAndStopword = async (_, res) => {
  // fetch data
  const [labels, stopwords] = await Promise.all([
    label.readLabels(),
    stopword.readStopwords(),
  ]).catch((error) => console.error(error));

  // string manipulation
  for (const [index, label] of labels.entries()) {
    labels[index].name = stringUtils.titleCase(label.name);
  }

  res.render('label_dan_stopwords', {
    menu: 2,
    subMenu: 1,
    labels,
    stopwords,
  });
};

const datasets = async (req, res) => {
  const slugDocType = req.params.slugDocType;
  if (slugDocType === 'training-set' || slugDocType === 'testing-set') {
    // if accept valid slug document type request

    // fetch data
    const labels = await label
      .readLabels()
      .catch((error) => console.error(error));

    for (const label of labels) {
      label.name = stringUtils.titleCase(label.name);
    }

    // render page
    res.render('dataset', {
      menu: 2,
      subMenu: slugDocType === 'training-set' ? 2 : 3,
      title: `Dokumen ${stringUtils.titleCase(slugDocType.replace('-', ' '))}`,
      labels,
    });
  } else {
    // render error page
    res.render('http_status', {
      code: 404,
      error: 'Not Found',
      message: 'Halaman tidak ditemukan.',
    });
  }
};

const documentDetail = async (req, res) => {
  // fetch data
  const preprocessingResult = await preprocessing
    .readResultWhereDatasetId(req.params.id)
    .catch((error) => console.error(error));

  // string manipulation
  if (
    preprocessingResult.dataset.label &&
    preprocessingResult.dataset.label.name
  )
    preprocessingResult.dataset.label.name = stringUtils.titleCase(
      preprocessingResult.dataset.label.name,
    );
  if (preprocessingResult.dataset.type)
    preprocessingResult.dataset.type = stringUtils.titleCase(
      preprocessingResult.dataset.type,
    );

  // set title
  const title = `Detail Dokumen ${preprocessingResult.dataset.type}`;

  // render page
  res.render('dataset_detail', {
    menu: 2,
    subMenu: 0,
    title,
    preprocessingResult,
  });
};

const foldDetail = async (req, res) => {
  const fold_number = req.params.foldNumber;
  const foldNumberEnum = Array.from(Array(11).keys()).slice(1);
  const slugProcessName = req.params.slugProcessName;
  const slugProcessNameEnum = ['hasil-cross-validation', 'hasil-testing'];

  if (
    foldNumberEnum.includes(parseInt(fold_number)) &&
    slugProcessNameEnum.includes(slugProcessName)
  ) {
    // if requests are valid

    const is_cross_validation_result =
      slugProcessName === slugProcessNameEnum[0] ? true : false;

    // fetch data
    const [priors, classificationResults, performance] = await Promise.all([
      naive_bayes.readPriorsWhere({ fold_number }),
      naive_bayes.readClassificationResultsWhere({
        fold_number,
        is_cross_validation_result,
      }),
      performance_measure.readPerformanceMeasureWhere({
        fold_number,
        is_cross_validation_result,
      }),
    ]).catch((error) => console.error(error));

    // string manipulation
    for (const prior of priors) {
      prior.label = stringUtils.titleCase(prior.label);
    }
    for (const result of classificationResults) {
      result.actual_label = stringUtils.titleCase(result.actual_label);
      result.predicted_label = stringUtils.titleCase(result.predicted_label);
    }

    // render page
    res.render('fold', {
      menu: 4,
      title: `Hasil ${
        slugProcessName === slugProcessNameEnum[0]
          ? 'Cross Validation'
          : 'Pengujian (Testing)'
      } pada Fold ke ${fold_number}`,
      priors,
      classificationResults,
      performance,
    });
  } else {
    // render error page
    res.render('http_status', {
      code: 404,
      error: 'Not Found',
      message: 'Halaman tidak ditemukan.',
    });
  }
};

module.exports = {
  labelAndStopword,
  datasets,
  documentDetail,
  foldDetail,
};
