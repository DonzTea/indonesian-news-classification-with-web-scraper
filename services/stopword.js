const Stopword = require('../models/Stopword.js');

/**
 * * Save a stopword into database
 * @param {object} stopword
 * @return {object}
 */
const createStopword = async (stopword) => {
  const createdStopword = await new Stopword(stopword)
    .save()
    .catch((error) => console.error(error));
  return createdStopword;
};

/**
 * * Save stopwords into database
 * @param {[object]} stopwords
 * @return {[object]}
 */
const createStopwords = async (stopwords) => {
  const createdStopwords = await Stopword.insertMany(stopwords, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));
  return createdStopwords;
};

/**
 * * Get stopwords corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readStopwords = async (filter) => {
  const stopwords = await Stopword.find({ ...filter })
    .sort({ name: 'asc' })
    .catch((error) => console.error(error));
  return stopwords;
};

/**
 * * Get a stopword having a certain id
 * @param {string} id
 * @return {object}
 */
const readStopword = async (id) => {
  const stopword = await Stopword.findOne({ _id: id }).catch((error) =>
    console.error(error),
  );
  return stopword;
};

/**
 * * Update a stopword having a certain id
 * @param {string} id
 * @param {object} stopword
 * @return {object}
 */
const updateStopword = async (id, stopword) => {
  const updatedStopword = await Stopword.findOneAndUpdate(
    { _id: id },
    { $set: stopword },
    { new: true },
  ).catch((error) => console.error(error));
  return updatedStopword;
};

/**
 * * Delete a stopword having a certain id
 * @param {string} id
 * @return {object}
 */
const deleteStopword = async (id) => {
  const deletedStopword = await Stopword.findOneAndDelete({
    _id: id,
  }).catch((error) => console.error(error));
  return deletedStopword;
};

/**
 * * Delete stopwords corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteStopwordsWhere = async (filter) => {
  const response = await Stopword.deleteMany(filter).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Check whether system have stopword data
 * @return {boolean}
 */
const isEmpty = async () => {
  let isEmpty = true;
  const stopword = await Stopword.findOne({}).catch((error) =>
    console.error(error),
  );
  if (stopword) isEmpty = false;
  return isEmpty;
};

module.exports = {
  createStopword,
  createStopwords,
  readStopwords,
  readStopword,
  updateStopword,
  deleteStopword,
  deleteStopwordsWhere,
  isEmpty,
};
