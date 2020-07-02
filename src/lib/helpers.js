
export function localStorageBoolProperty(key, defaultValue) {
  return {
    get: function() {
      var value = window.localStorage.getItem("settings:" + key);
      return (value === null) ? defaultValue: (value === "true");
    },
    set: function(value) {
      window.localStorage.setItem("settings:" + key, value);
    }
  }
}

export function getBoolSetting(key, defaultValue) {
  var value = window.localStorage.getItem("settings:" + key);
  return (value === null) ? defaultValue: (value === "true");
}


export function checkModifiers(event, modifiers) {
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
