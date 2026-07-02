#target aftereffects

/*
  AR Solar System - one-click rift border look-dev generator

  Usage:
  1. Open After Effects.
  2. File > Scripts > Run Script File...
  3. Choose this JSX.

  The script creates:
  - rift_border_loop: transparent looping boundary halo only
  - 00_README_LOOKDEV_GUIDE: notes for tuning

  This script intentionally does not export, save, or enqueue renders. Tune the
  AE comps first; choose the final runtime export format later.
*/

(function createArSolarRiftBorderVfx() {
  var SETTINGS = {
    width: 1920,
    height: 1080,
    duration: 4,
    fps: 30,
    borderEllipse: [1500, 600],
    borderOutputName: 'rift_border_loop',
    projectFolderName: 'AR Solar Rift Boundary Halo VFX'};

  var GOLD = [1.0, 0.66, 0.24];
  var SOFT_GOLD = [1.0, 0.82, 0.52];
  var WHITE_GOLD = [1.0, 0.95, 0.78];
  var CYAN = [0.22, 0.82, 1.0];
  var DIM_CYAN = [0.06, 0.42, 0.55];
  var WHITE = [1.0, 1.0, 1.0];

  app.beginUndoGroup('Create AR Solar Rift Boundary Halo VFX');

  try {
    if (!app.project) {
      app.newProject();
    }

    var rootFolder = app.project.items.addFolder(SETTINGS.projectFolderName);
    var borderComp = createTransparentComp(SETTINGS.borderOutputName, SETTINGS);

    borderComp.parentFolder = rootFolder;

    buildBorderComp(borderComp, SETTINGS, {
      GOLD: GOLD,
      SOFT_GOLD: SOFT_GOLD,
      WHITE_GOLD: WHITE_GOLD,
      CYAN: CYAN,
      DIM_CYAN: DIM_CYAN,
      WHITE: WHITE});
    addReadmeComp(rootFolder, SETTINGS);

    alert(
      'AR Solar Rift Boundary Halo comp created.\n\n' +
        'Only rift_border_loop was generated. It has subtle breathing and small 2D angle drift.\n' +
        'No angle preview, wisps, export, or render queue were added.');
  } catch (error) {
    alert('Failed to create AR Solar Rift Border VFX:\n' + error.toString());
  } finally {
    app.endUndoGroup();
  }

  function createTransparentComp(name, settings) {
    var comp = app.project.items.addComp(
      name,
      settings.width,
      settings.height,
      1,
      settings.duration,
      settings.fps);
    comp.bgColor = [0, 0, 0];
    comp.motionBlur = false;
    return comp;
  }

  function buildBorderComp(comp, settings, colors) {
    var breathNull = comp.layers.addNull();
    breathNull.name = 'BREATH_CONTROL - vertical angle slider lives here';
    breathNull.guideLayer = true;
    breathNull.threeDLayer = true;
    addSliderControl(breathNull, 'Vertical Tilt Degrees', 66.66);
    breathNull.property('ADBE Transform Group').property('ADBE Position').setValue([
      comp.width / 2,
      comp.height / 2]);
    breathNull.property('ADBE Transform Group').property('ADBE Scale').expression =
      'dur=thisComp.duration; p=(time%dur)/dur; ' +
      'sx=100 + Math.sin(6.2831853*p)*0.8; ' +
      'sy=100 + Math.sin(6.2831853*(p+0.12))*1.7; [sx,sy];';
    breathNull.property('ADBE Transform Group').property('ADBE Rotate X').expression =
      'effect("Vertical Tilt Degrees")(1);';
    breathNull.property('ADBE Transform Group').property('ADBE Rotate Z').expression =
      'dur=thisComp.duration; p=(time%dur)/dur; -1.2 + Math.sin(6.2831853*(p+0.2))*0.9;';
    breathNull.property('ADBE Transform Group').property('ADBE Opacity').expression =
      'dur=thisComp.duration; p=(time%dur)/dur; 84 + Math.sin(6.2831853*(p+0.08))*10;';

    var softHalo = addEllipseStrokeLayer(comp, 'soft amber depth halo', {
      size: [settings.borderEllipse[0] * 1.07, settings.borderEllipse[1] * 1.12],
      color: colors.SOFT_GOLD,
      width: 72,
      opacity: 16,
      blur: 38,
      blend: BlendingMode.ADD,
      pulsePhase: 0.12});
    attachToBreathControl(softHalo, breathNull);
    addGlowSafe(softHalo, 58, 0.55);

    var mutedBackArc = addEllipseStrokeLayer(comp, 'muted rear bronze band', {
      size: [settings.borderEllipse[0] * 1.02, settings.borderEllipse[1] * 1.04],
      color: colors.GOLD,
      width: 34,
      opacity: 20,
      blur: 18,
      blend: BlendingMode.ADD,
      pulsePhase: 0.68});
    attachToBreathControl(mutedBackArc, breathNull);
    addTurbulentDisplaceSafe(mutedBackArc, 8, 360, 0.16);

    var thinCyanEdge = addEllipseStrokeLayer(comp, 'thin cyan edge glints', {
      size: [settings.borderEllipse[0] * 1.045, settings.borderEllipse[1] * 0.995],
      color: colors.CYAN,
      width: 7,
      opacity: 26,
      blur: 8,
      blend: BlendingMode.ADD,
      pulsePhase: 0.43});
    attachToBreathControl(thinCyanEdge, breathNull);
    addGlowSafe(thinCyanEdge, 34, 0.78);

    var goldStrokes = addMovingArcLayer(comp, 'layered broken gold rim strokes', {
      count: 18,
      ellipse: settings.borderEllipse,
      colors: [colors.GOLD, colors.SOFT_GOLD, colors.WHITE_GOLD],
      widthMin: 2.2,
      widthMax: 9,
      opacityMin: 13,
      opacityMax: 48,
      lengthMin: 5,
      lengthMax: 20,
      seed: 1201,
      yScaleJitter: 0.12,
      rotationSpeedMin: 0.015,
      rotationSpeedMax: 0.045});
    attachToBreathControl(goldStrokes, breathNull);

    var coolStrokes = addMovingArcLayer(comp, 'subtle cool under-rim strokes', {
      count: 5,
      ellipse: [settings.borderEllipse[0] * 1.02, settings.borderEllipse[1] * 0.96],
      colors: [colors.CYAN, colors.DIM_CYAN],
      widthMin: 1.6,
      widthMax: 4.5,
      opacityMin: 7,
      opacityMax: 20,
      lengthMin: 8,
      lengthMax: 28,
      seed: 1807,
      yScaleJitter: 0.15,
      rotationSpeedMin: -0.04,
      rotationSpeedMax: -0.015});
    attachToBreathControl(coolStrokes, breathNull);

    var denseDust = addEllipseDustLayer(comp, 'dense gold sand grains', {
      count: 220,
      ellipse: settings.borderEllipse,
      color: colors.SOFT_GOLD,
      opacity: 82,
      dotMin: 0.9,
      dotMax: 3.9,
      radialJitter: 70,
      tangentialJitter: 22,
      seed: 4101,
      twinkle: false});
    attachToBreathControl(denseDust, breathNull);

    var whiteDust = addEllipseDustLayer(comp, 'white hot pin sparks', {
      count: 70,
      ellipse: [settings.borderEllipse[0] * 1.02, settings.borderEllipse[1] * 1.03],
      color: colors.WHITE,
      opacity: 78,
      dotMin: 0.75,
      dotMax: 2.1,
      radialJitter: 96,
      tangentialJitter: 30,
      seed: 6203,
      twinkle: false});
    attachToBreathControl(whiteDust, breathNull);

    var cyanDust = addEllipseDustLayer(comp, 'sparse cyan edge dust', {
      count: 36,
      ellipse: [settings.borderEllipse[0] * 1.06, settings.borderEllipse[1] * 1.0],
      color: colors.CYAN,
      opacity: 44,
      dotMin: 0.9,
      dotMax: 3,
      radialJitter: 112,
      tangentialJitter: 34,
      seed: 9309,
      twinkle: false});
    attachToBreathControl(cyanDust, breathNull);

    var innerHairline = addEllipseStrokeLayer(comp, 'inner white gold rim hairline', {
      size: [settings.borderEllipse[0] * 0.976, settings.borderEllipse[1] * 0.982],
      color: colors.WHITE_GOLD,
      width: 2.4,
      opacity: 38,
      blur: 1.5,
      blend: BlendingMode.ADD,
      pulsePhase: 0.76});
    attachToBreathControl(innerHairline, breathNull);
    addGlowSafe(innerHairline, 12, 0.58);
  }

  function addReadmeComp(rootFolder, settings) {
    var comp = createTransparentComp('00_README_LOOKDEV_GUIDE', settings);
    comp.parentFolder = rootFolder;
    var text =
      'AR Solar Rift Border VFX\n\n' +
      'Outputs:\n' +
      '- rift_border_loop: transparent boundary halo source only\n\n' +
      'Current direction:\n' +
      '1. Select BREATH_CONTROL and adjust Effect Controls > Vertical Tilt Degrees.\n' +
      '2. Default approved value is 66.66 degrees on this already-flat 1500x600 ellipse.\n' +
      '   Runtime Three.js uses the equivalent pitch for its base rift size, about -79.58 degrees.\n' +
      '3. Only a boundary halo layer with subtle breathing motion, tiny 2D drift, and adjustable vertical tilt.\n' +
      '4. Keep the source as a transparent boundary halo; do not add extra angle-preview comps.\n' +
      '5. No blue/gold wisps, hand cards, UI blocks, planets, sun, or filled background.\n' +
      '6. Border should read as layered cosmic sand, soft glow, and tiny spark grains.\n' +
      '7. Default comp is optimized for AE preview: reduced vector grain count, no per-grain expressions, no motion blur.';
    var layer = comp.layers.addText(text);
    layer.name = 'readme';
    layer.property('ADBE Transform Group').property('ADBE Position').setValue([150, 170]);
    var doc = layer.property('ADBE Text Properties').property('ADBE Text Document').value;
    doc.fontSize = 42;
    doc.fillColor = [0.82, 0.93, 1.0];
    doc.justification = ParagraphJustification.LEFT_JUSTIFY;
    layer.property('ADBE Text Properties').property('ADBE Text Document').setValue(doc);
  }

  function addEllipseStrokeLayer(comp, name, options) {
    var layer = comp.layers.addShape();
    layer.name = name;
    layer.blendingMode = options.blend || BlendingMode.NORMAL;
    setLayerPosition(layer, comp.width / 2, comp.height / 2);

    var contents = layer.property('ADBE Root Vectors Group');
    var group = contents.addProperty('ADBE Vector Group');
    group.name = name + ' shape';
    var vectors = group.property('ADBE Vectors Group');
    var ellipse = vectors.addProperty('ADBE Vector Shape - Ellipse');
    ellipse.property('ADBE Vector Ellipse Size').setValue(options.size);
    var stroke = vectors.addProperty('ADBE Vector Graphic - Stroke');
    stroke.property('ADBE Vector Stroke Color').setValue(options.color);
    stroke.property('ADBE Vector Stroke Opacity').setValue(options.opacity);
    stroke.property('ADBE Vector Stroke Width').setValue(options.width);
    stroke.property('ADBE Vector Stroke Line Cap').setValue(2);

    layer.property('ADBE Transform Group').property('ADBE Opacity').expression =
      periodicOpacityExpression(78, 18, options.pulsePhase || 0);

    if (options.rotationSpeed) {
      layer.property('ADBE Transform Group').property('ADBE Rotate Z').expression =
        loopingDriftExpression(0, options.rotationSpeed * 360, 0.17);
    }

    if (options.blur && options.blur > 0) {
      addBlurSafe(layer, options.blur);
    }

    return layer;
  }

  function addMovingArcLayer(comp, name, options) {
    var layer = comp.layers.addShape();
    layer.name = name;
    layer.blendingMode = BlendingMode.ADD;
    setLayerPosition(layer, comp.width / 2, comp.height / 2);

    var rand = seededRandom(options.seed);
    var contents = layer.property('ADBE Root Vectors Group');

    for (var i = 0; i < options.count; i += 1) {
      var group = contents.addProperty('ADBE Vector Group');
      group.name = name + ' ' + zeroPad(i + 1, 2);
      var vectors = group.property('ADBE Vectors Group');
      var ellipse = vectors.addProperty('ADBE Vector Shape - Ellipse');
      var scaleX = 0.94 + rand() * 0.16;
      var scaleY = 0.92 + rand() * 0.18 + (rand() - 0.5) * options.yScaleJitter;
      ellipse.property('ADBE Vector Ellipse Size').setValue([
        options.ellipse[0] * scaleX,
        options.ellipse[1] * scaleY]);

      var stroke = vectors.addProperty('ADBE Vector Graphic - Stroke');
      stroke.property('ADBE Vector Stroke Color').setValue(
        options.colors[Math.floor(rand() * options.colors.length)]);
      stroke.property('ADBE Vector Stroke Opacity').setValue(
        lerp(options.opacityMin, options.opacityMax, rand()));
      stroke.property('ADBE Vector Stroke Width').setValue(
        lerp(options.widthMin, options.widthMax, rand()));
      stroke.property('ADBE Vector Stroke Line Cap').setValue(2);

      var trim = vectors.addProperty('ADBE Vector Filter - Trim');
      var start = rand() * 100;
      var length = lerp(options.lengthMin, options.lengthMax, rand());
      trim.property('ADBE Vector Trim Start').setValue(start);
      trim.property('ADBE Vector Trim End').setValue(Math.min(100, start + length));
      var speed = lerp(options.rotationSpeedMin, options.rotationSpeedMax, rand());
      trim.property('ADBE Vector Trim Offset').expression =
        loopingDriftExpression(rand() * 360, speed * 360, rand());

      var transform = group.property('ADBE Vector Transform Group');
      transform.property('ADBE Vector Position').setValue([
        (rand() - 0.5) * 34,
        (rand() - 0.5) * 28]);
      transform.property('ADBE Vector Group Opacity').setValue(lerp(54, 92, rand()));
    }

    return layer;
  }

  function addEllipseDustLayer(comp, name, options) {
    var layer = comp.layers.addShape();
    layer.name = name;
    layer.blendingMode = BlendingMode.ADD;
    setLayerPosition(layer, comp.width / 2, comp.height / 2);

    var rand = seededRandom(options.seed);
    var contents = layer.property('ADBE Root Vectors Group');
    var rx = options.ellipse[0] / 2;
    var ry = options.ellipse[1] / 2;

    for (var i = 0; i < options.count; i += 1) {
      var angle = rand() * Math.PI * 2;
      var radial = gaussianish(rand) * options.radialJitter;
      var tangent = gaussianish(rand) * options.tangentialJitter;
      var dotSize = lerp(options.dotMin, options.dotMax, rand());
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      var nx = cos;
      var ny = sin;
      var tx = -sin;
      var ty = cos;
      var x = cos * rx + nx * radial + tx * tangent;
      var y = sin * ry + ny * radial * 0.58 + ty * tangent;

      var group = contents.addProperty('ADBE Vector Group');
      group.name = 'grain ' + zeroPad(i + 1, 3);
      var vectors = group.property('ADBE Vectors Group');
      var ellipse = vectors.addProperty('ADBE Vector Shape - Ellipse');
      ellipse.property('ADBE Vector Ellipse Size').setValue([dotSize, dotSize]);

      var fill = vectors.addProperty('ADBE Vector Graphic - Fill');
      fill.property('ADBE Vector Fill Color').setValue(options.color);
      fill.property('ADBE Vector Fill Opacity').setValue(options.opacity * lerp(0.42, 1, rand()));

      var transform = group.property('ADBE Vector Transform Group');
      transform.property('ADBE Vector Position').setValue([x, y]);
      if (options.twinkle && i % 2 === 0) {
        transform.property('ADBE Vector Group Opacity').expression =
          periodicOpacityExpression(70 + rand() * 30, 26 + rand() * 24, rand());
      }
    }

    layer.property('ADBE Transform Group').property('ADBE Opacity').expression =
      periodicOpacityExpression(82, 12, options.seed / 10000);
    return layer;
  }

  function addSliderControl(layer, name, value) {
    var effect = addEffectSafe(layer, 'ADBE Slider Control');
    if (!effect) {
      return null;
    }

    effect.name = name;
    setEffectPropertySafe(effect, 1, value);
    return effect;
  }

  function attachToBreathControl(layer, breathNull) {
    layer.threeDLayer = true;
    layer.parent = breathNull;
  }

  function setLayerPosition(layer, x, y) {
    layer.property('ADBE Transform Group').property('ADBE Position').setValue([x, y]);
  }

  function addBlurSafe(layer, amount) {
    var effect = addEffectSafe(layer, 'ADBE Gaussian Blur 2');
    if (effect) {
      setEffectPropertySafe(effect, 1, amount);
      setEffectPropertySafe(effect, 2, true);
    }
  }

  function addGlowSafe(layer, radius, intensity) {
    var effect = addEffectSafe(layer, 'ADBE Glow');
    if (effect) {
      setEffectPropertySafe(effect, 1, 62);
      setEffectPropertySafe(effect, 2, radius);
      setEffectPropertySafe(effect, 3, intensity);
    }
  }

  function addTurbulentDisplaceSafe(layer, amount, size, evolutionSpeed) {
    var effect = addEffectSafe(layer, 'ADBE Turbulent Displace');
    if (effect) {
      setEffectPropertySafe(effect, 2, amount);
      setEffectPropertySafe(effect, 3, size);
      try {
        effect.property(8).expression =
          loopingDriftExpression(0, evolutionSpeed * 180, 0.33);
      } catch (error) {
        // Keep the effect static if the localized/property-index variant differs.
      }
    }
  }

  function addEffectSafe(layer, matchName) {
    try {
      return layer.property('ADBE Effect Parade').addProperty(matchName);
    } catch (error) {
      return null;
    }
  }

  function setEffectPropertySafe(effect, index, value) {
    try {
      effect.property(index).setValue(value);
    } catch (error) {
      // Optional polish only; never fail comp generation over an effect property.
    }
  }

  function periodicOpacityExpression(base, amplitude, phase) {
    return (
      'dur=thisComp.duration; p=(time%dur)/dur; ' +
      'v=' +
      numberForExpression(base) +
      ' + Math.sin(6.2831853*(p+' +
      numberForExpression(phase) +
      '))*' +
      numberForExpression(amplitude) +
      '; Math.max(0, Math.min(100, v));'
    );
  }

  function loopingDriftExpression(base, amplitude, phase) {
    return (
      'dur=thisComp.duration; p=(time%dur)/dur; ' +
      numberForExpression(base) +
      ' + Math.sin(6.2831853*(p+' +
      numberForExpression(phase) +
      '))*' +
      numberForExpression(amplitude) +
      ';'
    );
  }

  function seededRandom(seed) {
    var value = seed % 2147483647;
    if (value <= 0) {
      value += 2147483646;
    }
    return function nextRandom() {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function gaussianish(rand) {
    return (rand() + rand() + rand() + rand() - 2) / 2;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function numberForExpression(value) {
    return Math.round(value * 1000000) / 1000000;
  }

  function zeroPad(value, digits) {
    var text = String(value);
    while (text.length < digits) {
      text = '0' + text;
    }
    return text;
  }
})();
