const cross_validation = require('../../services/k_fold_cross_validation.js');
const naive_bayes = require('../../services/naive_bayes.js');
const features_extraction = require('../../services/features_extraction.js');
const performance_measure = require('../../services/performance_measure.js');
const features_selection = require('../../services/features_selection.js');

const run = async (_, res) => {
  try {
    const performances = await cross_validation.generateAndWrite();
    return performances.length > 0
      ? res.status(201).send(performances)
      : res.sendStatus(500);
  } catch (error) {
    console.error(error);
    return res.sendStatus(404);
  }
};

const multiTesting = async (_, res) => {
  try {
    const { performances, bestFolds } = await cross_validation.multiTesting();

    return performances.length > 0
      ? res.status(201).send({ performances, bestFolds })
      : res.sendStatus(500);
  } catch (error) {
    console.error(error);
    return res.sendStatus(404);
  }
};

const saveModel = async (req, res) => {
  const fold_number = parseInt(req.body.fold_number);
  const foldNumberEnum = Array.from(Array(11).keys()).slice(1);

  if (foldNumberEnum.includes(fold_number)) {
    // if fold number request is valid

    try {
      // fetch data
      const [oldIdfs] = await Promise.all([
        features_extraction.readIdfsWhere({ used_for_classification: false }),
        features_extraction.deleteIdfsWhere({ used_for_classification: true }),
        naive_bayes.deletePriorsWhere({ fold_number: { $ne: fold_number } }),
        naive_bayes.deleteClassificationModelsWhere({
          fold_number: { $ne: fold_number },
        }),
        naive_bayes.deleteTfIdfModelsWhere({
          fold_number: { $ne: fold_number },
        }),
        naive_bayes.deleteGaussiansWhere({}),
        naive_bayes.deleteClassificationResultsWhere({}),
        performance_measure.deleteConfusionMatrixWhere({}),
        performance_measure.deletePerformanceMeasuresWhere({
          $or: [
            { fold_number: { $ne: fold_number } },
            { is_cross_validation_result: true },
          ],
        }),
        features_selection.deleteLocalOptimumsWhere({}),
      ]);

      // create new idfs
      const newIdfs = oldIdfs.map((idfData) => {
        return {
          term: idfData.term,
          df: idfData.df,
          idf: idfData.idf,
          used_for_classification: true,
        };
      });

      // save model
      await Promise.all([
        features_extraction.createIdfs(newIdfs),
        naive_bayes.updatePriorsWhere({ fold_number }, { fold_number: 0 }),
        naive_bayes.updateClassificationModelsWhere(
          { fold_number },
          { fold_number: 0 },
        ),
        naive_bayes.updateTfIdfModelsWhere({ fold_number }, { fold_number: 0 }),
        performance_measure.updatePerformanceMeasuresWhere(
          { fold_number, is_cross_validation_result: false },
          { fold_number: 0 },
        ),
      ]);
    } catch (error) {
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
};

const checkIsReady = async (_, res) => {
  try {
    const isComplete = await cross_validation.isReady();
    res.status(200).send(isComplete);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  run,
  multiTesting,
  saveModel,
  checkIsReady,
};
