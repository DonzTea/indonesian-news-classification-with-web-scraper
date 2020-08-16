const mongoose = require('mongoose');

const preprocessingResultSchema = new mongoose.Schema({
  cleaning_result: {
    type: String,
    required: true,
  },
  case_folding_result: {
    type: String,
    required: true,
  },
  tokenizing_result: {
    type: Array,
    required: true,
  },
  stemming_result: {
    type: Array,
    required: true,
  },
  stopword_removal_result: {
    type: Array,
    required: true,
  },
  dataset: {
    type: mongoose.ObjectId,
    ref: 'Dataset',
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['training set', 'testing set'],
  },
});

const PreprocessingResult = mongoose.model(
  'Preprocessing_Result',
  preprocessingResultSchema,
);

module.exports = PreprocessingResult;
