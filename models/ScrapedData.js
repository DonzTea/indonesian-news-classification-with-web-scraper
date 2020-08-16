const mongoose = require('mongoose');

const scrapedDataSchema = new mongoose.Schema({
  title: String,
  url: String,
  content: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const scrapedData = mongoose.model('Scraped_Data', scrapedDataSchema);

module.exports = scrapedData;
