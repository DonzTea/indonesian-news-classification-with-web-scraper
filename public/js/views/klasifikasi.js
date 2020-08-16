const textareaInput = document.querySelector('#textarea-input');
const classificationResult = document.querySelector('#classification-result');
const clearButton = document.querySelector('#btn-clear');
const submitButton = document.querySelector('#btn-submit');

// clear button control
clearButton.addEventListener('click', () => {
  textareaInput.value = '';
  classificationResult.innerHTML = '';
});

// submit button control
submitButton.addEventListener('click', async () => {
  try {
    await axios.get('/api/classification/is-ready');

    classificationResult.innerHTML = '';
    const input = textareaInput.value;

    if (!input) {
      return Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Konten berita harus diisi.',
      });
    }

    // popup loading toast
    Swal.fire({
      title: 'Melakukan klasifikasi . . .',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      onOpen: () => Swal.showLoading(),
    });

    // disable buttons
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      button.classList.add('btn-loading', 'disabled');
      button.setAttribute('init-disabled-state', button.disabled);
      button.disabled = true;
    }

    // classification
    const response = await axios.post('/api/classification', {
      content: input,
    });

    if (response.status === 200) {
      // enable buttons
      for (const button of buttons) {
        button.classList.remove('btn-loading', 'disabled');
        if (button.getAttribute('init-disabled-state') === 'false')
          button.disabled = false;
      }

      // popup success toast
      Swal.fire({
        icon: 'success',
        title: 'Klasifikasi berhasil.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // set message
      let message;
      if (response.data.toLowerCase() === 'negatif') {
        message =
          'Sistem tidak dapat membuat keputusan, <span class="text-danger d-inline">probabilitas terhadap seluruh kategori bernilai 0.</span><br>Cobalah mengurangi teks berita seperlunya untuk mendapatkan hasil klasifikasi. <span id="command-shrink-content" class="text-primary">Kurangi sekarang!</span>';
      } else {
        message = `Sistem mengelompokkan berita tersebut ke dalam kategori&nbsp;<span class="text-success d-inline">${response.data}</span>.`;
      }

      classificationResult.innerHTML = message;

      if (response.data.toLowerCase() === 'negatif') {
        const shrinkContentCommand = document.querySelector(
          '#command-shrink-content',
        );
        shrinkContentCommand.addEventListener(
          'mouseover',
          () => (shrinkContentCommand.style.cursor = 'pointer'),
        );
        shrinkContentCommand.addEventListener('click', () => {
          const sentences = textareaInput.value.split('. ');
          sentences.pop();
          textareaInput.value = sentences.join('. ') + '.';
        });
      }
    } else {
      // popup error toast
      Swal.fire({
        icon: 'error',
        title: 'Terjadi suatu kesalahan.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  } catch (error) {
    // popup warning modal
    Swal.fire({
      icon: 'warning',
      title: 'Peringatan',
      html:
        'Belum ada model klasifikasi yang disimpan.<br>Mohon simpan model klasifikasi terlebih dahulu.<br>Ingin menuju halaman 10 Fold Cross Validation sekarang?',
      reverseButtons: true,
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak',
      preConfirm: () => (window.location.href = '/10-fold-cross-validation'),
    });
  }
});
