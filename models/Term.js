const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const termSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['training set', 'testing set'],
  },
});

const Term = mongoose.model('Term', termSchema);

module.exports = Term;
