<template>
  <div class="main" id="presentation">
    <canvas id="pageCanvas" width="2736" height="1824" 
      v-bind:class="{laser: laserEnabled, pen: penEnabled, erase: eraserEnabled}"></canvas>
    <div class="controls" v-bind:class="{hidden: !toolboxVisible}">
      <button class="color" style="background: #fff" v-on:click="setPenColor('#fff')"></button>
      <button class="color" style="background: #c0392b" v-on:click="setPenColor('#c0392b')"></button>
      <button class="color" style="background: #2980b9" v-on:click="setPenColor('#2980b9')"></button>
      <button class="color" style="background: #27ae60" v-on:click="setPenColor('#27ae60')"></button>
      <button class="color" style="background: #e67e22" v-on:click="setPenColor('#e67e22')"></button>
      <button class="color" style="background: #34495e" v-on:click="setPenColor('#34495e')"></button>
      <button class="circle small"  v-on:click="setPenSize(2)"></button>
      <button class="circle medium" v-on:click="setPenSize(5)" ></button>
      <button class="circle large"  v-on:click="setPenSize(10)"></button>
      <button class="eraser" v-on:click="enableEraser()"></button>
    </div>
    <ShortcutsView v-bind:visible="helpVisible" />
  </div>
</template>

<script>


import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import ShortcutsView from './ShortcutsView.vue';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;


class Annotation {
  constructor(point) {
    this.points = [point];
    this.path = new Path2D();
    this.path.moveTo(point.x, point.y);
    this.strokeStyle = '#c0392b';
    this.lineWidth = 5;
    this.lineCap = 'round';
    this.lineJoin = 'round';
  }

  lineTo(point) {
    this.points.push(point);
    this.path.lineTo(point.x, point.y);
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.lineCap;
    ctx.lineJoin = this.lineJoin;
    ctx.stroke(this.path);
    ctx.restore();
  }

  hitTest(point, radius) {
    var r2 = radius * radius;
    for (const pt of this.points) {
      var dist = (pt.x - point.x)**2 + (pt.y - point.y)**2;
      if (dist <= r2) {
        return true;
      }
    }
    return false;
  }
}


class PageAnnotations {
  constructor() {
    this.annotations = [];
    this.redoStack = [];
  }

  clear() {
    this.annotations = [];
    this.redoStack = [];
  }

  start(point) {
    this.redoStack = [];
    var annotation = new Annotation(point);
    this.annotations.push(annotation);
    return annotation;
  }

  update(point) {
    this.top().lineTo(point);
  }

  undo() {
    var items = this.annotations.splice(this.annotations.length - 1, 1);
    if (items.length > 0) {
      this.redoStack.push(items[0]);
      return true;
    }
    return false;
  }

  redo() {
    var items = this.redoStack.splice(this.redoStack.length - 1, 1);
    if (items.length > 0) {
      this.annotations.push(items[0]);
      return true;
    }
    return false;
  }

  erase(point, radius) {
    this.annotations = this.annotations.filter(item => !item.hitTest(point, radius));
  }

  draw(ctx) {
    this.annotations.forEach(item => {
      item.draw(ctx);
    });
  }

  top() {
    return this.annotations[this.annotations.length - 1];
  }
}


function checkModifiers(event, modifiers) {
  for (const modifier of modifiers) {
    switch (modifier) {
      case 'Ctrl':
      case 'Control':
        if (!event.ctrlKey) {
          return false;
        }
        break;
      case 'Alt':
        if (!event.altKey) {
          return false;
        }
        break;
      case 'Shift':
        if (!event.shiftKey) {
          return false;
        }
        break;
      case 'Meta':
        if (!event.metaKey) {
          return false;
        }
        break;
    }
  }
  return true;
}


export default {
  name: 'PresentationView',
  components: {
    ShortcutsView
  },
  props: {
    pdfUrl: String,
    scale: {type: Number, default: 3.0},
    initialPage: {type: Number, default: 1}
  },
  data() {
    return {
      pdf: null,
      page: null,
      pageNumber: 1,
      pageNumberPending: null,
      pageRendering: false,
      drawing: false,
      annotations: {}, 
      blackboard: false,
      whiteboard: false,
      strokeStyle: '#c0392b',
      lineWidth: 5,
      laserEnabled: false,
      penEnabled: true,
      eraserEnabled: false,
      helpVisible: false,
      toolboxVisible: true,
      
      keyBindings: {
        'Space': this.nextPage,
        'Enter': this.nextPage,
        'ArrowRight': this.nextPage,
        'ArrowDown': this.nextPage,
        'ArrowLeft': this.previousPage,
        'ArrowUp': this.previousPage,
        'Home': this.firstPage,
        'End': this.lastPage,
        'PageDown': this.nextPage,
        'PageUp': this.previousPage,
        'KeyE': this.clearPageAnnotations,
        'KeyB': this.toggleBlackboard,
        'KeyW': this.toggleWhiteboard,
        'KeyL': this.toggleLaserPointer,
        'KeyP': this.togglePen,
        'KeyZ': {modifiers: ['Ctrl'], callback: this.undoAnnotation},
        'KeyY': {modifiers: ['Ctrl'], callback: this.redoAnnotation},
        'KeyF': this.fullScreen,
        'KeyH': this.toggleHelpVisible,
        'KeyT': this.toggleToolboxVisibility
      }
    }
  },

  watch: {
    pdfUrl() {
      this.loadPdf();
    }
  },

  methods: {
    loadPdf() {
      var loadingTask = pdfjs.getDocument(this.pdfUrl);
      loadingTask.promise.then(this.pdfLoaded, function(reason) {
        console.log(reason);
      });
    },

    pdfLoaded(pdf) {
      this.pdf = pdf;
      this.clearAllAnnotations();
      this.goToPage(this.initialPage);
    },

    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.pdf.numPages) {
        if (this.pageRendering) {
          this.pageNumberPending = pageNumber;
        } else {
          
          this.pageRendering = true;
          this.pageNumber = pageNumber;
          this.pdf.getPage(this.pageNumber).then(this.pageLoaded);
        }
      }
    },

    enableEraser() {
      this.eraserEnabled = true;
      this.penEnabled = false;
    },

    toggleHelpVisible() {
      this.helpVisible = !this.helpVisible;
    },

    toggleLaserPointer() {
      this.laserEnabled = !this.laserEnabled;
      if (this.laserEnabled) {
        this.penEnabled = false;
        this.eraserEnabled = false;
      }
    },

    togglePen() {
      this.penEnabled = !this.penEnabled;
      if (this.penEnabled) {
        this.laserEnabled = false;
        this.eraserEnabled = false;
      } else {
        this.drawing = this.erasing = false;
      }
    },

    toggleToolboxVisibility() {
      this.toolboxVisible = !this.toolboxVisible;
    },

    setPenColor(color) {
      this.strokeStyle = color;
      this.penEnabled = true;
      this.laserEnabled = false;
      this.eraserEnabled = false;
    },

    setPenSize(size) {
      this.lineWidth = size;
      this.penEnabled = true;
      this.laserEnabled = false;
      this.eraserEnabled = false;
    },

    fullScreen() {
      const elem = document.getElementById('presentation');
      elem.requestFullscreen();
    },

    undoAnnotation() {
      if (this.getPageAnnotations().undo()) {
        this.redraw();
      }
    },

    redoAnnotation() {
      if (this.getPageAnnotations().redo()) {
        this.redraw();
      }
    },

    nextPage() {
      this.goToPage(this.pageNumber + 1);
    },

    previousPage() {
      this.goToPage(this.pageNumber - 1);
    },

    firstPage() {
      this.goToPage(1);
    },

    lastPage() {
      this.goToPage(this.pdf.numPages);
    },

    toggleBlackboard() {
      this.blackboard = !this.blackboard;
      if (this.blackboard) {
        this.whiteboard = false;
      }
      this.redraw();
    },

    toggleWhiteboard() {
      this.whiteboard = !this.whiteboard;
      if (this.whiteboard) {
        this.blackboard = false;
      }
      this.redraw();
    },

    adjustSize(viewport) {
      if (this.pageCanvas.height != viewport.height || 
          this.pageCanvas.width != viewport.width
      ) {
        this.pageCanvas.height = viewport.height;
        this.pageCanvas.width = viewport.width;
        this.pdfCanvas.height = viewport.height;
        this.pdfCanvas.width = viewport.width;
        this.overlayCanvas.height = viewport.height;
        this.overlayCanvas.width = viewport.width;
      }
    },

    pageLoaded(page) {
      this.page = page;
      var viewport = page.getViewport({scale: this.scale});

      // Prepare canvas using PDF page dimensions
      this.adjustSize(viewport);
      
      // Render PDF page into canvas context
      var renderTask = page.render({
        canvasContext: this.pdfCtx,
        viewport: viewport
      });

      renderTask.promise.then(this.pageRendered);
    },

    pageRendered() {
      this.pageRendering = false;

      // if a page is pending, skip drawing this one and render it
      if (this.pageNumberPending !== null) {
        this.goToPage(this.pageNumberPending);
        this.pageNumberPending = null;

      // otherwise, render page and annotations
      } else {
        this.redraw();
      }
    },

    redraw() {
      // render pdf layer
      const w = this.pageCanvas.width, h = this.pageCanvas.height;

      this.pageCtx.clearRect(0, 0, w, h);

      if (this.blackboard || this.whiteboard) {
        this.pageCtx.fillStyle = this.blackboard ? '#000' : '#fff';
        this.pageCtx.fillRect(0, 0, w, h);
      } else {
        this.pageCtx.drawImage(this.pdfCanvas, 0, 0, w, h);
      }

      // render annotations layer
      this.renderAnnotations();
    },

    clearAllAnnotations() {
      this.annotations = {};
      for (var i = 1; i <= this.pdf.numPages; i++) {
        this.annotations[i] = new PageAnnotations();
      }
    },

    clearPageAnnotations() {
      this.getPageAnnotations().clear();
      this.redraw();
    },

    getPageAnnotations() {
      return this.annotations[this.pageNumber];
    },

    drawAnnotations(ctx) {
      ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      this.getPageAnnotations().draw(ctx);
    },

    renderAnnotations() {
      this.drawAnnotations(this.overlayCtx);
      this.pageCtx.drawImage(this.overlayCanvas, 0, 0, this.pageCanvas.width, this.pageCanvas.height);
    },

    getCanvasPoint(event) {
      const bb = this.pageCanvas.getBoundingClientRect();
      const x = (event.clientX - bb.left) * (this.pageCanvas.width / bb.width);
      const y = (event.clientY - bb.top) * (this.pageCanvas.height / bb.height);
      return {x: x, y:y};
    },

    keyDown(e) {
      if (e.code in this.keyBindings) {
        let handler = this.keyBindings[e.code];
        if (typeof(handler) === "function") {
          handler();
          e.preventDefault();
        } else if (typeof(handler) == "object") {
          if (checkModifiers(event, handler.modifiers)) {
            handler.callback();
            e.preventDefault();
          }
        }
      }
    },

    pointerDown(e) {
      const point = this.getCanvasPoint(e);
      if (this.penEnabled) {
        if (e.button == 0) {
          this.drawing = true;
          this.erasing = false;
          var annotation = this.getPageAnnotations().start(point);
          annotation.strokeStyle = this.strokeStyle;
          annotation.lineWidth = this.lineWidth;
        } else if (e.button == 5) { // surface pro eraser
          this.drawing = false;
          this.erasing = true;
          this.getPageAnnotations().erase(point, 5);
        }
      } else if (this.eraserEnabled) {
          this.drawing = false;
          this.erasing = true;
          this.getPageAnnotations().erase(point, 5);
      }
    },

    pointerMove(e) {
      if (this.penEnabled || this.eraserEnabled) {
        const point = this.getCanvasPoint(e);
        if (this.drawing) {
          this.getPageAnnotations().update(point);
          this.redraw();
        } else if (this.erasing) {
          this.getPageAnnotations().erase(point, 5);
          this.redraw();
        }
      } 
    },

    pointerUp() {
      if (this.penEnabled || this.eraserEnabled) {
        this.drawing = false;
        this.erasing = false;
        this.redraw();
      } else {
        this.nextPage();
      }
    },

    pointerEnter() {
      this.drawing = false;
      this.erasing = false;
    },

    pointerLeave() {
      this.drawing = false;
      this.erasing = false;
    },

    mouseWheel(e) {
      // Wheel up/down to change slide
      if (e.deltaY >= 10) {
        this.nextPage();
        e.preventDefault();
      } else if (e.deltaY <= -10) {
        this.previousPage();
        e.preventDefault();
      }
    }
  },

  created() {
    window.addEventListener('keydown', this.keyDown);
  },

  destroyed() {
    window.removeEventListener('keydown', this.keyDown);
    this.pageCanvas.removeEventListener('pointerdown', this.pointerDown, false);
    this.pageCanvas.removeEventListener('pointermove', this.pointerMove, false);
    this.pageCanvas.removeEventListener('pointerup', this.pointerUp, false);
    this.pageCanvas.removeEventListener('pointerenter', this.pointerEnter);
    this.pageCanvas.removeEventListener('pointerleave', this.pointerLeave);
    this.pageCanvas.removeEventListener('wheel', this.mouseWheel);
  },

  mounted() {

    // main canvas
    this.pageCanvas = document.getElementById("pageCanvas");
    this.pageCtx = this.pageCanvas.getContext("2d");

    // layers
    this.pdfCanvas = document.createElement("canvas");
    this.pdfCtx = this.pdfCanvas.getContext('2d');
    this.overlayCanvas = document.createElement("canvas");
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    
    // pointer events
    this.pageCanvas.addEventListener('pointerdown', this.pointerDown, false);
    this.pageCanvas.addEventListener('pointermove', this.pointerMove, false);
    this.pageCanvas.addEventListener('pointerup', this.pointerUp, false);
    this.pageCanvas.addEventListener('pointerenter', this.pointerEnter);
    this.pageCanvas.addEventListener('pointerleave', this.pointerLeave);

    // mouse wheel
    this.pageCanvas.addEventListener('wheel', this.mouseWheel);
    
    this.loadPdf();
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div.main {
  width: 100%;
  height: 100%;
  position: relative;
  background: black;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  margin: auto;
  touch-action: none; 
  cursor: default;
}

.laser {
  cursor: url(/laser-pointer.png), pointer !important; 
}

.erase {
  cursor: url(/eraser.png), crosshair !important;
}

.pen {
  cursor: crosshair;
}

.hidden {
  visibility: hidden;
}

div.controls {
  position: fixed;
  bottom: 10px;
  right: 10px;
  padding: 0px 5px;
  height: 30px;
  background: rgba(0, 0, 0, 0.25);
  line-height: 30px;
  vertical-align: center;
  display: flex;
  align-items: center;
  z-index: 100;
} 

button.color {
  display: inline-block;
  padding: 0;
  margin: 5px 3px;
  border: 2px solid black;
  width: 20px;
  height: 20px;
}

button.circle {
  display: inline-block;
  padding: 0;
  margin: 5px 3px;
  border: 2px solid black;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #eee;
}

button.circle.large {
  width: 20px;
  height: 20px;
}

button.circle.medium {
  width: 15px;
  height: 15px;
  margin: 0 5px 0 5px;
}

button.circle.small {
  width: 10px;
  height: 10px;
  margin: 0px 5px 0px 15px;
}

button.eraser {
  display: inline-block;
  padding: 0;
  margin: 5px 3px;
  border: none;
  width: 20px;
  height: 20px;
  background-image: url(/eraser.png);
  background-size: 20px 20px;
  background-color:rgba(0, 0, 0, 0);
  background-position: center;
}
</style>
