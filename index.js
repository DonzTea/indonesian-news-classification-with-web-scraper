const mongoose = require('mongoose');
const process = require('process');

const { app, http } = require('./app.js');

require('dotenv').config();

mongoose.set('useFindAndModify', false);
mongoose.connect(
  `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
  // * APIs
  const labelAPI = require('./routes/api/label.js');
  const stopwordAPI = require('./routes/api/stopword.js');
  const datasetAPI = require('./routes/api/dataset.js');
  const datatablesAPI = require('./routes/api/datatables.js');
  const excelAPI = require('./routes/api/excel.js');
  const featuresExtractionAPI = require('./routes/api/features_extraction.js');
  const crossValidationAPI = require('./routes/api/k_fold_cross_validation.js');
  const performanceAPI = require('./routes/api/performance_measure.js');
  const classificationAPI = require('./routes/api/classification.js');
  const featuresSelectionAPI = require('./routes/api/features_selection.js');
  const webScrapingAPI = require('./routes/api/web_scraping.js');
  app.use('/api/label/', labelAPI);
  app.use('/api/stopword/', stopwordAPI);
  app.use('/api/dataset/', datasetAPI);
  app.use('/api/datatables/', datatablesAPI);
  app.use('/api/excel/', excelAPI);
  app.use('/api/features-extraction/', featuresExtractionAPI);
  app.use('/api/10-fold-cross-validation/', crossValidationAPI);
  app.use('/api/performance/', performanceAPI);
  app.use('/api/classification/', classificationAPI);
  app.use('/api/features-selection/', featuresSelectionAPI);
  app.use('/api/web-scraping/', webScrapingAPI);

  // * public URLs
  const menu = require('./routes/public/menu.js');
  const subMenu = require('./routes/public/sub_menu.js');
  app.use('/', menu);
  app.use('/', subMenu);

  // * unregistered pages
  app.get('/*', (req, res) => {
    res.render('http_status', {
      code: 404,
      error: 'Not Found',
      message: 'Halaman tidak ditemukan.',
    });
  });

  // * serve server
  const port = parseInt(process.env.PORT);
  http.listen(port, () => console.log(`App listening on port ${port}!`));
});
