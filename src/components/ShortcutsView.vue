<template>
  <div id="shortcuts" v-bind:class="{visible: visible}">

    <table>
      <tr>
        <td>H</td>
        <td>Toggle visibility of this help box</td>
      </tr>
      <tr>
        <td>Space / Enter</td>
        <td>Next slide</td>
      </tr>
      <tr>
        <td>Left Arrow / Up Arrow</td>
        <td>Previous slide</td>
      </tr>
      <tr>
        <td>Right Arrow / Down Arrow</td>
        <td>Next slide</td>
      </tr>
      <tr>
        <td>Home</td>
        <td>First slide</td>
      </tr>
      <tr>
        <td>End</td>
        <td>Last slide</td>
      </tr>
      <tr>
        <td>E</td>
        <td>Erase all annotation</td>
      </tr>
      <tr>
        <td>B</td>
        <td>Toggle blackboard</td>
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
        <td>Ctrl-Z</td>
        <td>Undo last annotation</td>
      </tr>
      <tr>
        <td>Ctrl-Y</td>
        <td>Redo last annotation</td>
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
  width: 500px;
  padding: 50px;
  margin: auto;
  background: rgba(255,255,255,0.95);
  border: 10px solid darkgray;
  display: none;
  visibility: hidden;
  text-align: center;
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