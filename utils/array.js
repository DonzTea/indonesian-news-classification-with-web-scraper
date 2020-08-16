/**
 * * Get frequency of array elements
 * @param {array} array
 * @return {object}
 */
const getArrayElementFrequency = (array) => {
  const a = [];
  const b = [];
  let prev;

  array.sort();
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== prev) {
      a.push(array[i]);
      b.push(1);
    } else {
      b[b.length - 1]++;
    }
    prev = array[i];
  }

  const arrayElementsFrequency = {};
  for (const [i, el] of a.entries()) {
    arrayElementsFrequency[el] = b[i];
  }

  return arrayElementsFrequency;
};

/**
 * * Shuffle array elements
 * @param {array} array
 * @return {array}
 */
const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

module.exports = {
  getArrayElementFrequency,
  shuffleArray,
};
