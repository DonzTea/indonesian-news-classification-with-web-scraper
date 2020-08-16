const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const confusionMatrixSchema = new Schema({
  actual_label: {
    type: String,
    required: true,
  },
  predicted_labels: {
    // ? key is label name + 'negatif' as last label when system cannot determine the label of document
    type: Map,
    of: Number,
    required: true,
  },
  fold_number: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  is_cross_validation_result: {
    type: Boolean,
    required: true,
  },
});

const ConfusionMatrix = mongoose.model(
  'Confusion_Matrix',
  confusionMatrixSchema,
  'confusion_matrices',
);

module.exports = ConfusionMatrix;
