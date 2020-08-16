import { easingScrollTo } from '/js/components/easing_scroll.js';
import { initCircleBar } from '/js/components/progress_bars.js';

// reload page when it's accessed via browser's back button
window.addEventListener('pageshow', (event) => {
  const historyTraversal =
    event.persisted ||
    (typeof window.performance != 'undefined' &&
      window.performance.navigation.type === 2);
  if (historyTraversal) window.location.reload();
});

// DOM elements
const runButton = document.querySelector('#btn-run');
const crossValidationContainer = document.querySelector(
  '#container-cross-validation',
);
const detailContainers = document.querySelectorAll(
  'div[name="detail-container"]',
);
const foldCircleBarsDOM = document.querySelectorAll(
  'div[name="fold-circle-bar"]',
);
const accuracyCircleBarsDOM = document.querySelectorAll(
  'div[name="multi-testing-accuracy"]',
);
const f1ScoreCircleBarsDOM = document.querySelectorAll(
  'div[name="multi-testing-f1-score"]',
);
const recallCircleBarsDOM = document.querySelectorAll(
  'div[name="multi-testing-recall"]',
);
const precisionCircleBarsDOM = document.querySelectorAll(
  'div[name="multi-testing-precision"]',
);
const multiTestingButtonContainer = document.querySelector(
  '#container-btn-multi-testing',
);
const multiTestingButton = document.querySelector('#btn-multi-testing');
const multiTestingProcessContainer = document.querySelector(
  '#container-multi-testing-process',
);
const multiTestingButtonsContainers = document.querySelectorAll(
  'div[name="container-multi-testing-buttons"]',
);
const badges = document.querySelectorAll('span.badge');
const multiTestingDetailButtons = document.querySelectorAll(
  'button[name="btn-multi-testing-detail"]',
);
const saveModelButtons = document.querySelectorAll(
  'button[name="btn-save-model"]',
);

// init circle bars
const foldCircleBars = Array.from(foldCircleBarsDOM).map((barDOM) =>
  initCircleBar(barDOM, 'rgb(69,170,242)'),
);
const accuracyCircleBars = Array.from(accuracyCircleBarsDOM).map((barDOM) =>
  initCircleBar(barDOM, 'rgb(69,170,242)'),
);
const recallCircleBars = Array.from(recallCircleBarsDOM).map((barDOM) =>
  initCircleBar(barDOM, 'rgb(43,203,186)'),
);
const precisionCircleBars = Array.from(precisionCircleBarsDOM).map((barDOM) =>
  initCircleBar(barDOM, 'rgb(23,162,184)'),
);
const f1ScoreCircleBars = Array.from(f1ScoreCircleBarsDOM).map((barDOM) =>
  initCircleBar(barDOM, 'rgb(70,127,207)'),
);

// init circle bars animation
for (const [index, bar] of foldCircleBars.entries()) {
  bar.animate(
    parseFloat(foldCircleBarsDOM[index].getAttribute('accuracy')) / 100,
  );
  accuracyCircleBars[index].animate(
    parseFloat(accuracyCircleBarsDOM[index].getAttribute('value')) / 100,
  );
  recallCircleBars[index].animate(
    parseFloat(recallCircleBarsDOM[index].getAttribute('value')) / 100,
  );
  precisionCircleBars[index].animate(
    parseFloat(precisionCircleBarsDOM[index].getAttribute('value')) / 100,
  );
  f1ScoreCircleBars[index].animate(
    parseFloat(f1ScoreCircleBarsDOM[index].getAttribute('value')) / 100,
  );
}

// refresh UI to initial state
const refresh = () => {
  $(multiTestingButtonContainer).collapse('hide');
  $(multiTestingProcessContainer).collapse('hide');

  for (const [index, bar] of foldCircleBars.entries()) {
    bar.animate(0);
    accuracyCircleBars[index].animate(0);
    recallCircleBars[index].animate(0);
    precisionCircleBars[index].animate(0);
    f1ScoreCircleBars[index].animate(0);
    saveModelButtons[index].classList.add('d-none');
    detailContainers[index].classList.remove('text-center');
    detailContainers[index].classList.add('text-justify');
    detailContainers[index].innerHTML =
      'Detail proses dapat dilihat setelah proses 10 fold cross validation selesai.';
    $(multiTestingButtonsContainers[index]).collapse('hide');
  }
};

// socket.io client control
const socket = io();

// socket on cross validation control
socket.on('cross validation', (performance) => {
  // animate circle bars
  foldCircleBarsDOM[performance.fold_number - 1].setAttribute(
    'accuracy',
    performance.overall_accuracy,
  );
  foldCircleBars[performance.fold_number - 1].animate(
    performance.overall_accuracy / 100,
  );
});

// socket on multi testing control
socket.on('multi testing', (performance) => {
  // animate circle bars
  accuracyCircleBarsDOM[performance.fold_number - 1].setAttribute(
    'value',
    performance.overall_accuracy,
  );
  accuracyCircleBars[performance.fold_number - 1].animate(
    performance.overall_accuracy / 100,
  );
  recallCircleBarsDOM[performance.fold_number - 1].setAttribute(
    'value',
    performance.avg_recall,
  );
  recallCircleBars[performance.fold_number - 1].animate(
    performance.avg_recall / 100,
  );
  precisionCircleBarsDOM[performance.fold_number - 1].setAttribute(
    'value',
    performance.avg_precision,
  );
  precisionCircleBars[performance.fold_number - 1].animate(
    performance.avg_precision / 100,
  );
  f1ScoreCircleBarsDOM[performance.fold_number - 1].setAttribute(
    'value',
    performance.avg_f1_score,
  );
  f1ScoreCircleBars[performance.fold_number - 1].animate(
    performance.avg_f1_score / 100,
  );
});

// run button control
runButton.addEventListener('click', async () => {
  try {
    // check if system have features extraction result
    const response = await axios.get('/api/10-fold-cross-validation/is-ready');
    if (!response.data) {
      // warning modal
      return Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        html:
          'Hasil ekstraksi fitur tidak ditemukan.<br>' +
          'Untuk melakukan 10 fold cross validation,<br>' +
          'proses ekstraksi fitur harus dilakukan terlebih dulu.<br>' +
          'Pergi ke halaman ekstraksi fitur sekarang?',
        reverseButtons: true,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Tidak',
      }).then((result) => {
        if (result.value) {
          window.location.href = '/ekstraksi-fitur';
        }
      });
    }
  } catch (error) {
    console.error(error);
    return;
  }

  const modalResponse = await Swal.fire({
    icon: 'question',
    title: 'Mulai 10 Fold Cross Validation?',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    reverseButtons: true,
  });

  if (modalResponse.value) {
    // disable button
    runButton.classList.add('btn-loading', 'disabled');
    runButton.disabled = true;

    // refresh UI
    refresh();

    // loading toast
    Swal.fire({
      title: 'Melakukan 10 fold cross validation . . .',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      onOpen: () => Swal.showLoading(),
    });

    // cross validation
    try {
      const crossValidationResponse = await axios.post(
        '/api/10-fold-cross-validation',
      );

      // slide to cross validation container
      easingScrollTo(crossValidationContainer);

      // set folds detail
      for (const performance of crossValidationResponse.data) {
        detailContainers[performance.fold_number - 1].classList.remove(
          'text-justify',
        );
        detailContainers[performance.fold_number - 1].classList.add(
          'text-center',
        );
        detailContainers[
          performance.fold_number - 1
        ].innerHTML = `<a href="/hasil-cross-validation/fold-${performance.fold_number}">Detail</a>`;
      }

      // show success toast
      Swal.fire({
        icon: 'success',
        title: '10 fold cross validation telah selesai.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // show result container
      $(multiTestingButtonContainer).collapse('show');
    } catch (error) {
      console.error(error.response);
      // show error toast
      Swal.fire({
        icon: 'error',
        title: '10 fold cross validation gagal dilakukan.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      // enable button
      runButton.classList.remove('btn-loading', 'disabled');
      runButton.disabled = false;
    }
  }
});

// multi testing detail buttons control
for (const button of multiTestingDetailButtons) {
  button.addEventListener(
    'click',
    () =>
      (window.location.href = `/hasil-testing/fold-${button.getAttribute(
        'fold-number',
      )}`),
  );
}

// multi testing button control
multiTestingButton.addEventListener('click', async () => {
  const modalResponse = await Swal.fire({
    icon: 'question',
    title: 'Mulai Multi Testing?',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    reverseButtons: true,
  });

  if (modalResponse.value) {
    // disable run button
    runButton.classList.add('btn-loading', 'disabled');
    runButton.disabled = true;

    // show container
    $(multiTestingProcessContainer).collapse('show');
    $(multiTestingButtonContainer).collapse('hide');
    $(multiTestingButtonContainer).on('hidden.bs.collapse', () => {
      easingScrollTo(multiTestingProcessContainer);
    });

    // loading toast
    Swal.fire({
      title: 'Proses multi testing sedang berjalan . . .',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      onOpen: () => Swal.showLoading(),
    });

    // multi testing
    try {
      const response = await axios.post(
        '/api/10-fold-cross-validation/multi-testing',
      );

      // show success toast
      Swal.fire({
        icon: 'success',
        title: 'Proses multi testing telah selesai.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // adjust badge and save model buttons
      const { performances, bestFolds } = response.data;
      for (const [index, performance] of performances.entries()) {
        // set rank badges
        badges[performance.fold_number - 1].innerText = '#' + (index + 1);
        badges[performance.fold_number - 1].setAttribute(
          'data-original-title',
          `Peringkat ${index + 1}<br>Akurasi Tertinggi`,
        );

        // show badge and buttons
        $(multiTestingButtonsContainers[index]).collapse('show');

        // show save model button for best fold
        if (bestFolds.includes(index + 1))
          saveModelButtons[index].classList.remove('d-none');
      }

      // show container
      $(multiTestingProcessContainer).collapse('show');
    } catch (error) {
      console.error(error.response);
      // show error toast
      Swal.fire({
        icon: 'error',
        title: 'Proses multi testing gagal dilakukan.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      // enable run button
      runButton.classList.remove('btn-loading', 'disabled');
      runButton.disabled = false;
    }
  }
});

// save model buttons control
for (const [index, button] of saveModelButtons.entries()) {
  button.addEventListener('click', async () => {
    // confirmation modal
    const modalResponse = await Swal.fire({
      icon: 'question',
      title: 'Yakin Ingin Menyimpan\nModel Klasifikasi?',
      text: 'Hasil ekstraksi fitur dan 10 fold cross validation akan dihapus.',
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak',
      showCancelButton: true,
      reverseButtons: true,
    });

    if (modalResponse.value) {
      // loading modal
      Swal.fire({
        title: 'Menyimpan Model Klasifikasi . . .',
        allowEscapeKey: false,
        allowOutsideClick: false,
        onOpen: () => Swal.showLoading(),
      });

      // save model
      const response = await axios.post(
        '/api/10-fold-cross-validation/save-model',
        { fold_number: index + 1 },
      );

      // close modal
      Swal.close();

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
            easingScrollTo();
          },
        });
      } else {
        // popup error modal
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal menyimpan model klasifikasi.',
        });
      }
    }
  });
}
