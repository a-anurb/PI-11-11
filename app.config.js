// Native Google Sign-In via Firebase needs the Android app's google-services.json.
// Copy it from Firebase Console; keep the project usable in web mode before it exists.
const fs = require('fs');
const { expo } = require('./app.json');
module.exports = () => ({
  ...expo,
  android: {
    ...expo.android,
    ...(fs.existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
  },
});
