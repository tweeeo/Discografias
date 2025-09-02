(() => {
  "use strict";

  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const uploadInput = document.getElementById("upload");
  const downloadBtn = document.getElementById("download");

  // --- Plantilla base ---
  const plantilla = new Image();
  plantilla.src = "static/plantilla.png"; // tu imagen de plantilla (1000x1000)

  // --- Área negra (ajústala si lo necesitas) ---
  const CLIP = { x: 0, y: 0, w: 500, h: 500, r: 15 };

  // --- Estado de la imagen del usuario ---
  let userImage = null;
  const img = { x: CLIP.x, y: CLIP.y, w: CLIP.w, h: CLIP.h };
  const state = { dragging: false, resizing: false, offX: 0, offY: 0 };

  let initialImgX, initialImgY, initialImgW, initialImgH; // Declared here

  function roundedPath(rect, context) {
    const { x, y, w, h, r } = rect;
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clip del área negra
    ctx.save();
    roundedPath(CLIP, ctx);
    ctx.clip();

    if (userImage) {
      ctx.drawImage(userImage, img.x, img.y, img.w, img.h);
    }
    ctx.restore();

    // Plantilla por encima
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    // Text Rendering
    if (textState.content) {
      ctx.font = textState.font;
      ctx.fillStyle = textState.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textState.content, textState.x, textState.y);
    }
  }

  plantilla.addEventListener("load", draw);
  plantilla.addEventListener("error", () => {
    alert("La plantilla no se pudo cargar. Verifique que el archivo 'plantilla.png' se encuentra en la carpeta 'static'.");
  });

  // --- Carga de imagen del usuario ---
  uploadInput.addEventListener("change", (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const loaded = new Image();
      loaded.onload = () => {
        userImage = loaded;

        // Ajuste inicial para encajar dentro del clip manteniendo proporción
        const clipRatio = CLIP.w / CLIP.h;
        const imgRatio = loaded.width / loaded.height;

        if (imgRatio >= clipRatio) {
          // más ancha: ajusta a alto
          img.h = CLIP.h;
          img.w = Math.round((loaded.width / loaded.height) * img.h);
        } else {
          // más alta: ajusta a ancho
          img.w = CLIP.w;
          img.h = Math.round((loaded.height / loaded.width) * img.w);
        }

        img.x = Math.round(CLIP.x + (CLIP.w - img.w) / 2);
        img.y = Math.round(CLIP.y + (CLIP.h - img.h) / 2);

        // Store initial image state
        initialImgX = img.x;
        initialImgY = img.y;
        initialImgW = img.w;
        initialImgH = img.h;

        draw();
        
      };
      loaded.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // --- Interacción (mover / redimensionar) ---
  function isOnHandle(mx, my) {
    const s = 12; // tamaño del “handle”
    return (
      mx >= img.x + img.w - s &&
      mx <= img.x + img.w + s &&
      my >= img.y + img.h - s &&
      my <= img.y + img.h + s
    );
  }

  canvas.addEventListener("mousedown", (e) => {
    if (!userImage) return;
    const mx = e.offsetX;
    const my = e.offsetY;

    if (isOnHandle(mx, my)) {
      state.resizing = true;
      return;
    }

    if (mx >= img.x && mx <= img.x + img.w && my >= img.y && my <= img.y + img.h) {
      state.dragging = true;
      state.offX = mx - img.x;
      state.offY = my - img.y;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!userImage) return;
    const mx = e.offsetX;
    const my = e.offsetY;

    if (state.resizing) {
      // redimensiona manteniendo proporción
      const newW = Math.max(20, mx - img.x);
      const ratio = userImage.height / userImage.width;
      const newH = Math.max(20, Math.round(newW * ratio));
      img.w = newW;
      img.h = newH;
      draw();
      return;
    }

    if (state.dragging) {
      img.x = mx - state.offX;
      img.y = my - state.offY;
      draw();
    }
  });

  function stop() {
    state.dragging = false;
    state.resizing = false;
  }
  canvas.addEventListener("mouseup", stop);
  canvas.addEventListener("mouseleave", stop);

  // --- Descargar PNG ---
  downloadBtn.addEventListener("click", () => {
    const newCanvas = document.createElement("canvas");
    newCanvas.width = 1000;
    newCanvas.height = 1000;
    const newCtx = newCanvas.getContext("2d");
    const scale = newCanvas.width / canvas.width;

    const scaledClip = {
        x: CLIP.x * scale,
        y: CLIP.y * scale,
        w: CLIP.w * scale,
        h: CLIP.h * scale,
        r: CLIP.r * scale
    };

    newCtx.save();
    roundedPath(scaledClip, newCtx);
    newCtx.clip();

    if (userImage) {
        newCtx.drawImage(userImage, img.x * scale, img.y * scale, img.w * scale, img.h * scale);
    }

    newCtx.restore();

    newCtx.drawImage(plantilla, 0, 0, newCanvas.width, newCanvas.height);

    // Draw text on newCanvas
    if (textState.content) {
      newCtx.font = `bold italic ${23 * scale}px Programme`; // Scale font size
      newCtx.fillStyle = textState.color;
      newCtx.textAlign = "center";
      newCtx.textBaseline = "middle";
      newCtx.fillText(textState.content, textState.x * scale, textState.y * scale); // Scale coordinates
    }

    // Sanitize filename
    function sanitizeFilename(text) {
      return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    const artistName = sanitizeFilename(textInput.value || "artista"); // Use "artista" if text input is empty
    const filename = `discografia-de-${artistName}.png`;

    const a = document.createElement("a");
    a.download = filename;
    a.href = newCanvas.toDataURL("image/png");
    a.click();
  });

  

  

  // --- Text Rendering ---
  const textInput = document.getElementById("text-input");
  const textState = {
    content: "Artista",
    x: 250,
    y: 475,
    font: "bold italic 23px Programme",
    color: "black"
  };

  // Set initial text input value
  textInput.value = textState.content;

  // Update text content on input
  textInput.addEventListener("input", (e) => {
    textState.content = e.target.value;
    draw(); // Redraw canvas with updated text
  });

  // Modify draw function to render text
  const originalDraw = draw;
  draw = () => {
    originalDraw(); // Call the original draw function

    if (textState.content) {
      ctx.font = textState.font;
      ctx.fillStyle = textState.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textState.content, textState.x, textState.y);
    }
  };

  // Initial draw to show default text
  draw();

  // --- Update current year in footer ---
  const currentYearSpan = document.getElementById("current-year");
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // --- Handle Upload Button Click ---
  const uploadButton = document.getElementById("upload-button");
  if (uploadButton) {
    uploadButton.addEventListener("click", () => {
      uploadInput.click(); // Programmatically click the hidden file input
    });
  }

  // --- Reset Button ---
  const resetButton = document.getElementById("reset-button");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (userImage && initialImgX !== undefined) { // Only reset if an image is loaded and initial state is stored
        img.x = initialImgX;
        img.y = initialImgY;
        img.w = initialImgW;
        img.h = initialImgH;
        draw();
      }
    });
  }
})();