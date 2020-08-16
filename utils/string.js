/**
 * * Transforming regular text into title case form
 * ? example: 'title case' become 'Title Case'
 * @param {string} string
 * @return {string}
 */
const titleCase = (string) => {
  const splittedString = string.toLowerCase().split(' ');
  for (let i = 0; i < splittedString.length; i++) {
    splittedString[i] =
      splittedString[i].charAt(0).toUpperCase() +
      splittedString[i].substring(1);
  }
  return splittedString.join(' ');
};

/**
 * * Transforming first letter in a string into upper case form
 * ? example: 'capitalize first letter' become 'Capitalize first letter'
 * @param {string} string
 * @return {string}
 */
const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

/**
 * * Clear template literal spaces of a string
 * ? example: `   clear spaces   ` become 'clear spaces'
 * @param {string} string
 * @return {string}
 */
const clearTemplateLiteralSpace = (string) =>
  string.trim().replace(/\s+/g, ' ');

module.exports = {
  titleCase,
  capitalizeFirstLetter,
  clearTemplateLiteralSpace,
};
