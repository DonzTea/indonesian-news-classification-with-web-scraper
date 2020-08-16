const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaussianSchema = new Schema({
  dataset: {
    type: String,
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  tf_idf: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  distributions: {
    // ? key is label name
    type: Map,
    of: mongoose.Types.Decimal128,
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

const Gaussian = mongoose.model('Gaussian', gaussianSchema);

module.exports = Gaussian;
