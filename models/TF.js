const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tfSchema = new Schema({
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
  tfs: {
    // ? key is term name
    type: Map,
    of: Number,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['training set', 'testing set'],
  },
});

const TF = mongoose.model('TF', tfSchema);

module.exports = TF;
