<template>
  <div id="shortcuts" v-bind:class="{visible: visible}">

    <table>
      <tr>
        <td>␣ / ⏎</td>
        <td>Next slide</td>
      </tr>
      <tr>
        <td>← / ↑</td>
        <td>Previous slide</td>
      </tr>
      <tr>
        <td>→ / ↓</td>
        <td>Next slide</td>
      </tr>
      <tr>
        <td>Home</td>
        <td>Go to first slide</td>
      </tr>
      <tr>
        <td>End</td>
        <td>Go to last slide</td>
      </tr>
      <tr>
        <td>B / W</td>
        <td>Toggle blackboard/whiteboard</td>
      </tr>
      <tr>
        <td>E</td>
        <td>Erase all annotation</td>
      </tr>
      <tr>
        <td>H</td>
        <td>Toggle shortcut help box</td>
      </tr>
      <tr>
        <td>S</td>
        <td>Show or hide settings</td>
      </tr>
      <tr>
        <td>L</td>
        <td>Toggle laser pointer</td>
      </tr>
      <tr>
        <td>P</td>
        <td>Toggle pen</td>
      </tr>
      <tr>
        <td>F</td>
        <td>Toggle fullscreen</td>
      </tr>
      <tr>
        <td>T</td>
        <td>Toggle toolbar</td>
      </tr>
      <tr>
        <td>Ctrl + Z</td>
        <td>Undo last annotation</td>
      </tr>
      <tr>
        <td>Ctrl + Y</td>
        <td>Redo last annotation</td>
      </tr>
      <tr>
        <td>Ctrl + O</td>
        <td>Show file open dialog</td>
      </tr>
    </table>
  </div>
</template>

<script>

export default {
  name: 'ShortcutsView',
  props: {
    visible: Boolean
  },
}

</script>

<style scoped>
#shortcuts {
  position: absolute;
  top: 200px;
  left: 0;
  /* bottom: 100px; */
  right: 0;
  width: 400px;
  padding: 25px 50px;
  margin: auto;
  background: rgb(0,0,0,0.8);
  border: 10px solid white;
  color: white;
  display: none;
  visibility: hidden;
  text-align: center;
}

td:first-child {
  font-weight: bold;
  text-align: right;
}

.visible {
  display: block !important;
  visibility: visible !important;
}

table {
  text-align: left;
}

td {
  padding-right: 20px;
}
</style>