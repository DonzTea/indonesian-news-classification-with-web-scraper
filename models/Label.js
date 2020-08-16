const mongoose = require('mongoose');

const Dataset = require('./Dataset.js');
const PreprocessingResult = require('./PreprocessingResult.js');
const Term = require('./Term.js');
const IDF = require('./IDF.js');
const TF = require('./TF.js');
const TF_IDF = require('./TF_IDF.js');

const labelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
  },
  scraping_url: {
    type: String,
  },
});

labelSchema.post('findOneAndDelete', async function (label) {
  await Dataset.deleteMany({ label: label._id });
});

labelSchema.post('deleteMany', async function () {
  await Promise.all([
    Dataset.deleteMany({}),
    PreprocessingResult.deleteMany({}),
    Term.deleteMany({}),
    IDF.deleteMany({}),
    TF.deleteMany({}),
    TF_IDF.deleteMany({}),
  ]).catch((error) => console.error('Error' + error));
});

const Label = mongoose.model('Label', labelSchema);

module.exports = Label;
