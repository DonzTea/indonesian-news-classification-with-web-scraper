const performance_measure = require('../../services/performance_measure.js');

const readPerformanceWhere = async (req, res) => {
  const fold_number = req.params.foldNumber;
  const foldNumberEnum = Array.from(Array(11).keys());

  // if request parameter is valid
  if (foldNumberEnum.includes(parseInt(fold_number))) {
    try {
      const performance = await performance_measure.readPerformanceMeasureWhere(
        {
          fold_number,
        },
      );
      res.status(200).send(performance);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

module.exports = {
  readPerformanceWhere,
};
