<template>
  <div id="app">
    <PresentationView id="presentation" v-bind:pdf-url="pdfUrl" />
  </div>
</template>

<script>
/* eslint-disable no-debugger, no-console, no-unused-vars */

import PresentationView from './components/PresentationView.vue'

function dropAllowed(event) {
  const transfer = event.dataTransfer;
  if (transfer.items.length == 1) {
    const item = transfer.items[0];
    return item.type == "application/pdf";
  }
  return false;
}

export default {
  name: 'App',
  components: {
    PresentationView
  },

  data() {
    return {
      pdfUrl: 'slides.pdf'
    }
  },

  methods: {
    setPdfUrl(url) {
      this.pdfUrl = url; 
    },

    dragStart(ev) {
      if (dropAllowed(ev)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    },

    drop(ev) {
      if (dropAllowed(ev)) {
        const file = ev.dataTransfer.items[0].getAsFile();
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => this.setPdfUrl(reader.result);
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
  }, 

  mounted() {
    const app = document.getElementById('app');
    app.addEventListener('dragover', this.dragStart, false);
    app.addEventListener('drop', this.drop, false);
  },

  destroyed() {
    const app = document.getElementById('app');
    app.removeEventListener('dragover', this.dragStart);
    app.removeEventListener('drop', this.drop);
  },
}
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  min-height:100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}
</style>
