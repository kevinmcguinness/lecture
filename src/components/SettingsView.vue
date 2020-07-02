<template>
  <div id="settings" v-bind:class="{visible: visible}">
    <label><input type="checkbox" v-model="drawWithTouch">Enable touch annotation</label>
    <label><input type="checkbox" v-model="drawWithMouse">Enable annotation with a mouse pointer</label>
    <label><input type="checkbox" v-model="drawWithPen">Enable annotation with a pen or stylus</label>
    <label><input type="checkbox" v-model="smoothLines">Enable smooth annotations</label>
  </div>
</template>

<script>

import {localStorageBoolProperty} from "@/lib/helpers";

export default {
  name: 'SettingsView',
  props: {
    visible: Boolean
  },
  computed: {
    drawWithTouch: localStorageBoolProperty("drawWithTouch", true),
    drawWithMouse: localStorageBoolProperty("drawWithMouse", true),
    drawWithPen: localStorageBoolProperty("drawWithPen", true),
    smoothLines: localStorageBoolProperty("smoothLines", true),
  }
}
</script>

<style scoped>
#settings {
  position: absolute;
  top: 200px;
  left: 0;
  /* bottom: 100px; */
  right: 0;
  width: 400px;
  padding: 25px 50px;
  margin: auto;
  background: white;
  border: 10px solid rgba(0,0,0,0.8);;
  display: none;
  visibility: hidden;
  text-align: left;
}

.visible {
  display: block !important;
  visibility: visible !important;
}

label {
  display: block;
}

input[type="checkbox"] {
  margin-right: 10px;
}

</style>