import { animatedScrollTo } from '/node_modules/es6-scroll-to/lib/index.js';
import { easeInOutCubic } from '/node_modules/es6-easings/lib/index.js';

/**
 * * Smooth scrolling to a DOM
 * @param {object} element
 * ? DOM object
 * @param {number} duration
 * ? integer number
 * @return {void}
 */
export const easingScrollTo = (element, duration = 1000) =>
  animatedScrollTo({
    easing: easeInOutCubic,
    to: element ? window.pageYOffset + element.getBoundingClientRect().top : 0,
    duration,
  });
