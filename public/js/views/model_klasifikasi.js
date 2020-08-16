import indonesian from '/plugins/datatables/indonesian.js';
import { initCircleBar } from '/js/components/progress_bars.js';

// filters value handler
const labelFilters = document.querySelectorAll('input[name="filter-label"]');
const initialSelectedFilter = Array.from(labelFilters)
  .find((dom) => dom.getAttribute('checked') !== null)
  .getAttribute('value')
  .replace(' ', '-');

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
ctx.canvas.parentNode.style.height = '85vh';

// classification models table init
const classificationModelTable = $('#table-classification-models').DataTable({
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  ajax: `/api/datatables/clasification-model/fold-0/${initialSelectedFilter.toLowerCase()}`,
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

// filters control
for (const filter of labelFilters) {
  filter.addEventListener('input', () => {
    const selectedFilter = filter
      .getAttribute('value')
      .toLowerCase()
      .replace(' ', '-');

    classificationModelTable.ajax
      .url(`/api/datatables/clasification-model/fold-0/${selectedFilter}`)
      .load();
  });
}

// idfs list table control init
const idfsListTable = document.querySelector('#table-idfs-list');
$(idfsListTable).DataTable({
  language: indonesian,
  ajax: '/api/datatables/idf-model',
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  info: false,
  scrollCollapse: true,
  autoWidth: false,
  columns: [
    { width: '10%' },
    { width: '0' },
    { width: '40%' },
    { width: '40%' },
  ],
  columnDefs: [
    {
      searchable: false,
      targets: [0, -2],
    },
    {
      visible: false,
      targets: [-2],
    },
    {
      className: 'text-center',
      targets: '_all',
    },
  ],
});

// tf-idf models table init
$('#table-tf-idf-models').DataTable({
  language: indonesian,
  responsive: true,
  processing: true,
  deferRender: true,
  retrieve: true,
  info: false,
  ajax: '/api/datatables/tf-idf-model/fold-0',
  scrollCollapse: true,
  lengthMenu: [
    [5, 15, 30],
    [5, 15, 30],
  ],
  autoWidth: false,
  columns: [{ width: '10%' }, { width: '40%' }, { width: '40%' }],
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
