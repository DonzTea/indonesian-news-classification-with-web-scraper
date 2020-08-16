import { easingScrollTo } from '/js/components/easing_scroll.js';

// DOM elements
const totalIndividuRadio = document.querySelectorAll(
  'input[name="total-individu"]',
);
const totalPopulationRange = document.querySelector('#range-total-population');
const crossoverRateRange = document.querySelector('#range-crossover-rate');
const mutationRateRange = document.querySelector('#range-mutation-rate');
const totalPopulationInput = document.querySelector('#input-total-population');
const crossoverRateInput = document.querySelector('#input-crossover-rate');
const mutationRateInput = document.querySelector('#input-mutation-rate');
const runButton = document.querySelector('#btn-run');
const localOptimumsDataDOM = document.querySelectorAll(
  'input[name="local-optimum"]',
);
const chartDOM = document.querySelector('#chart');
const chartCard = document.querySelector('#card-chart');
const benchmarkCard = document.querySelector('#card-benchmark');
const bestIndividualText = document.querySelector('#text-best-individual');
const bestPopulationText = document.querySelector('#text-best-population');
const accuracyTextBefore = document.querySelector('#text-accuracy-before');
const accuracyTextAfter = document.querySelector('#text-accuracy-after');
const totalFeaturesTextBefore = document.querySelector(
  '#text-total-features-before',
);
const totalFeaturesTextAfter = document.querySelector(
  '#text-total-features-after',
);
const executionTimeTextBefore = document.querySelector(
  '#text-execution-time-before',
);
const executionTimeTextAfter = document.querySelector(
  '#text-execution-time-after',
);
const saveModelButtonContainer = document.querySelector('#container-btn-save');
const conclusionText = document.querySelector('#text-conclusion');
const saveModelButton = document.querySelector('#btn-save');

const maxPopulation = parseFloat(totalPopulationInput.getAttribute('max'));
const minPopulation = parseFloat(totalPopulationInput.getAttribute('min'));
const maxCrossoverRate = parseFloat(crossoverRateInput.getAttribute('max'));
const minCrossoverRate = parseFloat(crossoverRateInput.getAttribute('min'));
const maxMutationRate = parseFloat(mutationRateInput.getAttribute('max'));
const minMutationRate = parseFloat(mutationRateInput.getAttribute('min'));

// variables input control
let totalIndividu = Array.from(totalIndividuRadio).find(
  (radio) => radio.checked,
).value;
for (const radio of totalIndividuRadio) {
  radio.addEventListener('input', () => {
    totalIndividu = Array.from(totalIndividuRadio).find(
      (radio) => radio.checked,
    ).value;
  });
}

totalPopulationRange.addEventListener('input', () => {
  totalPopulationInput.value = totalPopulationRange.value;
});

totalPopulationInput.addEventListener('input', () => {
  let input = parseFloat(totalPopulationInput.value || minPopulation);

  if (input > maxPopulation) {
    input = maxPopulation;
  } else if (input < minPopulation) {
    input = minPopulation;
  }

  totalPopulationInput.value = input;
  totalPopulationRange.value = input;
});

crossoverRateRange.addEventListener('input', () => {
  crossoverRateInput.value = crossoverRateRange.value;
});

crossoverRateInput.addEventListener('input', () => {
  let input = parseFloat(crossoverRateInput.value || minCrossoverRate);

  if (input > maxCrossoverRate) {
    input = maxCrossoverRate;
  } else if (input < minCrossoverRate) {
    input = minCrossoverRate;
  }

  crossoverRateInput.value = input;
  crossoverRateRange.value = input;
});

mutationRateRange.addEventListener('input', () => {
  mutationRateInput.value = mutationRateRange.value;
});

mutationRateInput.addEventListener('input', () => {
  let input = parseFloat(mutationRateInput.value || minMutationRate);

  if (input > maxMutationRate) {
    input = maxMutationRate;
  } else if (input < minMutationRate) {
    input = minMutationRate;
  }

  mutationRateInput.value = input;
  mutationRateRange.value = input;
});

// chart helper function for transparentizing color
const transparentize = (color, opacity) =>
  Chart.helpers
    .color(color)
    .alpha(opacity === undefined ? 0.5 : 1 - opacity)
    .rgbString();

// chart init
const totalLocalOptimumData = Array.from(localOptimumsDataDOM).length;
const chart = new Chart(chartDOM, {
  type: 'line',
  data: {
    labels:
      totalLocalOptimumData > 0
        ? Array.from(localOptimumsDataDOM).map(
            (localOptimumData) =>
              `Populasi ke ${localOptimumData.getAttribute(
                'generation-number',
              )}, individu ke ${localOptimumData.getAttribute(
                'individu-number',
              )}`,
          )
        : [],
    datasets: [
      {
        backgroundColor: transparentize('rgb(69,170,242)'),
        borderColor: 'rgb(69,170,242)',
        pointBackgroundColor:
          totalLocalOptimumData > 0
            ? Array.from(localOptimumsDataDOM).map((localOptimumData) =>
                localOptimumData.getAttribute('is-best') === 'true'
                  ? 'rgb(28,51,83)'
                  : transparentize('rgb(69,170,242)'),
              )
            : [],
        data:
          totalLocalOptimumData > 0
            ? Array.from(localOptimumsDataDOM).map((localOptimumData) =>
                localOptimumData.getAttribute('fitness'),
              )
            : [],
        label: 'Nilai Fitness',
        fill: 'start',
      },
    ],
  },
  options: {
    responsive: true,
    tooltips: {
      yAlign: 'top',
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
    plugins: {
      filler: {
        propagate: false,
      },
    },
    legend: {
      display: false,
    },
    scales: {
      xAxes: [
        {
          ticks: {
            display: false,
          },
          scaleLabel: {
            display: true,
            labelString: 'Nilai Fitness Local Optimum dari Populasi',
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            suggestedMin: 0,
            suggestedMax: 100,
          },
        },
      ],
    },
  },
});

// refresh UI
const refresh = () => {
  // reset chart data
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.data.datasets[0].pointBackgroundColor = [];
  chart.update();

  // hide benchmark card and save model button
  $(benchmarkCard).collapse('hide');
  $(conclusionText).collapse('hide');
  $(saveModelButtonContainer).collapse('hide');
};

// socket.io client control
const socket = io();
socket.on('local optimum resolved', (localOptimum) => {
  // update chart
  chart.data.labels.push(
    `Populasi ke ${localOptimum.generation_number}, individu ke ${localOptimum.individu_number}`,
  );
  chart.data.datasets[0].data.push(localOptimum.fitness);
  chart.update();
});

// run button control
runButton.addEventListener('click', async () => {
  try {
    // check is classification model exist
    await axios.get('/api/classification/is-ready');

    const modalResponse = await Swal.fire({
      icon: 'question',
      title: 'Mulai Seleksi Fitur?',
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      showCancelButton: true,
      reverseButtons: true,
    });

    if (modalResponse.value) {
      // disable button while processing
      runButton.classList.add('btn-loading', 'disabled');
      runButton.disabled = true;

      // show loading toast
      Swal.fire({
        title: 'Melakukan proses evolusi genetika . . .',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        onOpen: () => Swal.showLoading(),
      });

      // refresh UI
      refresh();

      // slide to chart card
      easingScrollTo(chartCard);

      // extract data
      const totalPopulation = parseFloat(totalPopulationInput.value);
      const crossoverRate = parseFloat(crossoverRateInput.value);
      const mutationRate = parseFloat(mutationRateInput.value);

      // features selection
      try {
        const evolutionaryResponse = await axios.post(
          '/api/features-selection',
          {
            totalPopulation,
            totalIndividu,
            crossoverRate,
            mutationRate,
          },
        );

        // set point color of best individual ever in chart
        chart.data.datasets[0].pointBackgroundColor[
          evolutionaryResponse.data.bestGenerationNumber - 1
        ] = 'rgb(28,51,83)';
        chart.update();

        // show success toast
        Swal.fire({
          icon: 'success',
          title: 'Proses evolusi genetika telah selesai.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          onClose: async () => {
            // set data to UI
            bestIndividualText.innerText =
              evolutionaryResponse.data.bestIndividuNumber;
            bestPopulationText.innerText =
              evolutionaryResponse.data.bestGenerationNumber;

            const originalAccuracy =
              evolutionaryResponse.data.originalData.accuracy;
            const newAccuracy = evolutionaryResponse.data.newData.accuracy;
            const originalTotalFeatures =
              evolutionaryResponse.data.originalData.totalFeatures;
            const newTotalFeatures =
              evolutionaryResponse.data.newData.totalFeatures;
            const originalExecutionTime =
              evolutionaryResponse.data.originalData.testing_execution_time;
            const newExecutionTime =
              evolutionaryResponse.data.newData.testing_execution_time;
            const originalExecutionTimeString =
              evolutionaryResponse.data.originalData.executionTimeString;
            const newExecutionTimeString =
              evolutionaryResponse.data.newData.executionTimeString;

            accuracyTextBefore.innerText = originalAccuracy + ' %';
            accuracyTextAfter.innerText = newAccuracy + ' %';
            totalFeaturesTextBefore.innerText = originalTotalFeatures;
            totalFeaturesTextAfter.innerText = newTotalFeatures;
            executionTimeTextBefore.innerText = originalExecutionTimeString;
            executionTimeTextAfter.innerText = newExecutionTimeString;

            // show conclusion
            let accuracyReview = '<u><b>Akurasi</b></u> ';
            if (newAccuracy === originalAccuracy) {
              accuracyReview += 'tidak mengalami perubahan';
            } else {
              accuracyReview += `${
                newAccuracy > originalAccuracy ? 'meningkat' : 'menurun'
              } sebesar <b><span class="${
                newAccuracy > originalAccuracy ? 'text-success' : 'text-danger'
              }">${evolutionaryResponse.data.comparisonResult.accuracy.toFixed(
                2,
              )} %</span></b>`;
            }
            let totalFeaturesReview = 'jumlah <u><b>fitur kata</b></u> ';
            if (newTotalFeatures === originalTotalFeatures) {
              totalFeaturesReview += 'tidak mengalami perubahan';
            } else {
              totalFeaturesReview += `${
                newTotalFeatures > originalTotalFeatures
                  ? 'bertambah'
                  : 'berkurang'
              } sebanyak <b><span class="${
                newTotalFeatures > originalTotalFeatures
                  ? 'text-danger'
                  : 'text-success'
              }">${
                evolutionaryResponse.data.comparisonResult.totalFeatures
              }</span></b> kata`;
            }
            let executionTimeReview = 'lama <u><b>waktu pengujian</b></u> ';
            if (newExecutionTime === originalExecutionTime) {
              executionTimeReview += 'tidak mengalami perubahan';
            } else {
              executionTimeReview += `lebih ${
                newExecutionTime > originalExecutionTime ? 'lama' : 'singkat'
              } <b><span class="${
                newExecutionTime > originalExecutionTime
                  ? 'text-danger'
                  : 'text-success'
              }">&plusmn; ${
                evolutionaryResponse.data.comparisonResult.executionTimeString
              }</span></b>`;
            }
            const conclusion = `<b>Kesimpulan :</b> ${accuracyReview}, ${totalFeaturesReview}, sementara ${executionTimeReview}.`;
            $(conclusionText).collapse('show');
            conclusionText.innerHTML = conclusion;

            if (newAccuracy >= originalAccuracy)
              $(saveModelButtonContainer).collapse('show');

            // show benchmark card
            $(benchmarkCard).collapse('show');

            // slide to benchmark card
            easingScrollTo(benchmarkCard, 1500);
          },
        });

        // enable button
        runButton.classList.remove('btn-loading', 'disabled');
        runButton.disabled = false;
      } catch (error) {
        console.error(error);
        // popup warning modal and redirect
        const { message, url } = error.response.data;
        return Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          html: message,
          reverseButtons: true,
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Tidak',
          preConfirm: () => (window.location.href = url),
        });
      }
    }
  } catch (error) {
    Swal.fire({
      icon: 'warning',
      title: 'Peringatan',
      html:
        'Belum ada model klasifikasi yang disimpan.<br>Mohon lakukan proses pelatihan (Training) terlebih dahulu.<br>Ingin menuju halaman 10 fold cross validation sekarang?',
      reverseButtons: true,
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak',
      preConfirm: () => (window.location.href = '/10-fold-cross-validation'),
    });
  }
});

// save model button control
saveModelButton.addEventListener('click', async () => {
  const modalResponse = await Swal.fire({
    icon: 'question',
    title: 'Simpan Model Klasifikasi\ndari Hasil Seleksi Fitur?',
    html:
      'Model klasifikasi akan diperbarui,<br>data hasil seleksi fitur akan dihapus.',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    reverseButtons: true,
  });

  if (modalResponse.value) {
    // disable buttons
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      button.classList.add('btn-loading', 'disabled');
      button.setAttribute('init-disabled-state', button.disabled);
      button.disabled = true;
    }

    // show loading toast
    Swal.fire({
      title: 'Menyimpan model klasifikasi . . .',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      onOpen: () => Swal.showLoading(),
    });

    const response = await axios.post('/api/features-selection/update-model');
    if (response.status === 200) {
      // popup success modal
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        html:
          'Model klasifikasi berhasil disimpan.<br>Ingin menuju halaman model klasifikasi?',
        confirmButtonText: 'Ya',
        cancelButtonText: 'Tidak',
        showCancelButton: true,
        reverseButtons: true,
        preConfirm: () => (window.location.href = '/model-klasifikasi'),
        onClose: () => {
          refresh();

          // enable buttons
          for (const button of buttons) {
            button.classList.remove('btn-loading', 'disabled');
            if (button.getAttribute('init-disabled-state') === 'false')
              button.disabled = false;
          }

          easingScrollTo();
        },
      });
    } else {
      // show error toast
      Swal.fire({
        icon: 'error',
        title: 'Model klasifikasi gagal disimpan, terjadi suatu kesalahan.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      refresh();

      // enable buttons
      runButton.classList.remove('btn-loading', 'disabled');
      runButton.disabled = false;
      saveModelButton.classList.remove('btn-loading', 'disabled');
      saveModelButton.disabled = false;

      easingScrollTo();
    }
  }
});
