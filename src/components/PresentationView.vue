<template>
  <div class="main">
    <canvas id="pageCanvas" width="2736" height="1824" v-bind:class="{laser: laserEnabled}"></canvas>
    <div class="controls">
      <button class="color" style="background: #fff" v-on:click="strokeStyle = '#fff'"></button>
      <button class="color" style="background: #c0392b" v-on:click="strokeStyle = '#c0392b'"></button>
      <button class="color" style="background: #2980b9" v-on:click="strokeStyle = '#2980b9'"></button>
      <button class="color" style="background: #27ae60" v-on:click="strokeStyle = '#27ae60'"></button>
      <button class="color" style="background: #e67e22" v-on:click="strokeStyle = '#e67e22'"></button>
      <button class="color" style="background: #34495e" v-on:click="strokeStyle = '#34495e'"></button>
      <button class="circle small"  v-on:click="lineWidth = 2"></button>
      <button class="circle medium" v-on:click="lineWidth = 5" ></button>
      <button class="circle large"  v-on:click="lineWidth = 10"></button>
    </div>
  </div>
</template>

<script>

/* eslint-disable no-debugger, no-console */

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
  props: {
  },
  data() {
    return {
      pdfUrl: 'slides.pdf',
      pdf: null,
      page: null,
      pageNumber: 1,
      scale: 3.0,
      drawing: false,
      annotations: {},
      blackboard: false,
      strokeStyle: '#c0392b',
      lineWidth: 5,
      laserEnabled: false,

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
        'KeyL': this.toggleLaserPointer,
        'KeyZ': {modifiers: ['Ctrl'], callback: this.undoAnnotation},
        'KeyY': {modifiers: ['Ctrl'], callback: this.redoAnnotation}
      }
    }
  },
  computed: {
    pdfjs() {
      return window['pdfjs-dist/build/pdf'];
    }
  },

  methods: {
    pdfLoaded(pdf) {
      this.pdf = pdf;
      this.clearAllAnnotations();
      this.firstPage();
    },

    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.pdf.numPages) {
        this.pageNumber = pageNumber;
        this.pdf.getPage(this.pageNumber).then(this.pageLoaded);
      }
    },

    toggleLaserPointer() {
      this.laserEnabled = !this.laserEnabled;
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
      this.redraw();
    },

    adjustSize(viewport) {
      this.pageCanvas.height = viewport.height;
      this.pageCanvas.width = viewport.width;
      this.pdfCanvas.height = viewport.height;
      this.pdfCanvas.width = viewport.width;
      this.overlayCanvas.height = viewport.height;
      this.overlayCanvas.width = viewport.width;
    },

    pageLoaded(page) {
      //console.log('Page loaded');
      this.page = page;
      var viewport = page.getViewport({scale: this.scale});

      // Prepare canvas using PDF page dimensions
      if (this.pageNumber == 1) {
        this.adjustSize(viewport);
      }
      
      // Render PDF page into canvas context
      var renderTask = page.render({
        canvasContext: this.pdfCtx,
        viewport: viewport
      });

      renderTask.promise.then(this.redraw);
    },

    redraw() {
      // render pdf layer
      const w = this.pageCanvas.width, h = this.pageCanvas.height;

      this.pageCtx.clearRect(0, 0, w, h);

      if (this.blackboard) {
        this.pageCtx.fillStyle = '#000';
        this.pageCtx.fillRect(0, 0, w, h);
      } else {
        this.pageCtx.drawImage(this.pdfCanvas, 0, 0, w, h);
      }
      

      // render annotations layer
      this.renderAnnotations();
    },

    clearAllAnnotations() {
      this.annotations = {};
      for (var i = 0; i < this.pdf.numPages; i++) {
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
      if (e.button == 0) {
        this.drawing = true;
        this.erasing = false;
        var annotation = this.getPageAnnotations().start(point);
        annotation.strokeStyle = this.strokeStyle;
        annotation.lineWidth = this.lineWidth;
      } else if (e.button == 5) {
        this.drawing = false;
        this.erasing = true;
        this.getPageAnnotations().erase(point, 5);
      }
    },

    pointerMove(e) {
      const point = this.getCanvasPoint(e);
      if (this.drawing) {
        this.getPageAnnotations().update(point);
        this.redraw();
      } else if (this.erasing) {
        this.getPageAnnotations().erase(point, 5);
        this.redraw();
      }
    },

    pointerUp() {
      if (this.drawing) {
        this.drawing = false;
        this.erasing = false;
        this.redraw();
      }
    },

    pointerEnter() {
      //this.drawing = false;
      this.redraw();
    },

    pointerLeave() {
      //console.log('pointerleave');
      //this.drawing = false;
      this.redraw();
    }
  },

  created() {
    this.pdfjs.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
    window.addEventListener('keydown', this.keyDown);
    
  },

  destroyed() {
    window.removeEventListener('keydown', this.keyDown);
    this.pageCanvas.removeEventListener('pointerdown', this.pointerDown, false);
    this.pageCanvas.removeEventListener('pointermove', this.pointerMove, false);
    this.pageCanvas.removeEventListener('pointerup', this.pointerUp, false);
    //this.canvas.removeEventListener('pointerenter', this.pointerEnter);
    //this.canvas.removeEventListener('pointerleave', this.pointerLeave);
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
    

    this.pageCanvas.addEventListener('pointerdown', this.pointerDown, false);
    this.pageCanvas.addEventListener('pointermove', this.pointerMove, false);
    this.pageCanvas.addEventListener('pointerup', this.pointerUp, false);
    //this.canvas.addEventListener('pointerenter', this.pointerEnter);
    //this.canvas.addEventListener('pointerleave', this.pointerLeave);
    
    var loadingTask = this.pdfjs.getDocument(this.pdfUrl);
    loadingTask.promise.then(this.pdfLoaded, function(reason) {
      console.log(reason);
    });
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
  cursor: url("/laser-pointer.cur"), auto; 
}

div.controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 0px 5px;
  height: 30px;
  background: rgba(0, 0, 0, 0.25);
  /* border: 1px solid gray; */
  line-height: 30px;
  vertical-align: center;
  display: flex;
  align-items: center;
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
</style>
