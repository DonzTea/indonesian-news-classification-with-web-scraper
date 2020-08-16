const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classificationModelSchema = new Schema({
  label: {
    type: String,
    required: true,
  },
  means: {
    // ? key is token name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  stdevs: {
    // ? key is token name
    type: Map,
    of: mongoose.Types.Decimal128,
    required: true,
  },
  fold_number: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // ! 0 means that it's used for classification
  },
});

const ClassificationModel = mongoose.model(
  'Classification_Model',
  classificationModelSchema,
);

module.exports = ClassificationModel;
