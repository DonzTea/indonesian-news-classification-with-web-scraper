const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const performanceMeasureSchema = new Schema({
  accuracies: {
    // ? key is label name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  recalls: {
    // ? key is label name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  precisions: {
    // ? key is label name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  f1_scores: {
    // ? key is label name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  overall_accuracy: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  avg_recall: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  avg_precision: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  avg_f1_score: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  fold_number: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // ! 0 means that it's used for classification
  },
  testing_execution_time: {
    type: Number,
  },
  is_cross_validation_result: {
    type: Boolean,
    required: true,
  },
});

const PerformanceMeasure = mongoose.model(
  'Performance_Measure',
  performanceMeasureSchema,
);

module.exports = PerformanceMeasure;
