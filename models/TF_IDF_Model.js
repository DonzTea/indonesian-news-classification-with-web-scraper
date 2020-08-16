const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tfIdfModelSchema = new Schema({
  term: {
    type: String,
    required: true,
  },
  tf_idfs: {
    type: [mongoose.Types.Decimal128],
    required: true,
  },
  fold_number: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // ! 0 means that it's used for classification
  },
});

const TF_IDF_Model = mongoose.model('TF_IDF_Model', tfIdfModelSchema);

module.exports = TF_IDF_Model;
