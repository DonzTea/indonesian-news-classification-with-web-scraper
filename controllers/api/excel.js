const Excel = require('exceljs');
require('dotenv').config();
const excelColumnName = require('excel-column-name');

const label = require('../../services/label.js');
const stopword = require('../../services/stopword.js');
const dataset = require('../../services/dataset.js');
const term = require('../../services/term.js');
const features_extraction = require('../../services/features_extraction.js');
const web_scraping = require('../../services/web_scraping.js');
const stringUtils = require('../../utils/string.js');
const numberUtils = require('../../utils/number.js');

const downloadLabelTemplateFile = async (_, res) => {
  // construct a streaming XLSX workbook writer with styles and shared strings
  const options = {
    stream: res,
    useStyles: false,
    useSharedStrings: true,
  };
  // excel workbook init
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
  workbook.creator = process.env.EXCEL_USERNAME;
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Kategori Berita');

  // set header
  worksheet.columns = [
    { header: 'No.', key: 'number', width: 5 },
    { header: 'Nama Kategori', key: 'name', width: 50 },
    { header: 'Warna Visualisasi', key: 'color', width: 20 },
    { header: 'URL Scraping', key: 'scraping_url', width: 50 },
  ];

  // set row data
  worksheet.addRow({
    number: 1,
    name: 'contoh:\nTeknologi',
    color: 'contoh:\n#2F5488\n(nilai hexadecimal /\nboleh dikosongkan)',
    scraping_url:
      'contoh:\nhttps://www.tribunnews.com/techno\n(boleh dikosongkan)',
  });
  worksheet.addRow({
    number: 2,
    name: 'contoh:\nPengetahuan',
    color: 'contoh:\n#35BFA0\n(nilai hexadecimal /\nboleh dikosongkan)',
    scraping_url:
      'contoh:\nhttps://www.tribunnews.com/sains\n(boleh dikosongkan)',
  });

  // create file
  const fileName = 'Template Kategori Berita.xlsx';
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

  // commit
  await workbook.commit();

  res.end();
};

const downloadLabelFile = async (_, res) => {
  try {
    // get labels data
    const labels = await label.readLabels();

    // if any label data, then download excel file
    if (labels.length > 0) {
      // construct a streaming XLSX workbook writer with styles and shared strings
      const options = {
        stream: res,
        useStyles: false,
        useSharedStrings: true,
      };
      // excel workbook init
      const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
      workbook.creator = process.env.EXCEL_USERNAME;
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet('Kategori Berita');

      // set header
      worksheet.columns = [
        { header: 'No.', key: 'number', width: 5 },
        { header: 'Nama Kategori', key: 'name', width: 50 },
        { header: 'Warna Visualisasi', key: 'color', width: 20 },
        { header: 'URL Scraping', key: 'scraping_url', width: 50 },
      ];

      // set row data
      for (const [index, label] of labels.entries()) {
        worksheet.addRow({
          number: index + 1,
          name: stringUtils.titleCase(label.name),
          color: label.color || '',
          scraping_url: label.scraping_url || '',
        });
      }

      // create file
      const fileName = 'Kategori Berita.xlsx';
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

      // commit
      await workbook.commit();

      return res.end();
    } else {
      // if there is no label data
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const uploadLabelFile = async (req, res) => {
  const excelData = req.body;
  const header = excelData[0];

  // if request data is valid
  if (
    excelData &&
    header[1].toLowerCase() === 'nama kategori' &&
    header[2].toLowerCase() === 'warna visualisasi' &&
    header[3].toLowerCase() === 'url scraping'
  ) {
    try {
      // delete labels
      await label.deleteLabelsWhere({});

      // mapping excel data
      const labels = [];
      for (const [index, data] of Object.entries(excelData)) {
        if (index > 0) {
          const labelData = {
            name: data[1].toLowerCase(),
            color:
              data[2] ||
              '#' + numberUtils.generateRandomHexadecimal(6).toUpperCase(),
          };

          if (data[3]) labelData.scraping_url = data[3];

          labels.push(labelData);
        }
      }

      // create labels
      const response = await label.createLabels(labels);
      return res.status(200).send(response);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const downloadStopwordTemplateFile = async (_, res) => {
  // construct a streaming XLSX workbook writer with styles and shared strings
  const options = {
    stream: res,
    useStyles: false,
    useSharedStrings: true,
  };
  // excel workbook init
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Stopwords');

  // set header
  worksheet.columns = [
    { header: 'No.', key: 'number', width: 5 },
    { header: 'Kata', key: 'name', width: 20 },
  ];

  // set row data
  worksheet.addRow({
    number: 1,
    name: 'contoh: ada',
  });
  worksheet.addRow({
    number: 2,
    name: 'contoh: adalah',
  });

  // create file
  const fileName = 'Template Stopwords.xlsx';
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

  // commit
  await workbook.commit();

  res.end();
};

const downloadStopwordFile = async (_, res) => {
  try {
    // get stopwords data
    const stopwords = await stopword.readStopwords();

    // if any stopword data, then generate excel file
    if (stopwords.length > 0) {
      // construct a streaming XLSX workbook writer with styles and shared strings
      const options = {
        stream: res,
        useStyles: false,
        useSharedStrings: true,
      };
      // excel workbook init
      const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
      workbook.creator = process.env.EXCEL_USERNAME;
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet('Stopwords');

      // set header
      worksheet.columns = [
        { header: 'No.', key: 'number', width: 5 },
        { header: 'Kata', key: 'name', width: 20 },
      ];

      // set row data
      for (const [index, stopword] of stopwords.entries()) {
        worksheet.addRow({
          number: index + 1,
          name: stopword.name,
        });
      }

      // create file
      const fileName = 'Stopwords.xlsx';
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

      // commit
      await workbook.commit();

      return res.end();
    } else {
      // if there is no stopword data
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const uploadStopwordFile = async (req, res) => {
  const excelData = req.body;
  const header = excelData[0];

  // if request data is valid
  if (excelData && header[1].toLowerCase() === 'kata') {
    try {
      // delete stopwords
      await stopword.deleteStopwordsWhere({});

      // mapping excel data
      const stopwords = [];
      for (const [index, data] of Object.entries(excelData)) {
        if (index > 0) {
          stopwords.push({
            name: data[1].toLowerCase(),
          });
        }
      }

      // create stopwords
      const response = await stopword.createStopwords(stopwords);
      return res.status(200).send(response);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const downloadDatasetTemplateFile = async (_, res) => {
  // construct a streaming XLSX workbook writer with styles and shared strings
  const options = {
    stream: res,
    useStyles: false,
    useSharedStrings: true,
  };
  // excel workbook init
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Dataset');

  // set header
  worksheet.columns = [
    { header: 'No.', key: 'number', width: 5 },
    { header: 'Judul Berita', key: 'title', width: 20 },
    { header: 'URL Berita', key: 'url', width: 20 },
    { header: 'Konten Berita', key: 'content', width: 100 },
    { header: 'Kategori Berita', key: 'label', width: 25 },
  ];

  // set row data
  worksheet.addRow({
    number: 1,
    title:
      'contoh:\nNeraca Dagang Indonesia Defisit 864 Juta Dolar AS di Januari 2020',
    url:
      'contoh:\nhttps://www.tribunnews.com/bisnis/2020/02/17/neraca-dagang-indonesia-defisit-864-juta-dolar-as-di-januari-2020',
    content:
      'contoh:\nLaporan Reporter Kontan Bidara Pink TRIBUNNEWS.COM, JAKARTA - Neraca perdagangan di tahun ini, dibuka dengan catatan defisit yang terjadi di bulan Januari 2020.Badan Pusat Statistik (BPS) mencatat defisit di awal tahun ini sebesar US$ 0,86 miliar atau tepatnya US$ 864 juta."Meski mengalami defisit, ini masih lebih kecil bila dibandingkan defisit yang terjadi di Januari 2019 yang sebesar US$ 1,06 miliar," kata Kepala BPS Suhariyanto pada Senin (17/2/2020) di Jakarta.Salah satu penyebab defisit neraca dagang adalah ekspor yang tercatat sebesar US$ 13,41 miliar atau yang menurun 7,16% secara bulanan dan turun 3,71% bila dibandingkan dengan nilai ekspor tahun sebelumnya.Di tengah penurunan ekspor, juga terjadi juga penurunan impor sebesar 1,60% bila dibandingkan dengan Desember 2019 atau terkoreksi 4,78% bila dibandingkan dengan Januari tahun lalu.Meski begitu, nilai impor masih tercatat sebesar US$ 14,28 miliar di awal tahun ini.Untuk selanjutnya, Suhariyanto berharap agar kebijakan yang telah dikeluarkan pemerintah untuk menekan defisit neraca perdagangan bisa diimplementasikan dengan baik."Misalnya saja implementasi B30 bisa dan berbagai kebijakan lain bisa bergulir dengan mulus, sehingga tidak hanya defisitnya membaik, tetapi bisa berubah menjadi surplus," tandas Suhariyanto.Artikel ini tayang di Kontan dengan judul Neraca dagang Januari 2020 alami defisit US$ 864 juta',
    label:
      'contoh: Bisnis\n*Daftar nama kategori dapat didownload pada menu Data > Label dan Stopwords',
  });
  worksheet.addRow({
    number: 2,
    title:
      'contoh:\nKarena Antibodi Bagus, 1.540 Orang Dinyatakan Sembuh dari Virus Corona, Tapi Bisa Kambuh Lagi',
    url:
      'contoh:\nhttps://www.tribunnews.com/kesehatan/2020/02/08/karena-antibodi-bagus-1540-orang-dinyatakan-sembuh-dari-virus-corona-tapi-bisa-kambuh-lagi',
    content:
      'contoh:\nTRIBUNNEWS.COM- Kabar gembira, ternyata orang yang terinfeksi virus corona bisa sembuh. Fakta yang terjadi, di China sudah ada 1.540 orang dinyatakan sembuh dari virus corona. Seperti diketahui, sekitar 31 ribu telah terinfeksi virus corona. Ratusan di antaranya meninggal dunia akibat virus mematikan tersebut. Kini, seorang ahli dari China bernama Zhan Qingyuan, orang yan terinfeksi virus corona bisa disembuhkan dengan meningkatkan antibodi. Virus yang juga disebut sebagai 2019-nCoV ini kabarnya pertama kali ditemukan di Wuhan, China pada akhir 2019 silam. Dilansir laman CGTN, dilaporkan bahwa tercatat sudah ada lebih dari 31 ribu kasus infeksi virus corona yang terjadi hingga Jumat (7/2/2020) ini. Angka kematian yang disebabkan oleh infeksi virus corona ini juga bertambah menjadi total 638 jiwa. Meski ada pasien yang terinfeksi virus corona sembuh, ahli menyebut pasien virus corona masih bisa kembali terinfeksi setelah dinyatakan sembuh Seorang pasien yang telah dinyatakan sembuh dari virus corona disebut memiliki kemungkinan untuk kembali terinfeksi. Zhan Qingyuan mengatakan bahwa pasien yang telah sembuh dari virus corona masih memiliki kemungkinan untuk kambuh atau kembali terinfeksi. "Para pasien yang telah sembuh (dari virus corona) memiliki kemungkinan untuk kambuh," ungkapnya, sebagaimana dikutip dari laman Daily Mail.',
    label:
      'contoh: Kesehatan\n*Daftar nama kategori dapat didownload pada menu Data > Label dan Stopwords',
  });

  // create file
  const fileName = 'Template Dataset.xlsx';
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

  // commit
  await workbook.commit();

  res.end();
};

const downloadDatasetFileWhereType = async (req, res) => {
  const slugDocType = req.params.slugDocType;
  const slugDocTypeEnum = ['training-set', 'testing-set'];

  // if request parameters are valid
  if (slugDocTypeEnum.includes(slugDocType)) {
    try {
      // get documents
      const documents = await dataset.readDatasetsWhere({
        type: slugDocType.replace('-', ' '),
      });

      // if any document, then generate excel file
      if (documents.length > 0) {
        // construct a streaming XLSX workbook writer with styles and shared strings
        const options = {
          stream: res,
          useStyles: false,
          useSharedStrings: true,
        };
        // excel workbook init
        const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
        workbook.creator = process.env.EXCEL_USERNAME;
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(
          stringUtils.titleCase(slugDocType.replace('-', ' ')),
        );

        // set header
        worksheet.columns = [
          { header: 'No.', key: 'number', width: 5 },
          { header: 'Judul Berita', key: 'title', width: 20 },
          { header: 'URL Berita', key: 'url', width: 20 },
          { header: 'Konten Berita', key: 'content', width: 100 },
          { header: 'Kategori Berita', key: 'label', width: 20 },
        ];

        // set row data
        for (const [index, document] of documents.entries()) {
          worksheet.addRow({
            number: index + 1,
            title: document.title || '',
            url: document.url || '',
            content: document.content,
            label: stringUtils.titleCase(document.label.name),
          });
        }

        // create file
        const fileName = `Dokumen ${stringUtils.titleCase(
          slugDocType.replace('-', ' '),
        )}.xlsx`;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=' + fileName,
        );

        // commit
        await workbook.commit();

        return res.end();
      } else {
        // if there is no document
        return res.sendStatus(404);
      }
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    return res.sendStatus(400);
  }
};

const uploadDatasetFileWhereType = async (req, res) => {
  const type = req.body.type;
  const excelData = req.body.excelData;
  const header = excelData[0];

  // if request data is valid
  if (
    type &&
    (type === 'training set' || type === 'testing set') &&
    excelData &&
    header[1].toLowerCase() === 'judul berita' &&
    header[2].toLowerCase() === 'url berita' &&
    header[3].toLowerCase() === 'konten berita' &&
    header[4].toLowerCase() === 'kategori berita'
  ) {
    try {
      // get labels
      const labels = await label.readLabels();

      // mapping excel data
      const datasets = [];
      for (const [index, data] of Object.entries(excelData)) {
        if (index > 0) {
          const labelData = labels.find(
            (labelData) => labelData.name === data[4].toLowerCase(),
          );

          if (labelData && labelData._id) {
            // save dataset
            datasets.push({
              title: data[1] || '',
              url: data[2] || '',
              content: data[3] || '',
              label: labelData._id,
              type,
            });
          }
        }
      }

      // create datasets
      const response = await dataset.createDatasets(datasets, type);
      return res.status(200).send(response);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const downloadTermFileWhereSource = async (req, res) => {
  const slugSource = req.params.slugSource;
  if (slugSource === 'training-set' || slugSource === 'testing-set') {
    const source = slugSource.replace('-', ' ');
    try {
      // fetch data
      const terms = await term.readTermsFrom(source);

      // construct a streaming XLSX workbook writer with styles and shared strings
      const options = {
        stream: res,
        useStyles: false,
        useSharedStrings: true,
      };
      // excel workbook init
      const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
      workbook.creator = process.env.EXCEL_USERNAME;
      workbook.created = new Date();

      // excel worksheet init
      const worksheet = workbook.addWorksheet(
        `Token Kata ${stringUtils.titleCase(source)}`,
      );
      worksheet.columns = [
        { header: 'No.', key: 'number', width: 5 },
        { header: 'Token Kata', key: 'name', width: 20 },
      ];

      // set training terms worksheet cells data
      for (const [index, term] of terms.entries()) {
        worksheet.addRow({
          number: index + 1,
          name: term.name,
        });
      }

      // worksheet styling
      const lastRow = worksheet.lastRow.number;
      for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
            horizontal: 'center',
          };
        });
      }

      // create file
      const fileName = `Token Kata ${stringUtils.titleCase(source)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

      // commit
      await workbook.commit();

      return res.end();
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const downloadTfFileWhereSource = async (req, res) => {
  const slugSource = req.params.slugSource;
  if (slugSource === 'training-set' || slugSource === 'testing-set') {
    const source = slugSource.replace('-', ' ');
    try {
      // fetch data
      const [terms, tfs] = await Promise.all([
        term.readTermsFrom(source),
        features_extraction.readTfsFrom(source),
      ]);

      // construct a streaming XLSX workbook writer with styles and shared strings
      const options = {
        stream: res,
        useStyles: false,
        useSharedStrings: true,
      };
      // excel workbook init
      const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
      workbook.creator = process.env.EXCEL_USERNAME;
      workbook.created = new Date();

      // excel worksheet init
      const worksheet = workbook.addWorksheet(
        `TF ${stringUtils.titleCase(source)}`,
      );
      worksheet.getCell('A1').value = 'No.';
      worksheet.getCell('B1').value = 'ID Dokumen.';

      // terms header
      const keyColumns = [
        { key: 'docNumber', width: 5 },
        { key: 'docId', width: 30 },
      ];
      for (const [index, term] of terms.entries()) {
        const cellLetter = excelColumnName.intToExcelCol(index + 3);
        worksheet.getCell(`${cellLetter}1`).value = term.name;
        keyColumns.push({ key: term.name, width: 20 });
      }
      worksheet.columns = keyColumns;

      // worksheet cells data
      for (const [index, tfData] of tfs.entries()) {
        const id = tfData.dataset._id.toString();
        const tfs = { docNumber: index + 1, docId: id };
        for (const term of terms) {
          const tf = tfData.tfs.get(term.name);
          tfs[term.name] = tf ? parseFloat(tf) : 0;
        }
        worksheet.addRow(tfs);
      }

      // worksheet styling
      const lastRow = worksheet.lastRow.number;
      for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
        const tfRow = worksheet.getRow(rowNumber);
        tfRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
            horizontal: 'center',
          };
        });
      }

      // create file
      const fileName = `TF ${stringUtils.titleCase(source)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

      // commit
      await workbook.commit();

      return res.end();
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const downloadIdfFile = async (_, res) => {
  try {
    // fetch data
    const idfs = await features_extraction.readIdfsWhere({
      used_for_classification: false,
    });

    // excel workbook init
    // construct a streaming XLSX workbook writer with styles and shared strings
    const options = {
      stream: res,
      useStyles: false,
      useSharedStrings: true,
    };
    // excel workbook init
    const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = process.env.EXCEL_USERNAME;
    workbook.created = new Date();

    // excel worksheet init
    const worksheet = workbook.addWorksheet('IDF');

    // set idfs worksheet header
    worksheet.columns = [
      { header: 'No.', key: 'number', width: 5 },
      { header: 'Token Kata', key: 'name', width: 20 },
      { header: 'DF', key: 'df', width: 20 },
      { header: 'IDF', key: 'idf', width: 20 },
    ];
    // set worksheet cells data
    for (const [index, idfData] of idfs.entries()) {
      worksheet.addRow({
        number: index + 1,
        name: idfData.term,
        df: idfData.df,
        idf: idfData.idf.toString(),
      });
    }

    // worksheet styling
    const lastRow = worksheet.lastRow.number;
    for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
          horizontal: 'center',
        };
      });
    }

    // create file
    const fileName = 'IDF.xlsx';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

    // commit
    await workbook.commit();

    return res.end();
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

const downloadTfIdfFileWhereSource = async (req, res) => {
  const slugSource = req.params.slugSource;
  if (slugSource === 'training-set' || slugSource === 'testing-set') {
    const source = slugSource.replace('-', ' ');
    try {
      // fetch data
      const [terms, tfIdfs] = await Promise.all([
        term.readTermsFrom(source),
        features_extraction.readTfIdfsFrom(source),
      ]);

      // construct a streaming XLSX workbook writer with styles and shared strings
      const options = {
        stream: res,
        useStyles: false,
        useSharedStrings: true,
      };
      // excel workbook init
      const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
      workbook.creator = process.env.EXCEL_USERNAME;
      workbook.created = new Date();

      // excel worksheet init
      const worksheet = workbook.addWorksheet(
        `TF-IDF ${stringUtils.titleCase(source)}`,
      );
      worksheet.getCell('A1').value = 'No.';
      worksheet.getCell('B1').value = 'ID Dokumen.';

      // terms header
      const keyColumns = [
        { key: 'docNumber', width: 5 },
        { key: 'docId', width: 30 },
      ];
      for (const [index, term] of terms.entries()) {
        const cellLetter = excelColumnName.intToExcelCol(index + 3);
        worksheet.getCell(`${cellLetter}1`).value = term.name;
        keyColumns.push({ key: term.name, width: 20 });
      }
      worksheet.columns = keyColumns;

      // worksheet cells data
      for (const [index, tfIdfData] of tfIdfs.entries()) {
        const id = tfIdfData.dataset._id.toString();
        const tfIdfs = { docNumber: index + 1, docId: id };
        for (const term of terms) {
          const tfIdf = tfIdfData.tf_idfs.get(term.name);
          tfIdfs[term.name] = tfIdf ? parseFloat(tfIdf) : 0;
        }
        worksheet.addRow(tfIdfs);
      }

      // worksheet styling
      const lastRow = worksheet.lastRow.number;
      for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
        const tfIdfRow = worksheet.getRow(rowNumber);
        tfIdfRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
            horizontal: 'center',
          };
        });
      }

      // create file
      const fileName = `TF-IDF ${stringUtils.titleCase(source)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

      // commit
      await workbook.commit();

      return res.end();
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};

const downloadScrapedDataFile = async (_, res) => {
  try {
    // get documents
    const documents = await web_scraping.readDatasWhere({});

    // if any document, then generate excel file
    if (documents.length > 0) {
      // construct a streaming XLSX workbook writer with styles and shared strings
      const options = {
        stream: res,
        useStyles: false,
        useSharedStrings: true,
      };
      // excel workbook init
      const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
      workbook.creator = process.env.EXCEL_USERNAME;
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet('Dokumen Berita');

      // set header
      worksheet.columns = [
        { header: 'No.', key: 'number', width: 5 },
        { header: 'Judul Berita', key: 'title', width: 20 },
        { header: 'URL Berita', key: 'url', width: 20 },
        { header: 'Konten Berita', key: 'content', width: 100 },
        { header: 'Kategori Berita', key: 'label', width: 20 },
      ];

      // set row data
      for (const [index, document] of documents.entries()) {
        worksheet.addRow({
          number: index + 1,
          title: document.title || '',
          url: document.url || '',
          content: document.content,
          label: stringUtils.titleCase(document.label),
        });
      }

      // create file
      const fileName = 'Dokumen Berita Hasil Web Scraping.xlsx';
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

      // commit
      await workbook.commit();

      return res.end();
    } else {
      // if there is no document
      return res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};

module.exports = {
  downloadLabelTemplateFile,
  downloadLabelFile,
  uploadLabelFile,
  downloadStopwordTemplateFile,
  downloadStopwordFile,
  uploadStopwordFile,
  downloadDatasetTemplateFile,
  downloadDatasetFileWhereType,
  uploadDatasetFileWhereType,
  downloadTermFileWhereSource,
  downloadTfFileWhereSource,
  downloadIdfFile,
  downloadTfIdfFileWhereSource,
  downloadScrapedDataFile,
};
