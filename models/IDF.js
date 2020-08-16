const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const idfSchema = new Schema({
  term: {
    type: String,
    required: true,
  },
  df: {
    type: Number,
    required: true,
  },
  idf: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  used_for_classification: {
    type: Boolean,
    required: true,
  },
});

const IDF = mongoose.model('IDF', idfSchema);

module.exports = IDF;
