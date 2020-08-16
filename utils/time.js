const parseMilliseconds = require('parse-ms');

/**
 * * Parsing an amount of time in milliseconds into readable string
 * @param {number} timeInMs
 * ? integer number of time in milliseconds
 * @return {string}
 */
const parse = (timeInMs) => {
  const executionTime = parseMilliseconds(timeInMs);
  const { hours, minutes, seconds, milliseconds } = executionTime;

  let string = '';
  if (hours) string += `${hours} jam `;
  if (minutes) string += `${minutes} menit `;
  if (seconds) string += `${seconds} detik `;
  if (milliseconds) string += `${milliseconds} ms`;
  return string;
};

module.exports = {
  parse,
};
