import { easingScrollTo } from '/js/components/easing_scroll.js';
import { initColorPicker } from '/js/components/color_picker.js';

// DOM elements
const buttons = document.querySelectorAll('button');
const totalLabelsText = document.querySelector('#total-labels');
const totalStopwordsText = document.querySelector('#total-stopwords');
const labelsSlider = document.querySelector('#labels-slider');
const labelsCard = document.querySelector('#labels-card');
const labelsList = document.querySelector('ul#labels-list');
const addLabelButton = document.querySelector('#btn-add-label');
const deleteAllLabelButton = document.querySelector('#btn-delete-all-label');
const labelTemplateDownloadButton = document.querySelector(
  '#btn-download-label-template',
);
const labelDowloadButton = document.querySelector('#btn-download-label');
const labelUploadButton = document.querySelector('#btn-upload-label');
const inputExcelLabel = document.querySelector('#input-excel-label');
const stopwordsSlider = document.querySelector('#stopwords-slider');
const stopwordsCard = document.querySelector('#stopwords-card');
const inputSearchStopword = document.querySelector(
  'input#input-search-stopword',
);
const refreshStopwordsButton = document.querySelector('#btn-refresh-stopword');
const stopwordsList = document.querySelector('ul#stopwords-list');
const addStopwordButton = document.querySelector('#btn-add-stopword');
const deleteAllStopwordButton = document.querySelector(
  '#btn-delete-all-stopword',
);
const stopwordTemplateDownloadButton = document.querySelector(
  '#btn-download-stopword-template',
);
const stopwordDowloadButton = document.querySelector('#btn-download-stopword');
const stopwordUploadButton = document.querySelector('#btn-upload-stopword');
const inputExcelStopword = document.querySelector('#input-excel-stopword');

let trainingSetsChart;
let testingSetsChart;

// render chart function
const renderChart = (ctx, datasets) => {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jumlah Dokumen'],
      datasets,
    },
    options: {
      responsive: true,
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          fontColor: '#868E96',
        },
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
};

// init charts function
const initCharts = async () => {
  const ctxTrainingSet = document
    .getElementById('chart-training-set')
    .getContext('2d');
  const ctxTestingSet = document
    .getElementById('chart-testing-set')
    .getContext('2d');

  const labels = await axios
    .get('/api/label')
    .catch((error) => console.error(error.response));

  const promises = (datasetType) => {
    return labels.data.map(async (label) => {
      const datasets = await axios.post('/api/dataset/filter', {
        label: label._id,
        type: datasetType,
      });

      return {
        label: label.name,
        backgroundColor: [label.color],
        data: [datasets.data.length],
      };
    });
  };

  const trainingSets = await Promise.all(
    promises('training set'),
  ).catch((error) => console.error(error));

  const testingSets = await Promise.all(
    promises('testing set'),
  ).catch((error) => console.error(error));

  trainingSetsChart = renderChart(
    ctxTrainingSet,
    trainingSets.filter((document) => document.data[0] > 0),
  );
  testingSetsChart = renderChart(
    ctxTestingSet,
    testingSets.filter((document) => document.data[0] > 0),
  );
};

// refresh total labels text UI
const refreshTotalLabelsText = async () => {
  const labels = await axios
    .get('/api/label')
    .catch((error) => console.error(error.response));
  totalLabelsText.innerText = labels ? labels.data.length : 0;
};

// refresh total stopwords text UI
const refreshTotalStopwordsText = async () => {
  const stopwords = await axios
    .get('/api/stopword')
    .catch((error) => console.error(error.response));
  totalStopwordsText.innerText = stopwords.data.length;
};

// refresh labels list UI
const refreshLabelsList = async () => {
  labelsList.innerHTML = '';

  const labels = await axios
    .get('/api/label')
    .catch((error) => console.error(error.response));

  if (labels && labels.data.length > 0) {
    for (const label of labels.data) {
      labelsList.insertAdjacentHTML(
        'beforeend',
        `<li class="list-separated-item">
          <div class="row align-items-center">
            <div class="col-2">
              <span class="colorinput-color mr-5" style="background-color: ${label.color};"></span>
            </div>
            <div class="col-6 pl-5">
              ${label.name}
            </div>
            <div class="col-4 text-center">
              <a name="btn-edit-label" label-id="${label._id}" class="icon mx-2"
                href="javascript:void(0)">
                <i class="fe fe-edit"></i>
              </a>
              <a name="btn-delete-label" label-id="${label._id}" class="icon"
                href="javascript:void(0)">
                <i class="fe fe-trash-2"></i>
              </a>
            </div>
          </div>
        </li>`,
      );
    }
  } else {
    labelsList.insertAdjacentHTML(
      'beforeend',
      '<div class="text-center">Belum ada kategori.</div>',
    );
  }

  // set buttons listener
  initEditLabelButtonsListener();
  initDeleteLabelButtonsListener();
};

// init form label modal for create and update
const initFormLabelModal = (
  title,
  successMessage,
  errorMessage,
  labelId,
  labelName = '',
  labelColor = 'rgb(69,170,242)',
  scrapingUrl = '',
) => {
  Swal.fire({
    title,
    html: `<div class="w-100 mt-5">
            <div class="row">
              <div class="form-group text-left col-8">
                <label class="form-label">Nama Kategori <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="label-name" autocomplete="off"
                  placeholder="nama kategori . . ." value="${labelName}">
              </div>
              <div class="form-group col-4">
                <label class="form-label">Warna Visualisasi</label>
                <div id="color-picker"></div>
              </div>
            </div>
            <div class="row">
              <div class="form-group text-left col">
                <label class="form-label">URL Scraping</label>
                <input type="text" class="form-control" name="scraping-url" autocomplete="off"
                  placeholder="contoh: https://www.tribunnews.com/sport" value="${scrapingUrl}">
              </div>
            </div>
          </div>`,
    showCancelButton: true,
    confirmButtonText: !labelId ? 'Simpan' : 'Edit',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !swal.isLoading(),
    onOpen: () => initColorPicker('#color-picker', labelColor),
    preConfirm: async () => {
      const name = document.querySelector('input[name="label-name"]').value;
      const scraping_url = document.querySelector('input[name="scraping-url"]')
        .value;

      // validate scraping url
      if (
        scraping_url &&
        !scraping_url.startsWith('https://www.tribunnews.com/') &&
        !scraping_url.startsWith('http://www.tribunnews.com/')
      ) {
        return Swal.fire({
          title: 'Peringatan',
          html:
            'Url scraping tidak valid, pastikan url scraping berasal dari domain tribunnews dengan format yang valid<br>(contoh: https://www.tribunnews.com/:path).',
          icon: 'warning',
        });
      }

      if (name) {
        function componentToHex(c) {
          var hex = c.toString(16);
          return hex.length == 1 ? '0' + hex : hex;
        }

        function rgbToHex(r, g, b) {
          return (
            '#' +
            componentToHex(r) +
            componentToHex(g) +
            componentToHex(b)
          ).toUpperCase();
        }

        const [r, g, b] = document
          .querySelector('button.pcr-button')
          .style.color.replace('rgb(', '')
          .replace(')', '')
          .split(', ')
          .map((value) => parseInt(value));
        const color = rgbToHex(r, g, b);
        const label = scraping_url
          ? { name, color, scraping_url }
          : { name, color };

        // ajax create or update
        try {
          !labelId
            ? await axios.post('/api/label', label)
            : await axios.put(`/api/label/${labelId}`, label);

          // refresh labels list UI
          await refreshLabelsList();

          if (!labelId) {
            // refresh total labels UI if create label
            await refreshTotalLabelsText();

            // refresh buttons UI
            deleteAllLabelButton.disabled = false;
            deleteAllLabelButton.classList.remove('btn-gray');
            deleteAllLabelButton.classList.add('btn-danger');
            labelDowloadButton.disabled = false;
            labelDowloadButton.classList.remove('btn-gray');
            labelDowloadButton.classList.add('btn-info');
          } else {
            // if update label

            // update training set chart
            const indexInTrainingSetChart = trainingSetsChart.data.datasets.findIndex(
              (dataset) =>
                dataset.label.toLowerCase() === labelName.toLowerCase(),
            );
            if (indexInTrainingSetChart !== -1) {
              trainingSetsChart.data.datasets[indexInTrainingSetChart].label =
                label.name;
              trainingSetsChart.data.datasets[
                indexInTrainingSetChart
              ].backgroundColor = [label.color];
              trainingSetsChart.update();
            }

            // update testing set chart
            const indexInTestingSetChart = testingSetsChart.data.datasets.findIndex(
              (dataset) =>
                dataset.label.toLowerCase() === labelName.toLowerCase(),
            );
            if (indexInTestingSetChart !== -1) {
              testingSetsChart.data.datasets[indexInTestingSetChart].label =
                label.name;
              testingSetsChart.data.datasets[
                indexInTestingSetChart
              ].backgroundColor = [label.color];
              testingSetsChart.update();
            }
          }

          // popup success modal
          Swal.fire({
            title: 'Berhasil',
            html: successMessage,
            icon: 'success',
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            html: errorMessage,
            icon: 'error',
          });
          return console.error(error);
        }
      } else {
        Swal.fire({
          title: 'Peringatan',
          html: `Nama kategori wajib diisi.`,
          icon: 'warning',
        });
      }
    },
  });
};

// init edit label buttons listener
const initEditLabelButtonsListener = () => {
  const editLabelButtons = document.querySelectorAll(
    'a[name="btn-edit-label"]',
  );

  for (const button of editLabelButtons) {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('label-id');

      const label = await axios
        .get(`/api/label/${id}`)
        .catch((error) => console.error(error.response));

      initFormLabelModal(
        'Edit Kategori',
        'Kategori telah diperbarui.',
        'Kategori gagal diperbarui.',
        id,
        label.data.name,
        label.data.color,
        label.data.scraping_url,
      );
    });
  }
};

// init delete label buttons listener
const initDeleteLabelButtonsListener = () => {
  const deleteLabelButtons = document.querySelectorAll(
    'a[name="btn-delete-label"]',
  );

  for (const button of deleteLabelButtons) {
    button.addEventListener('click', () => {
      Swal.fire({
        title: 'Anda Yakin?',
        text: 'Kategori akan dihapus beserta dataset yang terlibat.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !swal.isLoading(),
        preConfirm: async () => {
          const id = button.getAttribute('label-id');

          // delete label
          try {
            const label = await axios.delete(`/api/label/${id}`);

            // popup success modal
            Swal.fire({
              title: 'Berhasil',
              html: `Kategori telah dihapus.`,
              icon: 'success',
            });

            // update training set chart
            const indexInTrainingSetChart = trainingSetsChart.data.datasets.findIndex(
              (dataset) => dataset.label.toLowerCase() === label.data.name,
            );
            if (indexInTrainingSetChart !== -1) {
              trainingSetsChart.data.datasets.splice(
                indexInTrainingSetChart,
                1,
              );
              trainingSetsChart.update();
            }

            // update testing set chart
            const indexInTestingSetChart = testingSetsChart.data.datasets.findIndex(
              (dataset) => dataset.label.toLowerCase() === label.data.name,
            );
            if (indexInTestingSetChart !== -1) {
              testingSetsChart.data.datasets.splice(indexInTestingSetChart, 1);
              testingSetsChart.update();
            }

            // refresh UI
            await Promise.all([refreshLabelsList(), refreshTotalLabelsText()]);

            // if label data is empty
            if (parseInt(totalLabelsText.innerText) === 0) {
              deleteAllLabelButton.disabled = true;
              deleteAllLabelButton.classList.remove('btn-danger');
              deleteAllLabelButton.classList.add('btn-gray');
              labelDowloadButton.disabled = true;
              labelDowloadButton.classList.remove('btn-info');
              labelDowloadButton.classList.add('btn-gray');
            }
          } catch (error) {
            Swal.fire({
              title: 'Error',
              html: `Kategori gagal dihapus.`,
              icon: 'error',
            });
            return console.error(error);
          }
        },
      });
    });
  }
};

// refresh stopwords list UI
const refreshStopwordsList = async () => {
  inputSearchStopword.value = '';
  stopwordsList.innerHTML = '';

  // get stopwords data
  const stopwords = await axios
    .get('/api/stopword')
    .catch((error) => console.error(error.response));

  // refresh UI
  if (stopwords.data.length > 0) {
    for (const stopword of stopwords.data) {
      stopwordsList.insertAdjacentHTML(
        'beforeend',
        `<li class="list-separated-item">
          <div class="row align-items-center">
            <div class="col-8">
              <div>
                ${stopword.name}
              </div>
            </div>
            <div class="col-4 text-center">
              <a name="btn-edit-stopword" stopword-id="${stopword._id}" class="icon mx-2" href="javascript:void(0)">
                <i class="fe fe-edit"></i>
              </a>
              <a name="btn-delete-stopword" stopword-id="${stopword._id}" class="icon" href="javascript:void(0)">
                <i class="fe fe-trash-2"></i>
              </a>
            </div>
          </div>
        </li>`,
      );
    }
  } else {
    stopwordsList.insertAdjacentHTML(
      'beforeend',
      '<div class="text-center">Belum ada stopword.</div>',
    );
  }

  // set buttons listener
  initEditStopwordButtonsListener();
  initDeleteStopwordButtonsListener();
};

// init form stopword modal for create and update
const initFormStopwordModal = (
  title,
  successMessage,
  errorMessage,
  stopwordId,
  stopwordName = '',
) => {
  Swal.fire({
    title,
    html: `<div class="w-100 mt-5">
            <div class="form-group">
              <label class="form-label text-left">Stopword</label>
              <input type="text" class="form-control" name="stopword-name" 
                placeholder="nama stopword . . ." value="${stopwordName}">
            </div>
          </div>`,
    showCancelButton: true,
    confirmButtonText: !stopwordId ? 'Simpan' : 'Edit',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !swal.isLoading(),
    preConfirm: async () => {
      const name = document.querySelector('input[name="stopword-name"]').value;
      if (name) {
        // if stopword name is filled
        const stopword = { name };

        // ajax create or update stopword
        try {
          !stopwordId
            ? await axios.post('/api/stopword', stopword)
            : await axios.put(`/api/stopword/${stopwordId}`, stopword);

          // refresh stopwords list UI
          await refreshStopwordsList();

          // refresh total stopwords UI if create stopword
          if (!stopwordId) {
            // refresh total stopwords UI
            await refreshTotalStopwordsText();

            // refresh buttons UI
            deleteAllStopwordButton.disabled = false;
            deleteAllStopwordButton.classList.remove('btn-gray');
            deleteAllStopwordButton.classList.add('btn-danger');
            stopwordDowloadButton.disabled = false;
            stopwordDowloadButton.classList.remove('btn-gray');
            stopwordDowloadButton.classList.add('btn-info');
          }

          // popup success modal
          Swal.fire({
            title: 'Berhasil',
            html: successMessage,
            icon: 'success',
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            html: errorMessage,
            icon: 'error',
          });
          return console.error(error);
        }
      } else {
        // if stopword name is not filled
        Swal.fire({
          title: 'Peringatan',
          html: `Nama stopword wajib diisi.`,
          icon: 'warning',
        });
      }
    },
  });
};

// init edit stopword buttons listener
const initEditStopwordButtonsListener = () => {
  const editStopwordButtons = document.querySelectorAll(
    'a[name="btn-edit-stopword"]',
  );

  for (const button of editStopwordButtons) {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('stopword-id');
      const stopword = await axios
        .get(`/api/stopword/${id}`)
        .catch((error) => console.error(error.response));

      initFormStopwordModal(
        'Edit Stopword',
        'Stopword telah diperbarui.',
        'Stopword gagal diperbarui.',
        id,
        stopword.data.name,
      );
    });
  }
};

// init delete stopword buttons listener
const initDeleteStopwordButtonsListener = () => {
  const deleteStopwordButtons = document.querySelectorAll(
    'a[name="btn-delete-stopword"]',
  );

  for (const button of deleteStopwordButtons) {
    button.addEventListener('click', () => {
      Swal.fire({
        title: 'Anda Yakin?',
        text: 'Stopword akan dihapus.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !swal.isLoading(),
        preConfirm: async () => {
          // delete stopword
          const id = button.getAttribute('stopword-id');
          try {
            await axios.delete(`/api/stopword/${id}`);

            // refresh UI
            await Promise.all([
              refreshStopwordsList(),
              refreshTotalStopwordsText(),
            ]);

            // if stopword data is empty
            if (parseInt(totalStopwordsText.innerText) === 0) {
              deleteAllStopwordButton.disabled = true;
              deleteAllStopwordButton.classList.remove('btn-danger');
              deleteAllStopwordButton.classList.add('btn-gray');
              stopwordDowloadButton.disabled = true;
              stopwordDowloadButton.classList.remove('btn-info');
              stopwordDowloadButton.classList.add('btn-gray');
            }

            // popup success modal
            Swal.fire({
              title: 'Berhasil',
              html: `Stopword telah dihapus.`,
              icon: 'success',
            });
          } catch (error) {
            Swal.fire({
              title: 'Error',
              html: `Stopword gagal dihapus.`,
              icon: 'error',
            });
            return console.error(error);
          }
        },
      });
    });
  }
};

// labels slider control
labelsSlider.addEventListener('click', () => easingScrollTo(labelsCard, 1000));

// stopwords slider control
stopwordsSlider.addEventListener('click', () =>
  easingScrollTo(stopwordsCard, 1000),
);

// add label button control
addLabelButton.addEventListener('click', () =>
  initFormLabelModal(
    'Tambah Kategori',
    'Kategori telah disimpan.',
    'Kategori gagal disimpan.',
  ),
);

// delete all label button control
deleteAllLabelButton.addEventListener('click', () => {
  Swal.fire({
    title: 'Anda Yakin?',
    text: 'Kategori akan dihapus beserta seluruh dataset yang terlibat.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !swal.isLoading(),
    preConfirm: async () => {
      // delete all labels
      try {
        await axios.post('/api/label/delete-where');

        // refresh UI
        await Promise.all([refreshLabelsList(), refreshTotalLabelsText()]);

        deleteAllLabelButton.disabled = true;
        deleteAllLabelButton.classList.remove('btn-danger');
        deleteAllLabelButton.classList.add('btn-gray');
        labelDowloadButton.disabled = true;
        labelDowloadButton.classList.remove('btn-info');
        labelDowloadButton.classList.add('btn-gray');

        // update training set chart
        trainingSetsChart.data.datasets = [];
        trainingSetsChart.update();

        // update testing set chart
        testingSetsChart.data.datasets = [];
        testingSetsChart.update();

        // popup success modal
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          html: `Kategori beserta seluruh dataset yang terlibat telah dihapus.`,
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          html: `Gagal menghapus kategori.`,
          icon: 'error',
        });
        return console.error(error);
      }
    },
  });
});

// init edit and delete label buttons
initEditLabelButtonsListener();
initDeleteLabelButtonsListener();

// download label template button control
labelTemplateDownloadButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: 'Menyiapkan file template . . .',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = '/api/excel/label-template';

  // enable buttons
  for (const button of buttons) {
    button.classList.remove('btn-loading', 'disabled');
    if (button.getAttribute('init-disabled-state') === 'false')
      button.disabled = false;
  }

  // show success toast
  Swal.fire({
    icon: 'success',
    title: 'File template telah siap didownload.',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
});

// download label button control
labelDowloadButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: 'Menyiapkan data label . . .',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = '/api/excel/label';

  // enable buttons
  for (const button of buttons) {
    button.classList.remove('btn-loading', 'disabled');
    if (button.getAttribute('init-disabled-state') === 'false')
      button.disabled = false;
  }

  // show success toast
  Swal.fire({
    icon: 'success',
    title: 'File telah siap didownload.',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
});

// input excel label control
inputExcelLabel.addEventListener('input', () => {
  const inputFile = inputExcelLabel.files[0];
  const inputType = inputFile.type;

  if (
    inputType === 'application/vnd.ms-excel' ||
    inputType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    // if file attachment is in excel format
    Swal.fire({
      title: 'Anda Yakin?',
      text:
        'Semua label kategori yang lama akan dihapus beserta seluruh dataset yang terlibat.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      preConfirm: async () => {
        // read excel data
        const excelData = await readXlsxFile(inputFile);

        // disable buttons
        for (const button of buttons) {
          button.classList.add('btn-loading', 'disabled');
          button.setAttribute('init-disabled-state', button.disabled);
          button.disabled = true;
        }

        // loading toast
        Swal.fire({
          title: 'Sedang mengupload file . . .',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          onOpen: () => Swal.showLoading(),
        });

        // ajax post excel data
        try {
          await axios.post('/api/excel/label', excelData);

          // show success toast
          Swal.fire({
            icon: 'success',
            title: 'File berhasil diupload.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });

          // refresh UI
          await Promise.all([refreshLabelsList(), refreshTotalLabelsText()]);

          deleteAllLabelButton.disabled = false;
          deleteAllLabelButton.classList.remove('btn-gray');
          deleteAllLabelButton.classList.add('btn-danger');
          labelDowloadButton.disabled = false;
          labelDowloadButton.classList.remove('btn-gray');
          labelDowloadButton.classList.add('btn-info');

          // update training set chart
          trainingSetsChart.data.datasets = [];
          trainingSetsChart.update();

          // update testing set chart
          testingSetsChart.data.datasets = [];
          testingSetsChart.update();
        } catch (error) {
          // show error toast
          Swal.fire({
            icon: 'error',
            title: 'File gagal diupload, terjadi suatu kesalahan.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          return console.error(error);
        } finally {
          // enable buttons
          for (const button of buttons) {
            button.classList.remove('btn-loading', 'disabled');
            if (button.getAttribute('init-disabled-state') === 'false')
              button.disabled = false;
          }
        }
      },
    });
  } else {
    // if file attachment is not in excel format
    Swal.fire({
      icon: 'error',
      title: 'File yang diupload harus berformat .xls atau .xlsx.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // reset file input
  inputExcelLabel.value = '';
});

// upload label button control
labelUploadButton.addEventListener('click', () => {
  inputExcelLabel.click();
});

// input search stopword control
inputSearchStopword.addEventListener('input', async () => {
  // ajax based on user input
  const stopwords = await axios
    .post('/api/stopword/search', {
      name: inputSearchStopword.value,
    })
    .catch((error) => console.error(error.response));

  // refresh stopwords list UI
  stopwordsList.innerHTML = '';
  if (stopwords.data.length > 0) {
    // if similar stopword is found
    for (const stopword of stopwords.data) {
      stopwordsList.insertAdjacentHTML(
        'beforeend',
        `<li class="list-separated-item" stopword-value="${stopword.name}">
          <div class="row align-items-center">
            <div class="col">
              <div>
                ${stopword.name}
              </div>
            </div>
            <div class="col-auto">
              <a name="btn-edit-stopword" stopword-id="${stopword._id}" class="icon mx-2"
                href="javascript:void(0)">
                <i class="fe fe-edit"></i>
              </a>
              <a name="btn-delete-stopword" stopword-id="${stopword._id}" class="icon"
                href="javascript:void(0)">
                <i class="fe fe-trash-2"></i>
              </a>
            </div>
          </div>
        </li>`,
      );
    }

    // set button listeners
    initEditStopwordButtonsListener();
    initDeleteStopwordButtonsListener();
  } else {
    // if similar stopword is not found
    stopwordsList.insertAdjacentHTML(
      'beforeend',
      '<div class="text-center">Tidak ada stopword sejenis dengan kata yang dicari.</div>',
    );
  }
});

// refresh stopwords button control
refreshStopwordsButton.addEventListener(
  'click',
  async () => await refreshStopwordsList(),
);

// add stopword button control
addStopwordButton.addEventListener('click', () =>
  initFormStopwordModal(
    'Tambah Stopword',
    'Stopword telah disimpan.',
    'Stopword gagal disimpan.',
  ),
);

// delete all stopword button control
deleteAllStopwordButton.addEventListener('click', () => {
  Swal.fire({
    title: 'Anda Yakin?',
    text: 'Seluruh stopword akan dihapus.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !swal.isLoading(),
    preConfirm: async () => {
      // delete all stopwords
      try {
        await axios.post('/api/stopword/delete-where', {});

        // refresh UI
        await Promise.all([
          refreshStopwordsList(),
          refreshTotalStopwordsText(),
        ]);

        deleteAllStopwordButton.disabled = true;
        deleteAllStopwordButton.classList.remove('btn-danger');
        deleteAllStopwordButton.classList.add('btn-gray');
        stopwordDowloadButton.disabled = true;
        stopwordDowloadButton.classList.remove('btn-info');
        stopwordDowloadButton.classList.add('btn-gray');

        // popup success modal
        Swal.fire({
          title: 'Berhasil',
          html: `Seluruh stopword telah dihapus.`,
          icon: 'success',
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          html: `Gagal menghapus stopword.`,
          icon: 'error',
        });
        return console.error(error);
      }
    },
  });
});

// init edit and delete stopword buttons
initEditStopwordButtonsListener();
initDeleteStopwordButtonsListener();

// download stopword template button control
stopwordTemplateDownloadButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: 'Menyiapkan file template . . .',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = '/api/excel/stopword-template';

  // enable buttons
  for (const button of buttons) {
    button.classList.remove('btn-loading', 'disabled');
    if (button.getAttribute('init-disabled-state') === 'false')
      button.disabled = false;
  }

  // show success toast
  Swal.fire({
    icon: 'success',
    title: 'File template telah siap didownload.',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
});

// download stopword button control
stopwordDowloadButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: 'Menyiapkan data stopword . . .',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = '/api/excel/stopword';

  // disable buttons
  for (const button of buttons) {
    button.classList.remove('btn-loading', 'disabled');
    if (button.getAttribute('init-disabled-state') === 'false')
      button.disabled = false;
  }

  // show success toast
  Swal.fire({
    icon: 'success',
    title: 'File telah siap didownload.',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
});

// input excel stopword control
inputExcelStopword.addEventListener('input', () => {
  const inputFile = inputExcelStopword.files[0];
  const inputType = inputFile.type;

  if (
    inputType === 'application/vnd.ms-excel' ||
    inputType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    // if file attachment is in excel format
    Swal.fire({
      title: 'Anda Yakin?',
      text: 'Semua stopword yang lama akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      preConfirm: async () => {
        // read excel data
        const excelData = await readXlsxFile(inputFile);

        // disable buttons
        for (const button of buttons) {
          button.classList.add('btn-loading', 'disabled');
          button.setAttribute('init-disabled-state', button.disabled);
          button.disabled = true;
        }

        // loading toast
        Swal.fire({
          title: 'Sedang mengupload file . . .',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          onOpen: () => Swal.showLoading(),
        });

        // ajax post excel data
        try {
          await axios.post('/api/excel/stopword', excelData);

          // show success toast
          Swal.fire({
            icon: 'success',
            title: 'File berhasil diupload.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        } catch (error) {
          // show error toast
          Swal.fire({
            icon: 'error',
            title: 'File gagal diupload, terjadi suatu kesalahan.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          return console.error(error);
        } finally {
          // enable buttons
          for (const button of buttons) {
            button.classList.remove('btn-loading', 'disabled');
            if (button.getAttribute('init-disabled-state') === 'false')
              button.disabled = false;
          }

          // refresh UI
          await Promise.all([
            refreshStopwordsList(),
            refreshTotalStopwordsText(),
          ]);

          deleteAllStopwordButton.disabled = false;
          deleteAllStopwordButton.classList.remove('btn-gray');
          deleteAllStopwordButton.classList.add('btn-danger');
          stopwordDowloadButton.disabled = false;
          stopwordDowloadButton.classList.remove('btn-gray');
          stopwordDowloadButton.classList.add('btn-info');
        }
      },
    });
  } else {
    // if file attachment is not in excel format
    Swal.fire({
      icon: 'error',
      title: 'File yang diupload harus berformat .xls atau .xlsx.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // reset file input
  inputExcelStopword.value = '';
});

// upload stopword button control
stopwordUploadButton.addEventListener('click', () =>
  inputExcelStopword.click(),
);

// init charts
initCharts();
