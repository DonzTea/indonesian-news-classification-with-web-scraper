import indonesian from '/plugins/datatables/indonesian.js';

// DOM elements
const buttons = document.querySelectorAll('button');
const checkAll = document.querySelector('#check-all');
const addButton = document.querySelector('#btn-add');
const deleteCheckedButton = document.querySelector('#btn-delete-checked');
const downloadTemplateButton = document.querySelector(
  '#btn-download-dataset-template',
);
const inputExcelDataset = document.querySelector('#input-excel-dataset');
const uploadButton = document.querySelector('#btn-upload-dataset');
const dowloadButton = document.querySelector('#btn-download-dataset');

// global variables
const slugDocType = window.location.pathname.split('/').pop();
const docType = slugDocType.replace('-', ' ');
let checkedDocuments = [];

// filters state
const allFilter = document.querySelector('#filter-all');
const labelFilters = document.querySelectorAll('input[name="checkbox-filter"]');
let activeFilters = Array.from(labelFilters).map((filter) =>
  filter.getAttribute('label-id'),
);

// datatables init
const table = $('#table').DataTable({
  responsive: true,
  language: indonesian,
  processing: true,
  deferRender: true,
  paging: true,
  ajax: {
    url: '/api/datatables/datasets',
    type: 'POST',
    data: function (d) {
      d.docType = docType;
      d.filterIds = activeFilters;
    },
  },
  order: [[1, 'asc']],
  columnDefs: [
    { width: '5%', targets: 0 },
    { width: '5%', targets: 1 },
    { width: '55%', targets: 2 },
    { width: '15%', targets: 3 },
    { width: '20%', targets: 4 },
    {
      className: 'text-center',
      responsivePriority: 1,
      targets: [0, 1, -1, -2],
    },
    {
      className: 'text-justify text-truncate',
      responsivePriority: 2,
      targets: [2],
      render: $.fn.dataTable.render.ellipsis(100),
    },
    {
      searchable: false,
      orderable: false,
      targets: [0, -1],
    },
  ],
  fnDrawCallback: async function () {
    if (checkedDocuments.length > 0) {
      // if any check
      deleteCheckedButton.disabled = false;
      deleteCheckedButton.classList.remove('btn-gray');
      deleteCheckedButton.classList.add('btn-danger');
    } else {
      // if no check
      deleteCheckedButton.disabled = true;
      deleteCheckedButton.classList.remove('btn-danger');
      deleteCheckedButton.classList.add('btn-gray');
    }

    const json = this.api().ajax.json();
    if (json && json.data) {
      if (json.data.length > 0) {
        // if any dataset
        dowloadButton.disabled = false;
        dowloadButton.classList.remove('btn-gray');
        dowloadButton.classList.add('btn-info');
      } else {
        // if there is no dataset
        dowloadButton.disabled = true;
        dowloadButton.classList.remove('btn-info');
        dowloadButton.classList.add('btn-gray');
      }

      // edit buttons control
      const editButtons = document.querySelectorAll('a[name="btn-edit"]');
      for (const editButton of editButtons) {
        editButton.addEventListener('click', async () => {
          const id = editButton.getAttribute('dataset-id');
          const dataset = await axios.get(`/api/dataset/${id}`);

          initDatasetFormModal(
            dataset.data._id,
            dataset.data.title,
            dataset.data.url,
            dataset.data.content,
            dataset.data.label._id,
          );
        });
      }

      // delete buttons control
      const deleteButtons = document.querySelectorAll('a[name="btn-delete"]');
      for (const deleteButton of deleteButtons) {
        const id = deleteButton.getAttribute('dataset-id');
        deleteButton.addEventListener('click', () =>
          Swal.fire({
            title: 'Anda Yakin?',
            text: 'Dokumen akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            allowOutsideClick: () => !swal.isLoading(),
            preConfirm: async () => {
              try {
                await axios.delete(`/api/dataset/${id}`);

                const index = checkedDocuments.findIndex(
                  (documentId) => documentId === id,
                );
                if (index > -1) checkedDocuments.splice(index, 1);

                table.ajax.reload();

                Swal.fire({
                  title: 'Berhasil',
                  html: `Dokumen telah dihapus.`,
                  icon: 'success',
                });
              } catch (error) {
                Swal.fire({
                  title: 'Error',
                  html: `Dokumen gagal dihapus.`,
                  icon: 'error',
                });
                return console.error(error);
              }
            },
          }),
        );
      }

      // select checkboxes DOM element
      const checkboxes = document.querySelectorAll(
        'input[name="check-single"]',
      );

      // set checkboxes state
      for (const checkbox of checkboxes) {
        const documentId = checkbox.getAttribute('dataset-id');

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            deleteCheckedButton.removeAttribute('disabled');
            deleteCheckedButton.classList.remove('btn-gray');
            deleteCheckedButton.classList.add('btn-danger');

            const index = checkedDocuments.findIndex((id) => id === documentId);
            if (index === -1) checkedDocuments.push(documentId);

            if (checkedDocuments.length === json.data.length)
              checkAll.checked = true;
          } else {
            checkAll.checked = false;

            const index = checkedDocuments.findIndex((id) => id === documentId);
            checkedDocuments.splice(index, 1);

            if (checkedDocuments.length === 0) {
              deleteCheckedButton.setAttribute('disabled', 'disabled');
              deleteCheckedButton.classList.remove('btn-danger');
              deleteCheckedButton.classList.add('btn-gray');
            }
          }
        });

        if (checkedDocuments.includes(documentId)) {
          checkbox.checked = true;
        }
      }

      // check all control
      checkAll.addEventListener('change', () => {
        if (checkAll.checked) {
          checkedDocuments = json.data.map((data) => {
            const startIndex = data[0].indexOf('dataset-id');
            const string = data[0].slice(startIndex);
            const endIndex = string.indexOf('" ');
            return string.slice(0, endIndex).replace('dataset-id="', '');
          });

          for (const checkbox of checkboxes) {
            checkbox.checked = true;
          }
          deleteCheckedButton.disabled = false;
          deleteCheckedButton.classList.remove('btn-gray');
          deleteCheckedButton.classList.add('btn-danger');
        } else {
          checkedDocuments = [];
          for (const checkbox of checkboxes) {
            checkbox.checked = false;
          }
          deleteCheckedButton.disabled = true;
          deleteCheckedButton.classList.remove('btn-danger');
          deleteCheckedButton.classList.add('btn-gray');
        }
      });
    }
  },
});

// filter all control
allFilter.addEventListener('click', async () => {
  allFilter.checked = true;
  if (activeFilters.length < labelFilters.length) {
    for (const filter of labelFilters) {
      const id = filter.getAttribute('label-id');
      if (!filter.checked) {
        filter.checked = true;
        activeFilters.push(id);
      }
    }
  }
  table.ajax.reload();
});

// filters control
for (const filter of labelFilters) {
  const id = filter.getAttribute('label-id');
  filter.addEventListener('click', async () => {
    if (allFilter.checked) {
      allFilter.checked = false;
      activeFilters = [];
      for (const filter of labelFilters) {
        filter.checked = false;
      }
      filter.checked = true;
      activeFilters.push(id);
    } else {
      if (filter.checked) {
        activeFilters.push(id);
        if (activeFilters.length === labelFilters.length && !allFilter.checked)
          allFilter.checked = true;
      } else {
        filter.checked = false;
        const index = activeFilters.findIndex((filterId) => filterId === id);
        activeFilters.splice(index, 1);
      }
    }
    table.ajax.reload();
  });
}

// init dataset form modal
const initDatasetFormModal = async (
  datasetId,
  datasetTitle,
  datasetUrl,
  datasetContent,
  labelId,
) => {
  try {
    // get labels data and check if stopword is empty
    const [labels, isStopwordEmptyResponse] = await Promise.all([
      axios.get('/api/label'),
      axios.get('/api/stopword/is-empty'),
    ]);

    if (labels.data.length > 0) {
      if (isStopwordEmptyResponse.data) {
        // if no stopword data
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html:
            'Data stopword tidak ditemukan.<br>' +
            `Tidak dapat menambah dokumen ${docType}.<br>` +
            'Tambahkan data stopword terlebih dahulu untuk menambahkan dokumen.<br>Pergi ke halaman stopword sekarang?',
          reverseButtons: true,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
        }).then((result) => {
          if (result.value) {
            window.location.href = '/label-dan-stopword';
          }
        });
      } else {
        // if system have label data and stopword data, then show modal form
        Swal.fire({
          html: `<input id="input-id" type="hidden" value="${datasetId || ''}">
           <div class="form-group">
            <div class="row align-items-center">
              <label class="col-sm-2 text-left">Judul: </label>
              <div class="col-sm-10">
                <input id="input-title" type="text" class="form-control" placeholder="Judul berita"
                value="${datasetTitle || ''}">
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="row align-items-center">
              <label class="col-sm-2 text-left">Url: </label>
              <div class="col-sm-10">
                <input id="input-url" type="text" class="form-control" 
                 placeholder="https://www.tribunnews.com/ . . ." value="${
                   datasetUrl || ''
                 }">
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="row align-items-center">
              <label class="col-sm-2 text-left">
                Kategori: <span class="text-danger font-weight-bold">*</span>
              </label>
              <div class="col-sm-10 form-group text-left m-0">
                <div id="labels-list" class="custom-controls-stacked">
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="row align-items-center">
              <label class="col-12 text-left">
                Konten Berita: <span class="text-danger font-weight-bold">*</span>
              </label>
              <div class="col-12">
              ${
                '<textarea id="input-content" rows="10" class="form-control text-justify" placeholder="Konten berita . . .">' +
                (datasetContent || '') +
                '</textarea>'
              }
              </div>
            </div>
          </div>
          <div class="btn-list mt-4 text-right">
            <button id="btn-clear" type="button" class="btn btn-secondary btn-space">Bersihkan</button>
            <button id="btn-submit" type="submit" class="btn btn-primary btn-space">
            ${!datasetContent ? 'Simpan' : 'Edit'}
            </button>
          </div>`,
          showConfirmButton: false,
          width: '90%',
          allowOutsideClick: () => !swal.isLoading(),
          onOpen: () => {
            // add data to labels list UI in modal
            const labelsList = document.querySelector('#labels-list');
            if (labelId) {
              // if modal is for create dataset
              for (const label of labels.data) {
                labelsList.insertAdjacentHTML(
                  'beforeend',
                  `<label class="custom-control custom-radio custom-control-inline">
              <input type="radio" class="custom-control-input" name="radio-label"
                value="${label._id}" ${
                    labelId === label._id ? 'checked="checked"' : ''
                  }>
              <span class="custom-control-label">${label.name}</span>
            </label>`,
                );
              }
            } else {
              // if modal is for update dataset
              for (const [index, label] of labels.data.entries()) {
                labelsList.insertAdjacentHTML(
                  'beforeend',
                  `<label class="custom-control custom-radio custom-control-inline">
              <input type="radio" class="custom-control-input" name="radio-label"
               value="${label._id}" ${index === 0 ? 'checked="checked"' : ''}>
              <span class="custom-control-label">${label.name}</span>
            </label>`,
                );
              }
            }

            // modal DOM elements
            const inputId = document.querySelector('#input-id');
            const inputTitle = document.querySelector('#input-title');
            const inputUrl = document.querySelector('#input-url');
            const inputLabels = document.querySelectorAll(
              'input[name="radio-label"]',
            );
            const inputContent = document.querySelector('#input-content');
            const clearButton = document.querySelector('#btn-clear');
            const submitButton = document.querySelector('#btn-submit');

            // label radio buttons control
            for (const radio of inputLabels) {
              radio.addEventListener('click', function () {
                for (const radio of inputLabels) {
                  radio.removeAttribute('checked');
                }
                this.setAttribute('checked', 'checked');
              });
            }

            // clear button control
            clearButton.addEventListener('click', () => {
              inputTitle.value = datasetTitle || '';
              inputUrl.value = datasetUrl || '';
              labelId
                ? document
                    .querySelector(
                      `input[name="radio-label"][value="${labelId}"]`,
                    )
                    .click()
                : inputLabels[0].click();
              inputContent.value = datasetContent || '';
            });

            // submit button control
            submitButton.addEventListener('click', async () => {
              const id = inputId.value;
              const title = inputTitle.value;
              const url = inputUrl.value;
              const label_id = document.querySelector(
                'input[name="radio-label"][checked="checked"]',
              ).value;
              const content = inputContent.value;

              if (content) {
                Swal.fire({
                  title: datasetId
                    ? 'Memperbarui Data,\nMelakukan Preprocessing . . .'
                    : 'Menambah Data,\nMelakukan Preprocessing . . .',
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                  onOpen: async () => {
                    // show loading modal
                    Swal.showLoading();

                    const dataset = {
                      title,
                      url,
                      content,
                      label: label_id,
                      type: docType,
                    };

                    if (!datasetId) {
                      // if modal is for creating dataset
                      try {
                        await axios.post('/api/dataset', dataset);
                        table.ajax.reload();
                        // popup success modal
                        Swal.fire(
                          'Berhasil',
                          'Berita telah disimpan.',
                          'success',
                        );
                      } catch (error) {
                        await Swal.fire(
                          'Error',
                          'Berita gagal disimpan.',
                          'error',
                        );
                        initDatasetFormModal();
                        return console.error(error);
                      }
                    } else {
                      // if modal is for updating dataset
                      try {
                        await axios.put(`/api/dataset/${datasetId}`, dataset);
                        table.ajax.reload();
                        // popup success modal
                        Swal.fire(
                          'Berhasil',
                          'Berita telah diperbarui.',
                          'success',
                        );
                      } catch (error) {
                        await Swal.fire(
                          'Error',
                          'Berita gagal diperbarui.',
                          'error',
                        );
                        initDatasetFormModal(id, title, url, content, label_id);
                        return console.error(error);
                      }
                    }
                  },
                });
              } else {
                // if content is not filled
                await Swal.fire(
                  'Peringatan',
                  'Konten berita wajib diisi.',
                  'warning',
                );
                initDatasetFormModal(id, title, url, content, label_id);
              }
            });
          },
        });
      }
    } else {
      if (isStopwordEmptyResponse.data) {
        // if no label data and stopword data
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html:
            'Data label dan stopword tidak ditemukan.<br>' +
            `Tidak dapat menambah dokumen ${docType}.<br>` +
            'Tambahkan data label dan stopword terlebih dahulu untuk menambahkan dokumen.<br>Pergi ke halaman label dan stopword sekarang?',
          reverseButtons: true,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
        }).then((result) => {
          if (result.value) {
            window.location.href = '/label-dan-stopword';
          }
        });
      } else {
        // if no label data only
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html:
            'Data label kategori berita tidak ditemukan.<br>' +
            `Tidak dapat menambah dokumen ${docType}.<br>` +
            'Tambahkan data label terlebih dahulu untuk menambahkan dokumen.<br>Pergi ke halaman label sekarang?',
          reverseButtons: true,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
        }).then((result) => {
          if (result.value) {
            window.location.href = '/label-dan-stopword';
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// button add control
addButton.addEventListener('click', async () => await initDatasetFormModal());

// button delete checked control
deleteCheckedButton.addEventListener('click', () => {
  Swal.fire({
    title: 'Anda yakin?',
    text: `${checkedDocuments.length} dokumen akan dihapus`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !swal.isLoading(),
    preConfirm: async () => {
      // delete checked datasets
      let response;
      try {
        response = await axios.post('/api/dataset/delete-where', {
          $or: checkedDocuments.map((id) => {
            return { _id: id };
          }),
          type: docType,
        });

        // UI and state refresh
        table.ajax.reload();
        checkAll.checked = false;
        checkedDocuments = [];

        // success notification
        Swal.fire(
          'Berhasil',
          `${response.data.deletedCount} dokumen telah terhapus.`,
          'success',
        );
      } catch (error) {
        return console.error(error);
      }
    },
  });
});

// download dataset template button control
downloadTemplateButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: `Menyiapkan file template . . .`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = '/api/excel/dataset-template';

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

// input excel dataset control
inputExcelDataset.addEventListener('input', async () => {
  const inputFile = inputExcelDataset.files[0];
  const inputType = inputFile.type;

  if (
    inputType === 'application/vnd.ms-excel' ||
    inputType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    // if file attachment is in excel format
    Swal.fire({
      title: 'Anda Yakin?',
      text: `Semua dokumen ${docType} yang lama akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      preConfirm: async () => {
        try {
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
          await axios.post('/api/excel/dataset', {
            excelData,
            type: docType,
          });

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
          table.ajax.reload();
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
    // show success toast
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
  inputExcelDataset.value = '';
});

// upload dataset button control
uploadButton.addEventListener('click', async () => {
  try {
    // check if label and stopword is empty
    const [isLabelEmptyResponse, isStopwordEmptyResponse] = await Promise.all([
      axios.get('/api/label/is-empty'),
      axios.get('/api/stopword/is-empty'),
    ]);

    if (!isLabelEmptyResponse.data) {
      if (isStopwordEmptyResponse.data) {
        // if no stopword data
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html:
            'Data stopword tidak ditemukan.<br>' +
            `Tidak dapat menambah dokumen ${docType}.<br>` +
            'Tambahkan data stopword terlebih dahulu untuk menambahkan dokumen.<br>Pergi ke halaman stopword sekarang?',
          reverseButtons: true,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
        }).then((result) => {
          if (result.value) {
            window.location.href = '/label-dan-stopword';
          }
        });
      } else {
        // if system have label data and stopword data, then upload file
        inputExcelDataset.click();
      }
    } else {
      if (isStopwordEmptyResponse.data) {
        // if no label data and stopword data
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html:
            'Data label dan stopword tidak ditemukan.<br>' +
            `Tidak dapat menambah dokumen ${docType}.<br>` +
            'Tambahkan data label dan stopword terlebih dahulu untuk menambahkan dokumen.<br>Pergi ke halaman label dan stopword sekarang?',
          reverseButtons: true,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
        }).then((result) => {
          if (result.value) {
            window.location.href = '/label-dan-stopword';
          }
        });
      } else {
        // if no label data only
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html:
            'Data label kategori berita tidak ditemukan.<br>' +
            `Tidak dapat menambah dokumen ${docType}.<br>` +
            'Tambahkan data label terlebih dahulu untuk menambahkan dokumen.<br>Pergi ke halaman label sekarang?',
          reverseButtons: true,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
        }).then((result) => {
          if (result.value) {
            window.location.href = '/label-dan-stopword';
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// download dataset button control
dowloadButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: `Menyiapkan data ${docType} . . .`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = `/api/excel/dataset/${slugDocType}`;

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
