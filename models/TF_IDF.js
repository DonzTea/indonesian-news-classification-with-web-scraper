const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tfIdfSchema = new Schema({
  dataset: {
    type: mongoose.ObjectId,
    ref: 'Dataset',
    required: true,
  },
  label: {
    type: mongoose.ObjectId,
    ref: 'Label',
    required: true,
  },
  tf_idfs: {
    // ? key is term name
    type: Map,
    of: Schema.Types.Decimal128,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['training set', 'testing set'],
  },
});

const TF_IDF = mongoose.model('TF_IDF', tfIdfSchema);

module.exports = TF_IDF;
