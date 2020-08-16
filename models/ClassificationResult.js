const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classificationResultSchema = new Schema({
  dataset: {
    type: mongoose.Types.ObjectId,
    ref: 'Dataset',
    required: true,
  },
  probabilities: {
    // ? key is label name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  actual_label: {
    type: String,
    required: true,
  },
  predicted_label: {
    type: String,
    required: true,
  },
  fold_number: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  is_cross_validation_result: {
    type: Boolean,
    required: true,
  },
});

const ClassificationResult = mongoose.model(
  'Classification_Result',
  classificationResultSchema,
);

module.exports = ClassificationResult;
