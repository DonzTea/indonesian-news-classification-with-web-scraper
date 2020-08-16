import indonesian from '/plugins/datatables/indonesian.js';
import { initCircleBar } from '/js/components/progress_bars.js';

const slugProcessName = window.location.pathname.split('/')[1];
const fold = window.location.pathname.split('/').pop();
const selectInput = document.querySelector('select[name="docsId"]');
let selectedDocumentId = selectInput.value;

// set select2 properties
$(document).ready(() => {
  $(selectInput).select2({
    language: 'id',
    theme: 'bootstrap4',
  });
});

// filters value handler
const labelFilters = document.querySelectorAll('input[name="filter-label"]');
let selectedFilter = Array.from(labelFilters)
  .find((dom) => dom.getAttribute('checked') !== null)
  .getAttribute('value')
  .replace(' ', '-');

// classification models table init
const gaussiansTable = $('#table-gaussians').DataTable({
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  ajax: `/api/datatables/gaussian-distribution/${slugProcessName}/${selectedDocumentId}/${selectedFilter.toLowerCase()}`,
  autoWidth: false,
  columns: [
    { width: '10%' },
    { width: '30%' },
    { width: '30%' },
    { width: '30%' },
  ],
  columnDefs: [
    {
      searchable: false,
      targets: [0],
    },
    {
      className: 'text-center',
      targets: '_all',
    },
  ],
});

// documents id filter control
$(selectInput).on('select2:select', () => {
  selectedDocumentId = selectInput.value;
  gaussiansTable.ajax
    .url(
      `/api/datatables/gaussian-distribution/${slugProcessName}/${selectedDocumentId}/${selectedFilter.toLowerCase()}`,
    )
    .load();
});

// filters control
for (const filter of labelFilters) {
  filter.addEventListener('input', () => {
    selectedFilter = filter
      .getAttribute('value')
      .toLowerCase()
      .replace(' ', '-');
    gaussiansTable.ajax
      .url(
        `/api/datatables/gaussian-distribution/${slugProcessName}/${selectedDocumentId}/${selectedFilter}`,
      )
      .load();
  });
}

// probabilities table init
$('#table-probabilities').DataTable({
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  lengthChange: false,
  searching: false,
  bSort: false,
  paging: false,
  info: false,
  ajax: `/api/datatables/probability/${slugProcessName}/${fold}`,
  columnDefs: [
    {
      className: 'text-center border-right',
      targets: [0],
    },
    {
      className: 'text-center',
      targets: '_all',
    },
  ],
});

// classification results table init
$('#table-classification-results').DataTable({
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  lengthChange: false,
  searching: false,
  bSort: false,
  paging: false,
  info: false,
  ajax: `/api/datatables/classification-result/${slugProcessName}/${fold}`,
  columnDefs: [
    {
      className: 'text-center border-right',
      targets: [0],
    },
    {
      className: 'text-center',
      targets: '_all',
    },
  ],
});

// confusion matrix table init
$('#table-confusion-matrix').DataTable({
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  lengthChange: false,
  searching: false,
  bSort: false,
  paging: false,
  info: false,
  ajax: `/api/datatables/confusion-matrix/${slugProcessName}/${fold}`,
  autoWidth: false,
  columnDefs: [
    {
      className: 'text-center border-right',
      responsivePriority: 1,
      targets: [0],
    },
    {
      className: 'text-center',
      responsivePriority: 10001,
      targets: '_all',
    },
  ],
});

// accuracy circle bar
const accuracyBarDOM = document.querySelector('#accuracy-circle-bar');
const accuracyBar = initCircleBar(accuracyBarDOM, 'rgb(69,170,242)', '1rem');
accuracyBar.animate(parseFloat(accuracyBarDOM.getAttribute('value')) / 100);

// recall circle bar
const recallBarDOM = document.querySelector('#recall-circle-bar');
const recallBar = initCircleBar(recallBarDOM, 'rgb(43,203,186)', '1rem');
recallBar.animate(parseFloat(recallBarDOM.getAttribute('value')) / 100);

// precision circle bar
const precisionBarDOM = document.querySelector('#precision-circle-bar');
const precisionBar = initCircleBar(precisionBarDOM, 'rgb(23,162,184)', '1rem');
precisionBar.animate(parseFloat(precisionBarDOM.getAttribute('value')) / 100);

// f1Score circle bar
const f1ScoreBarDOM = document.querySelector('#f1-score-circle-bar');
const f1ScoreBar = initCircleBar(f1ScoreBarDOM, 'rgb(70,127,207)', '1rem');
f1ScoreBar.animate(parseFloat(f1ScoreBarDOM.getAttribute('value')) / 100);

// extract data
const color = Chart.helpers.color;
const labels = Array.from(labelFilters).map((dom) => dom.getAttribute('value'));
const accuracies = labels.map((label) =>
  parseFloat(
    document
      .querySelector(
        `input[name="accuracy-detail"][label="${label.toLowerCase()}"]`,
      )
      .getAttribute('value'),
  ),
);
const recalls = labels.map((label) =>
  parseFloat(
    document
      .querySelector(
        `input[name="recall-detail"][label="${label.toLowerCase()}"]`,
      )
      .getAttribute('value'),
  ),
);
const precisions = labels.map((label) =>
  parseFloat(
    document
      .querySelector(
        `input[name="precision-detail"][label="${label.toLowerCase()}"]`,
      )
      .getAttribute('value'),
  ),
);
const f1Scores = labels.map((label) =>
  parseFloat(
    document
      .querySelector(
        `input[name="f1-score-detail"][label="${label.toLowerCase()}"]`,
      )
      .getAttribute('value'),
  ),
);

// performance detail chart data
const horizontalBarChartData = {
  labels,
  datasets: [
    {
      label: 'Akurasi',
      backgroundColor: color('rgb(69,170,242)').alpha(0.5).rgbString(),
      borderColor: 'rgb(69,170,242)',
      data: accuracies,
    },
    {
      label: 'Recall',
      backgroundColor: color('rgb(43,203,186)').alpha(0.5).rgbString(),
      borderColor: 'rgb(43,203,186)',
      data: recalls,
    },
    {
      label: 'Precision',
      backgroundColor: color('rgb(23,162,184)').alpha(0.5).rgbString(),
      borderColor: 'rgb(23,162,184)',
      data: precisions,
    },
    {
      label: 'F1-Score',
      backgroundColor: color('rgb(70,127,207)').alpha(0.5).rgbString(),
      borderColor: 'rgb(70,127,207)',
      data: f1Scores,
    },
  ],
};

// render performance detail chart
const ctx = document.getElementById('canvas').getContext('2d');
new Chart(ctx, {
  type: 'horizontalBar',
  data: horizontalBarChartData,
  options: {
    elements: {
      rectangle: {
        borderWidth: 2,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      position: 'bottom',
    },
    title: {
      display: false,
    },
    scales: {
      xAxes: [
        {
          ticks: {
            suggestedMin: 0,
            suggestedMax: 100,
          },
        },
      ],
    },
  },
});
ctx.canvas.parentNode.style.height = '75vh';
