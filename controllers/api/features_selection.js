const features_selection = require('../../services/features_selection.js');
const naive_bayes = require('../../services/naive_bayes.js');
const performance_measure = require('../../services/performance_measure.js');
const features_extraction = require('../../services/features_extraction.js');

const run = async (req, res) => {
  const {
    totalPopulation,
    totalIndividu,
    crossoverRate,
    mutationRate,
  } = req.body;

  // if requests acceptable
  if (totalPopulation && totalIndividu && crossoverRate && mutationRate) {
    try {
      // start features selection
      const response = await features_selection.generateAndWrite(
        totalPopulation,
        totalIndividu,
        crossoverRate,
        mutationRate,
      );

      // error handling
      if (response.errorLevel) {
        let message, url;
        switch (response.errorLevel) {
          case 1:
            message =
              'Dokumen testing set tidak ditemukan.<br>Mohon tambahkan dokumen testing set terlebih dahulu.<br>Ingin menuju halaman testing set sekarang?';
            url = '/dokumen/testing-set';
            break;
          case 2:
            message =
              'Hasil ekstraksi fitur tidak ditemukan.<br>Mohon lakukan ekstraksi fitur terlebih dahulu.<br>Ingin menuju halaman ekstraksi fitur sekarang?';
            url = '/ekstraksi-fitur';
            break;
          case 3:
            message =
              'Belum ada model klasifikasi yang disimpan.<br>Mohon lakukan proses pelatihan terlebih dahulu.<br>Ingin menuju halaman 10 fold cross validation sekarang?';
            url = '/10-fold-cross-validation';
            break;
          default:
            break;
        }

        return res.status(404).send({ message, url });
      }

      return res.status(201).send(response);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    // send response
    res.sendStatus(400);
  }
};

const updateModel = async (_, res) => {
  try {
    // fetch data
    const bestIndividualEver = await features_selection.readLocalOptimumWhere({
      is_best: true,
    });
    const selectedFeatures = bestIndividualEver.selected_features;
    const [classificationModels] = await Promise.all([
      naive_bayes.readClassificationModelsWhere({ fold_number: 0 }),
      performance_measure.updatePerformanceMeasureWhere(
        { fold_number: 0 },
        {
          accuracies: bestIndividualEver.accuracies,
          recalls: bestIndividualEver.recalls,
          precisions: bestIndividualEver.precisions,
          f1_scores: bestIndividualEver.f1_scores,
          overall_accuracy: bestIndividualEver.fitness,
          avg_recall: bestIndividualEver.avg_recall,
          avg_precision: bestIndividualEver.avg_precision,
          avg_f1_score: bestIndividualEver.avg_f1_score,
          testing_execution_time: bestIndividualEver.testing_execution_time,
        },
      ),
      features_extraction.deleteIdfsWhere({
        used_for_classification: true,
        term: { $nin: selectedFeatures },
      }),
      naive_bayes.deleteTfIdfModelsWhere({ term: { $nin: selectedFeatures } }),
    ]);

    // reduce means and standard deviations of classification models
    const reducedClassificationModels = [];
    for (const model of classificationModels) {
      const newMeans = new Map();
      const newStDevs = new Map();
      for (const term of selectedFeatures) {
        newMeans.set(term, model.means.get(term));
        newStDevs.set(term, model.stdevs.get(term));
      }
      model.means = newMeans;
      model.stdevs = newStDevs;
      reducedClassificationModels.push(model);
    }

    // update classification models
    await Promise.all([
      ...reducedClassificationModels.map((model) =>
        naive_bayes.updateClassificationModelsWhere(
          { _id: model._id },
          { means: model.means, stdevs: model.stdevs },
        ),
      ),
      features_selection.deleteLocalOptimumsWhere({}),
    ]);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  run,
  updateModel,
};
