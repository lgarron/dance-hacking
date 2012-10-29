# echonest-analysis.js

Client-side Echonest analysis made easy.

    echonestAnalysis(file, callback)

Makes the necessary API calls to get the `audio_analysis` data, and calls `callback(audio_analysis)`.

## Notes and Ideas

- Play a drag-dropped file: http://jsfiddle.net/gaJyT/18/
- Paste: http://html5-demos.appspot.com/static/html5-whats-new/template/index.html#27
- Handle folders, not just files: http://updates.html5rocks.com/2012/07/Drag-and-drop-a-folder-onto-Chrome-now-available
- Use Web Workers with structured cloning: http://updates.html5rocks.com/2011/09/Workers-ArrayBuffer