<template>
  <div id="app">
    <PresentationView pdf-url="slides.pdf" />
  </div>
</template>

<script>
import PresentationView from './components/PresentationView.vue'

export default {
  name: 'App',
  components: {
    PresentationView
  }
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
