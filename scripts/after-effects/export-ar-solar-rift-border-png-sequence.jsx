#target aftereffects

/*
  AR Solar System - rift border PNG sequence export helper

  Usage:
  1. Run scripts/after-effects/create-ar-solar-rift-vfx.jsx first.
  2. Review/tune the rift_border_loop comp in After Effects.
  3. Run this script when the look is ready to export source frames.

  Recommended project workflow:
  - Export a transparent PNG sequence as the source-of-truth asset.
  - Keep those frames under public/assets/solar/fx/rift-border-loop/png-sequence/.
  - Later, convert the PNG sequence to a transparent WebM VP9 runtime asset if
    VideoTexture integration is approved for the browser demo.

  This script intentionally does not modify or overwrite the look-dev generator.
*/

(function exportArSolarRiftBorderPngSequence() {
  var SETTINGS = {
    compName: 'rift_border_loop',
    projectOutputFolder:
      '~/CodeXProject/ar-solar-system-demo/public/assets/solar/fx/rift-border-loop/png-sequence',
    framePrefix: 'rift_border_loop_',
    frameDigits: 5,
    manifestName: 'rift_border_loop.sequence.json',
    preferredFrameRate: 30,
    expectedDuration: 4,
    openFolderWhenDone: true,
    renderQueueFallbackOnly: true};

  app.beginUndoGroup('Export AR Solar Rift Border PNG Sequence');

  try {
    if (!app.project) {
      alert('No After Effects project is open. Run the look-dev generator first.');
      return;
    }

    var comp = findCompByName(SETTINGS.compName);
    if (!comp) {
      alert(
        'Could not find comp "' +
          SETTINGS.compName +
          '".\n\nRun create-ar-solar-rift-vfx.jsx first, then run this export helper.');
      return;
    }

    var outputFolder = ensureFolder(SETTINGS.projectOutputFolder);
    if (!outputFolder) {
      alert('Unable to create output folder:\n' + SETTINGS.projectOutputFolder);
      return;
    }

    var frameRate = comp.frameRate || SETTINGS.preferredFrameRate;
    var duration = comp.duration || SETTINGS.expectedDuration;
    var frameCount = Math.round(duration * frameRate);
    var framePattern =
      SETTINGS.framePrefix + repeatText('#', SETTINGS.frameDigits) + '.png';

    var shouldContinue = confirm(
      'Export transparent PNG sequence for "' +
        comp.name +
        '"?\n\n' +
        'Output folder:\n' +
        outputFolder.fsName +
        '\n\n' +
        'Frames: ' +
        frameCount +
        ' @ ' +
        roundNumber(frameRate, 3) +
        ' fps\n' +
        'Pattern: ' +
        framePattern +
        '\n\nExisting files with the same names may be overwritten.');

    if (!shouldContinue) {
      return;
    }

    if (typeof comp.saveFrameToPng === 'function') {
      exportViaSaveFrameToPng(comp, outputFolder, frameRate, frameCount, SETTINGS);
      writeSequenceManifest(comp, outputFolder, frameRate, frameCount, SETTINGS);
      if (SETTINGS.openFolderWhenDone) {
        outputFolder.execute();
      }
      alert(
        'PNG sequence export finished.\n\n' +
          'Folder:\n' +
          outputFolder.fsName +
          '\n\nNext runtime step, when approved: convert these frames to transparent WebM VP9 or wire a sequence/sprite loader.');
      return;
    }

    queueRenderFallback(comp, outputFolder, framePattern, SETTINGS);
  } catch (error) {
    alert('Failed to export AR Solar Rift Border PNG sequence:\n' + error.toString());
  } finally {
    app.endUndoGroup();
  }

  function exportViaSaveFrameToPng(comp, outputFolder, frameRate, frameCount, settings) {
    var previousWorkAreaStart = comp.workAreaStart;
    var previousWorkAreaDuration = comp.workAreaDuration;
    comp.workAreaStart = 0;
    comp.workAreaDuration = comp.duration;

    try {
      for (var i = 0; i < frameCount; i += 1) {
        var time = i / frameRate;
        var file = new File(
          outputFolder.fsName +
            '/' +
            settings.framePrefix +
            zeroPad(i, settings.frameDigits) +
            '.png');
        comp.saveFrameToPng(time, file);
      }
    } finally {
      comp.workAreaStart = previousWorkAreaStart;
      comp.workAreaDuration = previousWorkAreaDuration;
    }
  }

  function queueRenderFallback(comp, outputFolder, framePattern, settings) {
    var renderQueueItem = app.project.renderQueue.items.add(comp);
    renderQueueItem.timeSpanStart = 0;
    renderQueueItem.timeSpanDuration = comp.duration;
    applyRenderTemplate(renderQueueItem);

    var outputModule = renderQueueItem.outputModule(1);
    var templateName = findPngOutputTemplate(outputModule);
    if (templateName) {
      outputModule.applyTemplate(templateName);
    }

    outputModule.file = new File(outputFolder.fsName + '/' + framePattern);
    writeSequenceManifest(
      comp,
      outputFolder,
      comp.frameRate || settings.preferredFrameRate,
      Math.round(comp.duration * (comp.frameRate || settings.preferredFrameRate)),
      settings);

    alert(
      'This After Effects version does not expose comp.saveFrameToPng().\n\n' +
        'I added "' +
        comp.name +
        '" to the Render Queue instead.\n\n' +
        'Before clicking Render, confirm the Output Module is PNG Sequence with RGB + Alpha / Straight alpha.\n\n' +
        'Output folder:\n' +
        outputFolder.fsName);

    if (settings.renderQueueFallbackOnly) {
      app.project.renderQueue.showWindow(true);
    }
  }

  function findCompByName(name) {
    for (var i = 1; i <= app.project.numItems; i += 1) {
      var item = app.project.item(i);
      if (item instanceof CompItem && item.name === name) {
        return item;
      }
    }
    return null;
  }

  function ensureFolder(path) {
    var folder = new Folder(path);
    if (folder.exists) {
      return folder;
    }

    var parent = folder.parent;
    if (parent && !parent.exists && !ensureFolder(parent.fsName)) {
      return null;
    }

    return folder.create() ? folder : null;
  }

  function applyRenderTemplate(renderQueueItem) {
    var candidates = ['Best Settings', '最佳设置'];
    for (var i = 0; i < candidates.length; i += 1) {
      try {
        renderQueueItem.applyTemplate(candidates[i]);
        return;
      } catch (error) {
        // Template names vary by locale/version; keep default render settings.
      }
    }
  }

  function findPngOutputTemplate(outputModule) {
    var templates = outputModule.templates || [];
    var i;
    for (i = 0; i < templates.length; i += 1) {
      if (containsIgnoreCase(templates[i], 'png') && containsIgnoreCase(templates[i], 'alpha')) {
        return templates[i];
      }
    }

    for (i = 0; i < templates.length; i += 1) {
      if (containsIgnoreCase(templates[i], 'png')) {
        return templates[i];
      }
    }

    return null;
  }

  function writeSequenceManifest(comp, outputFolder, frameRate, frameCount, settings) {
    var file = new File(outputFolder.fsName + '/' + settings.manifestName);
    file.encoding = 'UTF-8';
    if (!file.open('w')) {
      return;
    }

    var manifest =
      '{\n' +
      '  "name": "' +
      escapeJson(comp.name) +
      '",\n' +
      '  "type": "png-sequence",\n' +
      '  "alpha": true,\n' +
      '  "width": ' +
      Math.round(comp.width) +
      ',\n' +
      '  "height": ' +
      Math.round(comp.height) +
      ',\n' +
      '  "frameRate": ' +
      roundNumber(frameRate, 3) +
      ',\n' +
      '  "duration": ' +
      roundNumber(comp.duration, 3) +
      ',\n' +
      '  "frameCount": ' +
      frameCount +
      ',\n' +
      '  "framePattern": "' +
      settings.framePrefix +
      repeatText('#', settings.frameDigits) +
      '.png",\n' +
      '  "firstFrame": "' +
      settings.framePrefix +
      zeroPad(0, settings.frameDigits) +
      '.png",\n' +
      '  "loop": true,\n' +
      '  "runtimeRecommendation": "Use this PNG sequence as the master export; convert to transparent WebM VP9 before Three.js VideoTexture integration if file size/performance require it."\n' +
      '}\n';

    file.write(manifest);
    file.close();
  }

  function containsIgnoreCase(text, needle) {
    return String(text).toLowerCase().indexOf(String(needle).toLowerCase()) !== -1;
  }

  function escapeJson(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function repeatText(text, count) {
    var result = '';
    for (var i = 0; i < count; i += 1) {
      result += text;
    }
    return result;
  }

  function zeroPad(value, digits) {
    var text = String(value);
    while (text.length < digits) {
      text = '0' + text;
    }
    return text;
  }

  function roundNumber(value, digits) {
    var multiplier = Math.pow(10, digits);
    return Math.round(value * multiplier) / multiplier;
  }
})();
