// DOM elements
const runButton = document.querySelector('#btn-run');
const downloadTrainingTokensButton = document.querySelector(
  '#btn-download-training-tokens',
);
const downloadTestingTokensButton = document.querySelector(
  '#btn-download-testing-tokens',
);
const downloadTrainingTfsButton = document.querySelector(
  '#btn-download-training-tfs',
);
const downloadTestingTfsButton = document.querySelector(
  '#btn-download-testing-tfs',
);
const downloadIdfsButton = document.querySelector('#btn-download-idfs');
const downloadTrainingTfIdfsButton = document.querySelector(
  '#btn-download-training-tf-idfs',
);
const downloadTestingTfIdfsButton = document.querySelector(
  '#btn-download-testing-tf-idfs',
);

// run button control
runButton.addEventListener('click', async () => {
  try {
    // check if any training set and testing set
    const response = await axios.get('/api/features-extraction/is-ready');
    const isReady = response.data;
    if (!isReady) {
      // warning modal
      return Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        html:
          'Dibutuhkan minimum 10 buah dokumen training set<br>dan 1 buah testing set untuk dapat melakukan<br>10 fold cross validation dan pengujian model klasifikasi.<br>Tambahkan dokumen berita pada submenu dari menu Data.',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showConfirmButton: true,
        showCancelButton: false,
        confirmButtonText: 'Mengerti',
      });
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // show confirmation modal
  const modalResponse = await Swal.fire({
    icon: 'question',
    title: 'Mulai Ekstraksi Fitur?',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    reverseButtons: true,
  });

  if (modalResponse.value) {
    // loading toast
    Swal.fire({
      title: 'Melakukan ekstraksi fitur . . .',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      onOpen: () => Swal.showLoading(),
    });

    disableButtons();

    // features extraction
    try {
      await axios.post('/api/features-extraction');

      enableButtons();

      // show success toast
      Swal.fire({
        icon: 'success',
        title: 'Proses ekstraksi fitur telah selesai.',
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
        title: 'Proses ekstraksi fitur gagal.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return console.error(error);
    }
  }
});

// download training tokens button control
downloadTrainingTokensButton.addEventListener('click', () => {
  if (!downloadTrainingTokensButton.classList.value.includes('disabled'))
    download('token training set', '/api/excel/term/training-set');
});

// download testing tokens button control
downloadTestingTokensButton.addEventListener('click', () => {
  if (!downloadTestingTokensButton.classList.value.includes('disabled'))
    download('token testing set', '/api/excel/term/testing-set');
});

// download training tfs button control
downloadTrainingTfsButton.addEventListener('click', () => {
  if (!downloadTrainingTfsButton.classList.value.includes('disabled'))
    download('TF training set', '/api/excel/tf/training-set');
});

// download testing tfs button control
downloadTestingTfsButton.addEventListener('click', () => {
  if (!downloadTestingTfsButton.classList.value.includes('disabled'))
    download('TF testing set', '/api/excel/tf/testing-set');
});

// download idfs button control
downloadIdfsButton.addEventListener('click', () => {
  if (!downloadIdfsButton.classList.value.includes('disabled'))
    download('IDF', '/api/excel/idf');
});

// download training tf-idfs button control
downloadTrainingTfIdfsButton.addEventListener('click', () => {
  if (!downloadTrainingTfIdfsButton.classList.value.includes('disabled'))
    download('TF-IDF training set', '/api/excel/tf-idf/training-set');
});

// download testing tf-idfs button control
downloadTestingTfIdfsButton.addEventListener('click', () => {
  if (!downloadTestingTfIdfsButton.classList.value.includes('disabled'))
    download('TF-IDF testing set', '/api/excel/tf-idf/testing-set');
});

// download action
const download = async (downloadTarget, downloadUrl) => {
  // loading toast
  Swal.fire({
    title: `Menyiapkan ${downloadTarget} . . .`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  disableButtons();

  // download excel
  try {
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'blob',
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

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

    // download
    document.body.insertAdjacentHTML(
      'beforebegin',
      '<a id="downloader" href="" class="d-none"></a>',
    );
    const downloader = document.querySelector('#downloader');
    const url = window.URL.createObjectURL(response.data);
    downloader.href = url;
    downloader.download = response.headers['content-disposition'].replace(
      'attachment; filename=',
      '',
    );
    downloader.click();
    window.URL.revokeObjectURL(url);
    downloader.remove();
  } catch (error) {
    console.error(error.response);
    // popup error modal
    Swal.fire({
      icon: 'error',
      title: `Gagal menyiapkan ${downloadTarget}.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  } finally {
    enableButtons();
  }
};

// disable download buttons
const disableButtons = () => {
  runButton.classList.add('btn-loading', 'disabled');
  runButton.disabled = true;
  downloadTrainingTokensButton.classList.remove('btn-outline-info');
  downloadTrainingTokensButton.classList.add('btn-gray', 'disabled');
  downloadTrainingTokensButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
  downloadTestingTokensButton.classList.remove('btn-outline-info');
  downloadTestingTokensButton.classList.add('btn-gray', 'disabled');
  downloadTestingTokensButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
  downloadTrainingTfsButton.classList.remove('btn-outline-info');
  downloadTrainingTfsButton.classList.add('btn-gray', 'disabled');
  downloadTrainingTfsButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
  downloadTestingTfsButton.classList.remove('btn-outline-info');
  downloadTestingTfsButton.classList.add('btn-gray', 'disabled');
  downloadTestingTfsButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
  downloadIdfsButton.classList.remove('btn-outline-info');
  downloadIdfsButton.classList.add('btn-gray', 'disabled');
  downloadIdfsButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
  downloadTrainingTfIdfsButton.classList.remove('btn-outline-info');
  downloadTrainingTfIdfsButton.classList.add('btn-gray', 'disabled');
  downloadTrainingTfIdfsButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
  downloadTestingTfIdfsButton.classList.remove('btn-outline-info');
  downloadTestingTfIdfsButton.classList.add('btn-gray', 'disabled');
  downloadTestingTfIdfsButton.parentElement.setAttribute(
    'data-original-title',
    'Menunggu hasil<br>ekstraksi fitur',
  );
};

// enable download buttons
const enableButtons = () => {
  runButton.classList.remove('btn-loading', 'disabled');
  runButton.disabled = false;
  downloadTrainingTokensButton.classList.remove('btn-gray', 'disabled');
  downloadTrainingTokensButton.classList.add('btn-outline-info');
  downloadTrainingTokensButton.parentElement.setAttribute(
    'data-original-title',
    '',
  );
  downloadTestingTokensButton.classList.remove('btn-gray', 'disabled');
  downloadTestingTokensButton.classList.add('btn-outline-info');
  downloadTestingTokensButton.parentElement.setAttribute(
    'data-original-title',
    '',
  );
  downloadTrainingTfsButton.classList.remove('btn-gray', 'disabled');
  downloadTrainingTfsButton.classList.add('btn-outline-info');
  downloadTrainingTfsButton.parentElement.setAttribute(
    'data-original-title',
    '',
  );
  downloadTestingTfsButton.classList.remove('btn-gray', 'disabled');
  downloadTestingTfsButton.classList.add('btn-outline-info');
  downloadTestingTfsButton.parentElement.setAttribute(
    'data-original-title',
    '',
  );
  downloadIdfsButton.classList.remove('btn-gray', 'disabled');
  downloadIdfsButton.classList.add('btn-outline-info');
  downloadIdfsButton.parentElement.setAttribute('data-original-title', '');
  downloadTrainingTfIdfsButton.classList.remove('btn-gray', 'disabled');
  downloadTrainingTfIdfsButton.classList.add('btn-outline-info');
  downloadTrainingTfIdfsButton.parentElement.setAttribute(
    'data-original-title',
    '',
  );
  downloadTestingTfIdfsButton.classList.remove('btn-gray', 'disabled');
  downloadTestingTfIdfsButton.classList.add('btn-outline-info');
  downloadTestingTfIdfsButton.parentElement.setAttribute(
    'data-original-title',
    '',
  );
};
