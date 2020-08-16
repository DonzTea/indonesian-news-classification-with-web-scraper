const dataset = require('../../services/dataset.js');
const features_extraction = require('../../services/features_extraction.js');
const naive_bayes = require('../../services/naive_bayes.js');
const performance_measure = require('../../services/performance_measure.js');
const web_scraping = require('../../services/web_scraping.js');
const stringUtils = require('../../utils/string.js');

const readDatasetsWhere = async (req, res) => {
  const docType = req.body.docType;
  const filterIdsRequest = req.body.filterIds;
  const filterIds =
    typeof filterIdsRequest === 'object'
      ? filterIdsRequest.map((id) => {
          return { label: id };
        })
      : [{ label: filterIdsRequest }];

  try {
    const datasets = await dataset.readDatasetsWhere({
      type: docType,
      $or: filterIds,
    });

    // create row data for datatables
    const data = datasets.map((dataset, index) => [
      `<input type="checkbox" dataset-id="${dataset._id}" name="check-single"></input>`,
      index + 1,
      stringUtils.capitalizeFirstLetter(dataset.content),
      stringUtils.titleCase(dataset.label.name),
      `<div class="text-center">
            <a href="/dataset-detail/${dataset._id}" name="btn-view" dataset-id="${dataset._id}"
              class="icon mx-1">
              <i class="fe fe-eye"></i>
            </a>
            <a name="btn-edit" dataset-id="${dataset._id}" class="icon mx-1" href="javascript:void(0)">
              <i class="fe fe-edit"></i>
            </a>
            <a name="btn-delete" dataset-id="${dataset._id}" class="icon mx-1" href="javascript:void(0)">
              <i class="fe fe-trash-2"></i>
            </a>
        </div>`,
    ]);
    res.status(200).send({ data });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const readIdfModel = async (_, res) => {
  try {
    // fetch data
    const idfModels = await features_extraction.readIdfsWhere({
      used_for_classification: true,
    });

    // create rows data
    const data = [];
    for (const [index, idfData] of idfModels.entries()) {
      data.push([
        `<span class="text-muted">${index + 1}.</span>`,
        idfData.term,
        idfData.df.toString(),
        idfData.idf.toString(),
      ]);
    }

    return res.status(200).send({ data });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const readTfIdfModelWhere = async (req, res) => {
  const fold_number = parseInt(req.params.foldNumber);
  const foldNumberEnum = Array.from(Array(11).keys());

  // if request parameter is valid
  if (foldNumberEnum.includes(fold_number)) {
    try {
      // fetch data
      const tfIdfModels = await naive_bayes.readTfIdfModelsWhere({
        fold_number,
      });

      if (tfIdfModels.length > 0) {
        const data = [];
        for (const [modelIndex, model] of tfIdfModels.entries()) {
          const rowData = [];
          rowData.push(`<span class="text-muted">${modelIndex + 1}.</span>`);
          rowData.push(model.term);

          const tfIdfsList = ['<ul type="none" class="p-0">'];
          for (const tfIdf of model.tf_idfs) {
            tfIdfsList.push('<li>' + tfIdf.toString() + '</li>');
          }
          tfIdfsList.push('</ul>');
          rowData.push(tfIdfsList.join(''));
          data.push(rowData);
        }

        return res.status(200).send({ data });
      } else {
        return res.sendStatus(404);
      }
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const readClassificationModelWhere = async (req, res) => {
  const fold_number = parseInt(req.params.foldNumber);
  const foldEnum = Array.from(Array(11).keys());

  // if request parameter is valid
  if (foldEnum.includes(fold_number)) {
    try {
      // fetch data
      const label = req.params.label.replace('-', ' ');
      const classificationModel = await naive_bayes.readClassificationModelWhere(
        {
          fold_number,
          label,
        },
      );

      // create rows data
      const data = [];
      let index = 1;
      for (const [term, mean] of classificationModel.means) {
        data.push([
          `<span class="text-muted">${index++}.</span>`,
          term,
          mean.toString(),
          classificationModel.stdevs.get(term).toString(),
        ]);
      }
      return res.status(200).send({ data });
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    return res.sendStatus(400);
  }
};

const readGaussianDistributionsWhere = async (req, res) => {
  const dataset = req.params.docId;
  const label = req.params.label.replace('-', ' ');
  const slugProcessName = req.params.slugProcessName;
  const slugProcessNameEnum = ['hasil-cross-validation', 'hasil-testing'];

  // if request parameter is valid
  if (slugProcessNameEnum.includes(slugProcessName)) {
    try {
      const is_cross_validation_result =
        slugProcessName === slugProcessNameEnum[0] ? true : false;

      // fetch data
      const gaussians = await naive_bayes.readGaussiansWhere({
        dataset,
        is_cross_validation_result,
      });

      // create rows data
      const data = [];
      for (const [index, gaussian] of gaussians.entries()) {
        data.push([
          `<span class="text-muted">${index + 1}.</span>`,
          gaussian.term,
          gaussian.tf_idf.toString(),
          gaussian.distributions.get(label).toString(),
        ]);
      }

      return res.status(200).send({ data });
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    return res.sendStatus(400);
  }
};

const readProbabilityOfDocumentWhere = async (req, res) => {
  const fold_number = req.params.foldNumber;
  const foldNumberEnum = Array.from(Array(11).keys()).slice(1);
  const slugProcessName = req.params.slugProcessName;
  const slugProcessNameEnum = ['hasil-cross-validation', 'hasil-testing'];

  // if request parameters are valid
  if (
    foldNumberEnum.includes(parseInt(fold_number)) &&
    slugProcessNameEnum.includes(slugProcessName)
  ) {
    const is_cross_validation_result =
      slugProcessName === slugProcessNameEnum[0] ? true : false;
    try {
      // fetch data
      const [classificationResults, documentsId] = await Promise.all([
        naive_bayes.readClassificationResultsWhere({
          fold_number,
          is_cross_validation_result,
        }),
        dataset
          .readDatasetsWhere({})
          .then((documents) =>
            documents.map((document) => document._id.toString()),
          ),
      ]);

      // string manipulation
      for (const result of classificationResults) {
        result.actual_label = stringUtils.titleCase(result.actual_label);
        result.predicted_label = stringUtils.titleCase(result.predicted_label);
      }

      // create rows data
      const data = [];
      for (const result of classificationResults) {
        const rowData = [];
        rowData.push(
          stringUtils.clearTemplateLiteralSpace(`
            ${
              documentsId.includes(result.dataset.toString())
                ? `<a href="/dataset-detail/${result.dataset}">${result.dataset}</a>`
                : `<span class="text-muted">${result.dataset}</span>`
            }
          `),
        );
        for (const probabilityEntries of result.probabilities) {
          rowData.push(probabilityEntries[1].toString());
        }
        data.push(rowData);
      }

      return res.status(200).send({ data });
    } catch (error) {
      console.error(error);
      return res.sendStatus(404);
    }
  } else {
    return res.sendStatus(400);
  }
};

const readClassificationResultsWhere = async (req, res) => {
  const fold_number = req.params.foldNumber;
  const foldNumberEnum = Array.from(Array(11).keys()).slice(1);
  const slugProcessName = req.params.slugProcessName;
  const slugProcessNameEnum = ['hasil-cross-validation', 'hasil-testing'];

  // if request parameters are valid
  if (
    foldNumberEnum.includes(parseInt(fold_number)) &&
    slugProcessNameEnum.includes(slugProcessName)
  ) {
    try {
      const is_cross_validation_result =
        slugProcessName === slugProcessNameEnum[0] ? true : false;

      // fetch data
      const [classificationResults, documentsId] = await Promise.all([
        naive_bayes.readClassificationResultsWhere({
          fold_number,
          is_cross_validation_result,
        }),
        dataset
          .readDatasetsWhere({})
          .then((documents) =>
            documents.map((document) => document._id.toString()),
          ),
      ]);

      // string manipulation
      for (const result of classificationResults) {
        result.actual_label = stringUtils.titleCase(result.actual_label);
        result.predicted_label = stringUtils.titleCase(result.predicted_label);
      }

      // create rows data
      const data = [];
      for (const [index, result] of classificationResults.entries()) {
        data.push([
          `<span class="text-muted">${index + 1}.</span>`,
          stringUtils.clearTemplateLiteralSpace(`
            ${
              documentsId.includes(result.dataset.toString())
                ? `<a href="/dataset-detail/${result.dataset}/">${result.dataset}</a>`
                : result.dataset
            }
          `),
          result.actual_label,
          result.predicted_label,
        ]);
      }

      return res.status(200).send({ data });
    } catch (error) {
      console.error(error);
      return res.sendStatus(404);
    }
  } else {
    return res.sendStatus(400);
  }
};

const readConfusionMatrixWhere = async (req, res) => {
  const fold_number = req.params.foldNumber;
  const foldNumberEnum = Array.from(Array(11).keys()).slice(1);
  const slugProcessName = req.params.slugProcessName;
  const slugProcessNameEnum = ['hasil-cross-validation', 'hasil-testing'];

  // if request parameters are valid
  if (
    foldNumberEnum.includes(parseInt(fold_number)) &&
    slugProcessNameEnum.includes(slugProcessName)
  ) {
    try {
      const is_cross_validation_result =
        slugProcessName === slugProcessNameEnum[0] ? true : false;

      // fetch data
      const [
        priors,
        classificationResults,
        confusionMatrix,
      ] = await Promise.all([
        naive_bayes.readPriorsWhere({ fold_number }),
        naive_bayes.readClassificationResultsWhere({
          fold_number,
          is_cross_validation_result,
        }),
        performance_measure.readConfusionMatrixWhere({
          fold_number,
          is_cross_validation_result,
        }),
      ]);

      // string manipulation
      for (const result of classificationResults) {
        result.actual_label = stringUtils.titleCase(result.actual_label);
        result.predicted_label = stringUtils.titleCase(result.predicted_label);
      }

      // create rows data
      const data = [
        ...priors.map((data) => [
          `<span class="text-muted">${data.label.toUpperCase()}</span>`,
        ]),
        [`<span class="text-muted">NEGATIF</span>`],
      ];
      for (const matrix of confusionMatrix) {
        let i = 0;
        for (const [_, value] of matrix.predicted_labels) {
          data[i].push(value);
          i++;
        }
      }

      return res.status(200).send({ data });
    } catch (error) {
      console.error(error);
      return res.sendStatus(404);
    }
  } else {
    return res.sendStatus(400);
  }
};

const readWebScrapingResults = async (_, res) => {
  try {
    // fetch data
    const datas = await web_scraping.readDatasWhere({});

    // create rows data
    const data = datas.map((data, index) => [
      `<input type="checkbox" data-id="${data._id}" name="check-single"></input>`,
      index + 1,
      stringUtils.capitalizeFirstLetter(data.content),
      stringUtils.titleCase(data.label),
      `<div class="text-center">
          <a name="btn-detail" data-id="${data._id}" class="icon mx-1" href="javascript:void(0)">
            <i class="fe fe-eye"></i>
          </a>
          <a name="btn-delete" data-id="${data._id}" class="icon mx-1" href="javascript:void(0)">
            <i class="fe fe-trash-2"></i>
          </a>
      </div>`,
    ]);

    return res.status(200).send({ data });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  readDatasetsWhere,
  readIdfModel,
  readTfIdfModelWhere,
  readClassificationModelWhere,
  readGaussianDistributionsWhere,
  readProbabilityOfDocumentWhere,
  readClassificationResultsWhere,
  readConfusionMatrixWhere,
  readWebScrapingResults,
};
