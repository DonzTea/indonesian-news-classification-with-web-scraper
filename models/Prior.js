const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const priorSchema = new Schema({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  fold_number: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // ! 0 means that it's used for classification
  },
});

const Prior = mongoose.model('Prior', priorSchema);

module.exports = Prior;
