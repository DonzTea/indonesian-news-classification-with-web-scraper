const mongoose = require('mongoose');
const PreprocessingResult = require('./PreprocessingResult.js');

const datasetSchema = new mongoose.Schema({
  title: String,
  url: String,
  content: {
    type: String,
    required: true,
  },
  label: {
    type: mongoose.ObjectId,
    ref: 'Label',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['training set', 'testing set'],
  },
});

datasetSchema.post('findOneAndDelete', async function (dataset) {
  await PreprocessingResult.findOneAndDelete({
    dataset: dataset._id,
  }).catch((error) => console.error('Error' + error));
});

const Dataset = mongoose.model('Dataset', datasetSchema);

module.exports = Dataset;
