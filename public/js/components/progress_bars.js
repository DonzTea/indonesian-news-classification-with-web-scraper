/**
 * * Initializing circle shape progress bar
 * @param {string} barDOM
 * @param {string} color
 * @param {string} fontSize
 * @return {object}
 */
export const initCircleBar = (
  barDOM,
  color = 'rgb(69,170,242)',
  fontSize = '0.7rem',
) => {
  return new ProgressBar.Circle(barDOM, {
    strokeWidth: 4,
    trailWidth: 1,
    easing: 'easeInOut',
    duration: 1400,
    text: {
      style: {
        fontFamily: '"Raleway", Helvetica, sans-serif',
        fontSize,
        position: 'absolute',
        left: '50%',
        top: '50%',
        padding: 0,
        margin: 0,
        transform: {
          prefix: true,
          value: 'translate(-50%, -50%)',
        },
      },
    },
    from: { color: '#aaa', width: 1 },
    to: { color, width: 4 },
    step: function (state, circle) {
      circle.path.setAttribute('stroke', state.color);
      circle.path.setAttribute('stroke-width', state.width);
      const value = (circle.value() * 100).toFixed(2);
      value === 0 ? circle.setText('0%') : circle.setText(value + '%');
    },
  });
};
