const mongoose = require('mongoose');

const stopwordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const Stopword = mongoose.model('Stopword', stopwordSchema);

module.exports = Stopword;
