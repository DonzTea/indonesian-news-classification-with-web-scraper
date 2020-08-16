/**
 * * Generates random hexadecimal value along a certain size
 * @param {number} size
 * ? integer number
 * @return {string}
 */
const generateRandomHexadecimal = (size) =>
  [...Array(size)]
    .map(() =>
      Math.floor(Math.random() * 16)
        .toString(16)
        .toUpperCase(),
    )
    .join('');

module.exports = {
  generateRandomHexadecimal,
};
