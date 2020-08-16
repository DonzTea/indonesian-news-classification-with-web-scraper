const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const localOptimumSchema = new Schema({
  generation_number: {
    type: Number,
    required: true,
  },
  individu_number: {
    type: Number,
    required: true,
  },
  fitness: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  selected_features: {
    type: [String],
    required: true,
  },
  testing_execution_time: {
    type: Number,
  },
  is_best: {
    type: Boolean,
    required: true,
  },
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
});

const LocalOptimum = mongoose.model('Local_Optimum', localOptimumSchema);

module.exports = LocalOptimum;
