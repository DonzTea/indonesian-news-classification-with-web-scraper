const Label = require('../models/Label.js');

/**
 * * Save a label into database
 * @param {object} label
 * @return {object}
 */
const createLabel = async (label) => {
  const createdLabel = await new Label(label)
    .save()
    .catch((error) => console.error(error));
  return createdLabel;
};

/**
 * * Save many labels into database
 * @param {[object]} labels
 * @return {[object]}
 */
const createLabels = async (labels) => {
  const createdLabels = await Label.insertMany(labels, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));
  return createdLabels;
};

/**
 * * Get many labels corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readLabels = async (filter) => {
  const labels = await Label.find({ ...filter })
    .sort({ name: 'asc' })
    .catch((error) => console.error(error));
  return labels;
};

/**
 * * Get a label having a certain id
 * @param {string} id
 * @return {object}
 */
const readLabel = async (id) => {
  const label = await Label.findOne({ _id: id }).catch((error) =>
    console.error(error),
  );
  return label;
};

/**
 * * Update a label having a certain id
 * @param {string} id
 * @param {object} label
 * @return {object}
 */
const updateLabel = async (id, label) => {
  const updatedLabel = await Label.findOneAndUpdate(
    { _id: id },
    { $set: label },
    { new: true },
  ).catch((error) => console.error(error));
  return updatedLabel;
};

/**
 * * Delete a label having a certain id
 * @param {string} id
 * @return {object}
 */
const deleteLabel = async (id) => {
  const deletedLabel = await Label.findOneAndDelete({
    _id: id,
  }).catch((error) => console.error(error));
  return deletedLabel;
};

/**
 * * Delete many labels corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteLabelsWhere = async (filter) => {
  const response = await Label.deleteMany(filter).catch((error) =>
    console.error(error),
  );
  return response;
};

/**
 * * Check whether system have label data
 * @return {boolean}
 */
const isEmpty = async () => {
  let isEmpty = true;
  const label = await Label.findOne({}).catch((error) => console.error(error));
  if (label) isEmpty = false;
  return isEmpty;
};

module.exports = {
  createLabel,
  createLabels,
  readLabels,
  readLabel,
  updateLabel,
  deleteLabel,
  deleteLabelsWhere,
  isEmpty,
};
