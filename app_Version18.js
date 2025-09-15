// app.js
document.addEventListener('DOMContentLoaded', function(){
  // About popup logic (footer button)
  const aboutBtnFooter = document.getElementById('aboutBtnFooter');
  const aboutModalBg = document.getElementById('about-modal-bg');
  const aboutClose = document.getElementById('about-close');
  aboutBtnFooter.onclick = function() {
    aboutModalBg.style.display = "flex";
    document.body.style.overflow = "hidden";
  };
  aboutClose.onclick = function() {
    aboutModalBg.style.display = "none";
    document.body.style.overflow = "";
  };
  aboutModalBg.onclick = function(e) {
    if (e.target === aboutModalBg) {
      aboutModalBg.style.display = "none";
      document.body.style.overflow = "";
    }
  };
  document.addEventListener('keydown', function(e){
    if(e.key === "Escape" && aboutModalBg.style.display === "flex"){
      aboutModalBg.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  // Gallery & Camera button logic
  document.getElementById('galleryBtn').addEventListener('click', function() {
    document.getElementById('galleryInput').value = "";
    document.getElementById('galleryInput').click();
  }, false);

  document.getElementById('cameraBtn').addEventListener('click', function() {
    const cameraInput = document.getElementById('cameraInput');
    cameraInput.value = "";
    cameraInput.setAttribute('capture', 'user');
    cameraInput.click();
  }, false);

  document.getElementById('galleryInput').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  }, false);

  document.getElementById('cameraInput').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    document.getElementById('cameraInput').removeAttribute('capture');
  }, false);

  // --- Begin original app logic ---
  const uploadZone = document.getElementById('uploadZone');
  const originalPreview = document.getElementById('originalPreview');
  const compressedPreview = document.getElementById('compressedPreview');
  const originalInfo = document.getElementById('originalInfo');
  const compressedInfo = document.getElementById('compressedInfo');
  const qualityRange = document.getElementById('qualityRange');
  const qualityValue = document.getElementById('qualityValue');
  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  const unitRadios = document.getElementsByName('resizeUnit');
  const unitLabelW = document.getElementById('unitLabelW');
  const unitLabelH = document.getElementById('unitLabelH');
  const compressBtn = document.getElementById('compressBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetResize = document.getElementById('resetResize');
  const msg = document.getElementById('msg');
  const zoomModal = document.getElementById('zoomModal');
  const zoomImg = document.getElementById('zoomImg');
  const openCropBtn = document.getElementById('openCropBtn');
  const cropModal = document.getElementById('cropModal');
  const cropImg = document.getElementById('cropImg');
  const cropConfirmBtn = document.getElementById('cropConfirmBtn');
  const cropCancelBtn = document.getElementById('cropCancelBtn');
  const saveFilename = document.getElementById('saveFilename');
  const enableSaveAs = document.getElementById('enableSaveAs');
  const saveFormat = document.getElementById('saveFormat');
  const qualityRow = document.getElementById('qualityRow');
  const rotateBtn = document.getElementById('rotateBtn');
  const aspectLock = document.getElementById('aspectLock');
  let cropper = null;
  let originalFile = null;
  let compressedBlob = null;
  let loadedImage = null;
  let originalType = "";
  let origWidth = null, origHeight = null;
  let blockResizeSync = false;
  let lastOutMime = "";
  let rotation = 0;
  let isAspectLocked = aspectLock.checked;
  const DECIMALS = 4;
  function getDPI() { return 96; }
  function unitConvert(val, from, to) {
    if (!val) return '';
    const dpi = getDPI();
    switch(from + '-' + to) {
      case 'px-cm': return (val / dpi * 2.54).toFixed(DECIMALS);
      case 'px-inch': return (val / dpi).toFixed(DECIMALS);
      case 'cm-px': return Math.round(val * dpi / 2.54);
      case 'inch-px': return Math.round(val * dpi);
      default: return val;
    }
  }
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  aspectLock.addEventListener('change', () => { isAspectLocked = aspectLock.checked; });
  qualityRange.addEventListener('input', function() { qualityValue.textContent = this.value; });
  enableSaveAs.addEventListener("change", function() {
    if (enableSaveAs.checked) {
      saveFilename.disabled = false; saveFilename.style.opacity = "1";
    } else {
      saveFilename.disabled = true; saveFilename.style.opacity = "0.6";
    }
  });
  saveFormat.addEventListener("change", function() {
    if (saveFormat.value === "image/png") qualityRow.style.display = "none";
    else qualityRow.style.display = "";
  });
  function getSelectedUnit() {
    let selectedUnit = 'cm';
    unitRadios.forEach(radio => { if (radio.checked) selectedUnit = radio.value; });
    return selectedUnit;
  }
  function updateUnitLabels(forceAutofill) {
    let selectedUnit = getSelectedUnit();
    unitLabelW.textContent = selectedUnit;
    unitLabelH.textContent = selectedUnit;
    if (loadedImage) {
      const origW = loadedImage.width, origH = loadedImage.height;
      if (selectedUnit === 'cm') {
        resizeWidth.placeholder = unitConvert(origW, 'px', 'cm');
        resizeHeight.placeholder = unitConvert(origH, 'px', 'cm');
        if (forceAutofill) {
          resizeWidth.value = parseFloat(unitConvert(origW, 'px', 'cm')).toFixed(DECIMALS);
          resizeHeight.value = parseFloat(unitConvert(origH, 'px', 'cm')).toFixed(DECIMALS);
        }
        resizeWidth.step = "0.0001"; resizeHeight.step = "0.0001";
      } else if (selectedUnit === 'inch') {
        resizeWidth.placeholder = unitConvert(origW, 'px', 'inch');
        resizeHeight.placeholder = unitConvert(origH, 'px', 'inch');
        if (forceAutofill) {
          resizeWidth.value = parseFloat(unitConvert(origW, 'px', 'inch')).toFixed(DECIMALS);
          resizeHeight.value = parseFloat(unitConvert(origH, 'px', 'inch')).toFixed(DECIMALS);
        }
        resizeWidth.step = "0.0001"; resizeHeight.step = "0.0001";
      } else {
        resizeWidth.placeholder = origW; resizeHeight.placeholder = origH;
        if (forceAutofill) {
          resizeWidth.value = Math.round(origW); resizeHeight.value = Math.round(origH);
        }
        resizeWidth.step = "1"; resizeHeight.step = "1";
      }
    }
  }
  unitRadios.forEach(radio => radio.addEventListener('change', () => { updateUnitLabels(true); }));
  function aspectRatio() { if (!origWidth || !origHeight) return 1; return origWidth / origHeight; }
  resizeWidth.addEventListener('input', function() {
    if (blockResizeSync) return;
    blockResizeSync = true;
    let selectedUnit = getSelectedUnit();
    let w = resizeWidth.value ? parseFloat(resizeWidth.value) : null;
    if (isAspectLocked && w && origWidth && origHeight) {
      let ratio = aspectRatio(), h = w / ratio;
      if (selectedUnit === 'cm' || selectedUnit === 'inch')
        resizeHeight.value = h ? parseFloat(h).toFixed(DECIMALS) : '';
      else resizeHeight.value = h ? Math.round(h) : '';
    }
    blockResizeSync = false;
  });
  resizeHeight.addEventListener('input', function() {
    if (blockResizeSync) return;
    blockResizeSync = true;
    let selectedUnit = getSelectedUnit();
    let h = resizeHeight.value ? parseFloat(resizeHeight.value) : null;
    if (isAspectLocked && h && origWidth && origHeight) {
      let ratio = aspectRatio(), w = h * ratio;
      if (selectedUnit === 'cm' || selectedUnit === 'inch')
        resizeWidth.value = w ? parseFloat(w).toFixed(DECIMALS) : '';
      else resizeWidth.value = w ? Math.round(w) : '';
    }
    blockResizeSync = false;
  });
  resetResize.addEventListener('click', function() { if (loadedImage) { updateUnitLabels(true); } });
  function showZoom(src) { zoomImg.src = src; zoomModal.style.display = 'flex'; }
  originalPreview.addEventListener('click', () => { if (originalPreview.src) showZoom(originalPreview.src); });
  compressedPreview.addEventListener('click', () => { if (compressedPreview.src) showZoom(compressedPreview.src); });
  zoomModal.addEventListener('click', () => { zoomModal.style.display = 'none'; });
  openCropBtn.addEventListener('click', function() {
    if (!originalPreview.src) return;
    cropImg.src = originalPreview.src;
    cropModal.style.display = 'flex';
    if (cropper) { cropper.destroy(); }
    cropImg.onload = function() {
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImg, {
        aspectRatio: false, viewMode: 1, autoCropArea: 1
      });
    };
  });
  cropCancelBtn.addEventListener('click', function() {
    cropModal.style.display = 'none';
    if (cropper) cropper.destroy();
  });
  cropConfirmBtn.addEventListener('click', function() {
    if (!cropper) return;
    cropper.getCroppedCanvas().toBlob(function(blob) {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      originalPreview.src = url;
      rotation = 0;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() {
        loadedImage = img; origWidth = img.width; origHeight = img.height;
        originalInfo.innerHTML = `Format: ${blob.type.replace('image/', '').toUpperCase()}<br>Size: ${(blob.size/1024).toFixed(2)} KB`;
        resetCompressed();
        updateUnitLabels(true);
      };
      img.src = url;
      cropModal.style.display = 'none';
      if (cropper) cropper.destroy();
    }, originalType || "image/png");
  });
  rotateBtn.addEventListener('click', function() {
    if (!loadedImage) return;
    if (loadedImage.width > 3000 || loadedImage.height > 3000) {
      msg.textContent = "Warning: Large image, rotation may take time!";
    }
    rotation = (rotation + 90) % 360;
    drawRotatedImage(loadedImage, rotation, function(dataUrl, w, h) {
      originalPreview.src = dataUrl;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() {
        loadedImage = img; origWidth = img.width; origHeight = img.height;
        originalInfo.innerHTML = `Format: ${originalType.replace('image/', '').toUpperCase()}<br>Size: ${(originalFile.size/1024).toFixed(2)} KB`;
        resetCompressed(); updateUnitLabels(true); msg.textContent = "";
      };
      img.onerror = function() { msg.textContent = "Rotation failed."; };
      img.src = dataUrl;
    });
  });
  function drawRotatedImage(img, angle, cb) {
    try {
      let canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      let w = img.width, h = img.height;
      if (angle % 180 !== 0) { canvas.width = h; canvas.height = w; }
      else { canvas.width = w; canvas.height = h; }
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.drawImage(img, -w / 2, -h / 2);
      ctx.restore();
      cb(canvas.toDataURL(), canvas.width, canvas.height);
    } catch(err) { msg.textContent = "Image rotation error."; }
  }
  function resetCompressed() {
    compressedPreview.style.display = 'none';
    compressedInfo.innerHTML = '';
    downloadBtn.disabled = true;
    compressedBlob = null;
  }
  function filterSaveAsOptions(type) {
    const hide = [];
    switch(type) {
      case "heic":
      case "heif": hide.push("image/heic","image/heif","image/bmp"); break;
      case "bmp": hide.push("image/heic","image/heif"); break;
      case "jpeg": hide.push("image/heic","image/heif","image/bmp"); break;
      case "webp": hide.push("image/heic","image/heif","image/bmp"); break;
      case "avif": hide.push("image/heic","image/heif","image/bmp"); break;
      default: break;
    }
    Array.from(saveFormat.options).forEach(opt=>{
      if (hide.includes(opt.value)) opt.style.display='none';
      else opt.style.display='';
    });
  }
  async function handleFile(file) {
    msg.textContent = '';
    rotation = 0;
    aspectLock.checked = true;
    isAspectLocked = aspectLock.checked;
    let ext = (file.name||"").toLowerCase().split(".").pop();
    let type = file.type || "";
    originalType = type || ("image/" + ext);

    if (type === "image/svg+xml" || ext === "svg") {
      msg.textContent = "SVG is not supported for compress/convert.";
      originalPreview.style.display = 'none';
      compressBtn.disabled = true;
      openCropBtn.style.display = 'none';
      rotateBtn.style.display = 'none';
      originalInfo.innerHTML = '';
      resetCompressed();
      return;
    }
    if (type === "image/gif" || ext === "gif") {
      msg.textContent = "GIF is not supported for compress/convert.";
      originalPreview.style.display = 'none';
      compressBtn.disabled = true;
      openCropBtn.style.display = 'none';
      rotateBtn.style.display = 'none';
      originalInfo.innerHTML = '';
      resetCompressed();
      return;
    }
    if (type === "image/tiff" || type === "image/x-tiff" || ext === "tiff" || ext === "tif") {
      msg.textContent = "TIFF is not supported for compress/convert.";
      originalPreview.style.display = 'none';
      compressBtn.disabled = true;
      openCropBtn.style.display = 'none';
      rotateBtn.style.display = 'none';
      originalInfo.innerHTML = '';
      resetCompressed();
      return;
    }
    if (type === "image/heic" || type === "image/heif" || ext === "heic" || ext === "heif") {
      msg.textContent = "";
      try {
        let result = await heic2any({blob: file, toType: "image/jpeg", quality: 0.95});
        let blobOut = Array.isArray(result) ? result[0] : result;
        let url = URL.createObjectURL(blobOut);
        originalPreview.src = url;
        originalPreview.style.display = "block";
        compressBtn.disabled = false;
        openCropBtn.style.display = "inline-block";
        rotateBtn.style.display = "inline-block";
        loadedImage = new window.Image();
        loadedImage.crossOrigin = "anonymous";
        loadedImage.onload = function() {
          origWidth = loadedImage.width;
          origHeight = loadedImage.height;
          originalInfo.innerHTML = `Format: ${type === "image/heic" ? "HEIC" : "HEIF"}<br>Size: ${(file.size/1024).toFixed(2)} KB`;
          resetCompressed();
          updateUnitLabels(true);
        };
        loadedImage.src = url;
        originalFile = file;
        originalType = "image/jpeg";
        qualityRow.style.display = "";
        saveFormat.value = originalType;
        filterSaveAsOptions(type === "image/heic" ? "heic" : "heif");
      } catch (err) {
        msg.textContent = "HEIC/HEIF preview failed.";
      }
      return;
    }
    originalFile = file;
    if (type === "image/png" || ext === "png") {
      qualityRow.style.display = "none";
    } else {
      qualityRow.style.display = "";
    }
    document.querySelector('input[name="resizeUnit"][value="cm"]').checked = true;
    updateUnitLabels(true);
    if (type === "image/bmp" || type === "image/x-ms-bmp" || ext === "bmp") {
      saveFormat.value = "image/bmp";
      filterSaveAsOptions("bmp");
    } else if (type === "image/jpeg" || ext === "jpg" || ext === "jpeg") {
      saveFormat.value = "image/jpeg";
      filterSaveAsOptions("jpeg");
    } else if (type === "image/png" || ext === "png") {
      saveFormat.value = "image/png";
      filterSaveAsOptions("png");
    } else if (type === "image/webp" || ext === "webp") {
      saveFormat.value = "image/webp";
      filterSaveAsOptions("webp");
    } else if (type === "image/avif" || ext === "avif") {
      saveFormat.value = "image/avif";
      filterSaveAsOptions("avif");
    } else {
      saveFormat.value = "auto";
      filterSaveAsOptions("default");
    }
    try {
      const reader = new FileReader();
      reader.onload = function(e) {
        originalPreview.src = e.target.result;
        originalPreview.style.display = 'block';
        compressBtn.disabled = false;
        openCropBtn.style.display = 'inline-block';
        rotateBtn.style.display = 'inline-block';
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
          loadedImage = img;
          origWidth = img.width;
          origHeight = img.height;
          originalInfo.innerHTML = `Format: ${(type || ext).replace('image/', '').toUpperCase()}<br>Size: ${(file.size/1024).toFixed(2)} KB`;
          resetCompressed();
          updateUnitLabels(true);
        };
        img.onerror = function() {
          msg.textContent = "Image could not be loaded.";
          originalPreview.style.display = 'none';
          openCropBtn.style.display = 'none';
          rotateBtn.style.display = 'none';
          originalInfo.innerHTML = '';
          compressBtn.disabled = true;
          resetCompressed();
        };
        img.src = e.target.result;
      };
      reader.onerror = function() { msg.textContent = "File could not be read."; };
      reader.readAsDataURL(file);
    } catch(err) {
      msg.textContent = "Error loading file.";
    }
  }
  compressBtn.addEventListener('click', async function() {
    msg.textContent = "";
    if (!loadedImage) {
      msg.textContent = "No image loaded!";
      return;
    }
    let outMime = saveFormat.value === "auto" ? originalType : saveFormat.value;
    let quality = parseInt(qualityRange.value) / 100;
    let selectedUnit = getSelectedUnit();
    let width = parseFloat(resizeWidth.value) || loadedImage.width;
    let height = parseFloat(resizeHeight.value) || loadedImage.height;
    if (selectedUnit === 'cm') {
      width = unitConvert(width, 'cm', 'px');
      height = unitConvert(height, 'cm', 'px');
    } else if (selectedUnit === 'inch') {
      width = unitConvert(width, 'inch', 'px');
      height = unitConvert(height, 'inch', 'px');
    }
    width = Math.round(width); height = Math.round(height);
    let canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(loadedImage, 0, 0, width, height);
    let dataUrl, blob;
    try {
      if (outMime === "image/png") {
        dataUrl = canvas.toDataURL("image/png");
        blob = await (await fetch(dataUrl)).blob();
      } else if (outMime === "image/jpeg" || outMime === "image/jpg") {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        blob = await (await fetch(dataUrl)).blob();
      } else if (outMime === "image/webp") {
        dataUrl = canvas.toDataURL("image/webp", quality);
        blob = await (await fetch(dataUrl)).blob();
      } else if (outMime === "image/bmp") {
        dataUrl = canvas.toDataURL("image/bmp");
        blob = await (await fetch(dataUrl)).blob();
      } else if (outMime === "image/avif" && canvas.toDataURL("image/avif")) {
        try {
          dataUrl = canvas.toDataURL("image/avif", quality);
          blob = await (await fetch(dataUrl)).blob();
        } catch(e) {
          dataUrl = canvas.toDataURL("image/png");
          blob = await (await fetch(dataUrl)).blob();
          outMime = "image/png";
        }
      } else {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        blob = await (await fetch(dataUrl)).blob();
        outMime = "image/jpeg";
      }
    } catch(e) {
      msg.textContent = "Compression failed: " + e.message;
      return;
    }
    compressedBlob = blob;
    compressedPreview.src = dataUrl;
    compressedPreview.style.display = "block";
    compressedInfo.innerHTML = `Format: ${outMime.replace('image/', '').toUpperCase()}<br>Size: ${(blob.size/1024).toFixed(2)} KB`;
    downloadBtn.disabled = false;
    lastOutMime = outMime;
    msg.textContent = "Compression done!";
    setTimeout(() => msg.textContent = "", 1200);
  });
  downloadBtn.addEventListener('click', function() {
    if (!compressedBlob) {
      msg.textContent = "No compressed image to download!";
      return;
    }
    let ext = (lastOutMime === "image/jpeg") ? "jpg"
            : (lastOutMime === "image/png") ? "png"
            : (lastOutMime === "image/webp") ? "webp"
            : (lastOutMime === "image/avif") ? "avif"
            : (lastOutMime === "image/bmp") ? "bmp"
            : "jpg";
    let filename = "compressed_image";
    if (enableSaveAs.checked && saveFilename.value.trim()) filename = saveFilename.value.trim();
    filename += "." + ext;
    let url = URL.createObjectURL(compressedBlob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 200);
  });
  // --- End original app logic ---
});