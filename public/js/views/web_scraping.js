import indonesian from '/plugins/datatables/indonesian.js';
import { easingScrollTo } from '../components/easing_scroll.js';

// DOM elements
const buttons = document.querySelectorAll('button');
const totalDataInput = document.querySelector('#input-total-data');
const runButton = document.querySelector('#btn-run');
const checkAll = document.querySelector('#check-all');
const deleteCheckedButton = document.querySelector('#btn-delete-checked');
const dowloadButton = document.querySelector('#btn-download-data');
const webScrapingResultCard = document.querySelector(
  '#card-web-scraping-result',
);

// total data input control
let totalData = parseInt(totalDataInput.getAttribute('value'));
totalDataInput.addEventListener('input', () => {
  const newValue = totalDataInput.value;
  if (
    newValue === '' ||
    newValue < parseInt(totalDataInput.getAttribute('min'))
  ) {
    totalDataInput.value = 1;
    totalDataInput.setAttribute('value', 1);
    totalData = 1;
  } else {
    totalDataInput.value = newValue;
    totalDataInput.setAttribute('value', newValue);
    totalData = newValue;
  }
});

// filters value handler
const labelFilters = document.querySelectorAll('input[name="filter-label"]');
let activeRadioButton = Array.from(labelFilters).find((dom) => dom.checked);
let [selectedCategory, selectedScrapingUrl] = [
  activeRadioButton.getAttribute('value'),
  activeRadioButton.getAttribute('scraping-url'),
];

// filters control
for (const filter of labelFilters) {
  filter.addEventListener('change', () => {
    const newActiveRadioButton = Array.from(labelFilters).find(
      (dom) => dom.checked,
    );
    [selectedCategory, selectedScrapingUrl] = [
      newActiveRadioButton.getAttribute('value'),
      newActiveRadioButton.getAttribute('scraping-url'),
    ];
  });
}

// datatables init
let checkedDocuments = [];
const table = $('#table').DataTable({
  responsive: true,
  language: indonesian,
  processing: true,
  deferRender: true,
  paging: true,
  ajax: '/api/datatables/web-scraping',
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
        // if any data
        dowloadButton.disabled = false;
        dowloadButton.classList.remove('btn-gray');
        dowloadButton.classList.add('btn-info');
      } else {
        // if there is no data
        dowloadButton.disabled = true;
        dowloadButton.classList.remove('btn-info');
        dowloadButton.classList.add('btn-gray');
      }

      // detail buttons control
      const detailButtons = document.querySelectorAll('a[name="btn-detail"]');
      for (const detailButton of detailButtons) {
        detailButton.addEventListener('click', async () => {
          const id = detailButton.getAttribute('data-id');
          const scrapedData = await axios
            .get(`/api/web-scraping/${id}`)
            .catch((error) => console.error(error.response));

          initDataDetailModal(
            scrapedData.data.title,
            scrapedData.data.url,
            scrapedData.data.content,
            scrapedData.data.label,
          );
        });
      }

      // delete buttons control
      const deleteButtons = document.querySelectorAll('a[name="btn-delete"]');
      for (const deleteButton of deleteButtons) {
        const id = deleteButton.getAttribute('data-id');
        deleteButton.addEventListener('click', () =>
          Swal.fire({
            title: 'Anda Yakin?',
            text: 'Data akan dihapus.',
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
                await axios.delete(`/api/web-scraping/${id}`);

                const index = checkedDocuments.findIndex(
                  (documentId) => documentId === id,
                );
                if (index > -1) checkedDocuments.splice(index, 1);

                Swal.fire({
                  title: 'Berhasil',
                  html: `Data telah dihapus.`,
                  icon: 'success',
                });

                table.ajax.reload();
              } catch (error) {
                Swal.fire({
                  title: 'Error',
                  html: `Data gagal dihapus.`,
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
        const documentId = checkbox.getAttribute('data-id');

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
            const startIndex = data[0].indexOf('data-id');
            const string = data[0].slice(startIndex);
            const endIndex = string.indexOf('" ');
            return string.slice(0, endIndex).replace('data-id="', '');
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

// init data detail modal
const initDataDetailModal = (dataTitle, dataUrl, dataContent, dataLabel) => {
  // popup modal
  Swal.fire({
    html: `<div class="form-group">
            <div class="row align-items-center">
              <label class="col-sm-2 text-left">Judul: </label>
              <div class="col-sm-10">
                <input type="text" class="form-control" placeholder="Judul berita"
                value="${dataTitle || ''}" readonly>
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="row align-items-center">
              <label class="col-sm-2 text-left">Url: </label>
              <div class="col-sm-10">
                <input type="text" class="form-control" 
                 placeholder="https://www.tribunnews.com/ . . ." 
                 value="${dataUrl || ''}" readonly>
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="row align-items-center">
              <label class="col-sm-2 text-left">Kategori: </label>
              <div class="col-sm-10">
                <input type="text" class="form-control" 
                placeholder="Kategori berita . . ." 
                value="${
                  dataLabel
                    .split(' ')
                    .map((word) => word[0].toUpperCase() + word.slice(1))
                    .join(' ') || ''
                }" readonly>
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="row align-items-center">
              <label class="col-12 text-left">Konten Berita:</label>
              <div class="col-12">
              ${
                '<textarea rows="10" class="form-control text-justify" placeholder="Konten berita . . ." readonly>' +
                (dataContent || '') +
                '</textarea>'
              }
              </div>
            </div>
          </div>`,
    showConfirmButton: false,
    width: '90%',
    allowOutsideClick: () => !swal.isLoading(),
  });
};

// run button control
runButton.addEventListener('click', async () => {
  const modalResponse = await Swal.fire({
    icon: 'question',
    title: 'Mulai Proses Web Scraping?',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    reverseButtons: true,
  });

  if (modalResponse.value) {
    // disable buttons
    for (const button of buttons) {
      button.classList.add('btn-loading', 'disabled');
      button.setAttribute('init-disabled-state', button.disabled);
      button.disabled = true;
    }

    // scroll to table
    easingScrollTo(webScrapingResultCard);

    // show loading toast
    Swal.fire({
      title: 'Melakukan web scraping . . .',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      onOpen: () => Swal.showLoading(),
    });

    try {
      await axios.post('/api/web-scraping/run-bot', {
        label: selectedCategory,
        url: selectedScrapingUrl,
        totalData,
      });

      // show success toast
      Swal.fire({
        icon: 'success',
        title: 'Web scraping selesai, data berhasil disimpan.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error(error.response);
      // show error toast
      Swal.fire({
        icon: 'error',
        title:
          error.response.data || 'Web scraping gagal, terjadi suatu kesalahan.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      // enable buttons
      for (const button of buttons) {
        button.classList.remove('btn-loading', 'disabled');
        if (button.getAttribute('init-disabled-state') === 'false')
          button.disabled = false;
      }
    }
  }
});

// socket.io client control
const socket = io();
socket.on('success scraping data', async (scrapedData) => {
  await axios
    .post('/api/web-scraping/', { scrapedData })
    .catch((error) => console.error(error.response));
  table.ajax.reload();
});

// button delete checked control
deleteCheckedButton.addEventListener('click', () => {
  Swal.fire({
    title: 'Anda yakin?',
    text: `${checkedDocuments.length} data akan dihapus`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !swal.isLoading(),
    preConfirm: async () => {
      // delete checked datas
      try {
        const response = await axios.post('/api/web-scraping/delete-where', {
          $or: checkedDocuments.map((id) => {
            return { _id: id };
          }),
        });

        // success notification
        Swal.fire(
          'Berhasil',
          `${response.data.deletedCount} data telah terhapus.`,
          'success',
        );

        // UI and state refresh
        table.ajax.reload();
        checkAll.checked = false;
        checkedDocuments = [];
      } catch (error) {
        return console.error(error);
      }
    },
  });
});

// download data button control
dowloadButton.addEventListener('click', () => {
  // disable buttons
  for (const button of buttons) {
    button.classList.add('btn-loading', 'disabled');
    button.setAttribute('init-disabled-state', button.disabled);
    button.disabled = true;
  }

  // loading toast
  Swal.fire({
    title: `Menyiapkan data hasil web scraping . . .`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    onOpen: () => Swal.showLoading(),
  });

  window.location.href = '/api/excel/scraped-data';

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
