// Script to reset theme in AsyncStorage
// Run this in React Native Debugger console:
// AsyncStorage.getItem('persist:Root').then(data => {
//   const parsed = JSON.parse(data);
//   const settings = JSON.parse(parsed.settings);
//   settings.theme = 'system';
//   parsed.settings = JSON.stringify(settings);
//   AsyncStorage.setItem('persist:Root', JSON.stringify(parsed));
// });
console.log('To reset theme, run in React Native Debugger:');
console.log(`
AsyncStorage.getItem('persist:Root').then(data => {
  const parsed = JSON.parse(data);
  const settings = JSON.parse(parsed.settings);
  settings.theme = 'system';
  parsed.settings = JSON.stringify(settings);
  AsyncStorage.setItem('persist:Root', JSON.stringify(parsed));
  console.log('Theme reset to system');
});
`);
