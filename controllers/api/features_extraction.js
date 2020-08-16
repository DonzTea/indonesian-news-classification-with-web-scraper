const features_extraction = require('../../services/features_extraction.js');
const dataset = require('../../services/dataset.js');

const run = async (_, res) => {
  try {
    // start features extraction
    const response = await features_extraction.generateAndWrite();

    if (
      response.idfs &&
      response.trainingTfs &&
      response.trainingTfIdfs &&
      response.testingTfs &&
      response.testingTfIdfs
    ) {
      // send response
      res.sendStatus(201);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const checkIsReady = async (_, res) => {
  try {
    let isReady = false;
    const [isTrainingSetExist, isTestingSetExist] = await Promise.all([
      dataset.isExist('training set', 10),
      dataset.isExist('testing set'),
    ]);
    if (isTrainingSetExist && isTestingSetExist) isReady = true;
    res.status(200).send(isReady);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  run,
  checkIsReady,
};
