const classification = require('../../services/classification.js');
const features_extraction = require('../../services/features_extraction.js');
const naive_bayes = require('../../services/naive_bayes.js');

const classify = async (req, res) => {
  const content = req.body.content;
  if (content) {
    try {
      const predicted_label = await classification.generate(content);
      return res.status(200).send(predicted_label);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const checkIsReady = async (_, res) => {
  try {
    const responses = await Promise.all([
      naive_bayes.readClassificationModelWhere({ fold_number: 0 }),
      naive_bayes.readPriorWhere({ fold_number: 0 }),
      naive_bayes.readTfIdfModelWhere({ fold_number: 0 }),
      features_extraction.readIdfWhere({ used_for_classification: true }),
    ]);
    res.sendStatus(responses.every((response) => response) ? 200 : 404);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  classify,
  checkIsReady,
};
