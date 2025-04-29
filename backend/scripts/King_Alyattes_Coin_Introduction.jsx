// King Alyattes Coin Introduction - After Effects Project
// This script creates a dramatic historical reenactment scene 
// featuring King Alyattes introducing the first stamped electrum coins

// Create a new project
var project = app.newProject();

// Create a composition
var compWidth = 1920;
var compHeight = 1080;
var compDuration = 30; // 30 seconds
var compFrameRate = 24;

var mainComp = project.items.addComp("King Alyattes Coin Introduction", compWidth, compHeight, 1.0, compDuration, compFrameRate);
mainComp.openInViewer();

// ---- SCENE SETUP ----

// Background layer - warm palace interior environment
var bgLayer = mainComp.layers.addSolid([0.4, 0.3, 0.2], "Background", compWidth, compHeight, 1.0);

// Add a palace interior image placeholder
var palaceLayer = mainComp.layers.addSolid([0.3, 0.2, 0.1], "Palace Interior", compWidth, compHeight, 1.0);
palaceLayer.position.setValue([compWidth/2, compHeight/2]);

// Add a vignette effect using menu commands instead of direct property name
// Fix for the ADBE Vignette error
try {
    // Apply CC Vignette effect (more widely available across AE versions)
    var vignette = palaceLayer.Effects.addProperty("CC Vignette");
    vignette.property("Amount").setValue(0.5);
    vignette.property("Softness").setValue(0.4);
    vignette.property("Roundness").setValue(0.5);
    // Some versions might have different property names, so we'll handle exceptions
} catch (e) {
    // Alternative using Exposure effect to create vignette-like effect
    try {
        alert("Using alternative vignette effect due to: " + e.message);
        var exposure = palaceLayer.Effects.addProperty("Exposure");
        exposure.property("Exposure").setValue(-2);
        
        // Add a mask for the vignette effect
        var vignetteMask = palaceLayer.Masks.addProperty("ADBE Mask Atom");
        vignetteMask.property("ADBE Mask Shape").setValue(new Shape().ellipse(compWidth/2, compHeight/2, compWidth*0.8, compHeight*0.8));
        vignetteMask.property("ADBE Mask Mode").setValue(3); // Subtract mode
        vignetteMask.property("ADBE Mask Feather").setValue([300, 300]); // Feather the mask
    } catch (e2) {
        alert("Could not create vignette effect: " + e2.message + ". Continuing without vignette.");
    }
}

// Add a text layer for the title
var titleText = mainComp.layers.addText("The First Coins of Lydia - 600 BCE");
titleText.property("Position").setValue([compWidth/2, 100]);
var textProp = titleText.property("Source Text").value;
textProp.fontSize = 48;
textProp.justification = ParagraphJustification.CENTER_JUSTIFY;
textProp.fillColor = [1, 0.8, 0.3]; // Gold color
titleText.property("Source Text").setValue(textProp);

// Animate the title
titleText.property("Opacity").setValueAtTime(0, 0);
titleText.property("Opacity").setValueAtTime(1, 100);
titleText.property("Opacity").setValueAtTime(6, 100);
titleText.property("Opacity").setValueAtTime(8, 0);

// ---- KING ALYATTES INTRODUCTION ----

// Actor layer (placeholder for the king)
var kingLayer = mainComp.layers.addSolid([0.7, 0.5, 0.3], "King Alyattes", compWidth/3, compHeight*0.8, 1.0);
kingLayer.position.setValue([compWidth/3, compHeight/2]);

// Add text for the king's marker (to be replaced with footage)
var kingText = mainComp.layers.addText("KING ALYATTES ACTOR\n(with royal costume)");
kingText.property("Position").setValue([compWidth/3, compHeight/2]);
var kingTextProp = kingText.property("Source Text").value;
kingTextProp.fontSize = 24;
kingTextProp.justification = ParagraphJustification.CENTER_JUSTIFY;
kingText.property("Source Text").setValue(kingTextProp);

// Animate the king's entrance
kingLayer.property("Position").setValueAtTime(0, [0-compWidth/3, compHeight/2]);
kingLayer.property("Position").setValueAtTime(3, [compWidth/3, compHeight/2]);
kingText.property("Position").setValueAtTime(0, [0-compWidth/3, compHeight/2]);
kingText.property("Position").setValueAtTime(3, [compWidth/3, compHeight/2]);

// ---- COIN PRESENTATION ----

// Create a coin layer
var coinLayer = mainComp.layers.addSolid([0.9, 0.8, 0.3], "Electrum Coin", 250, 250, 1.0);
coinLayer.property("Position").setValue([compWidth*0.7, compHeight/2]);
coinLayer.property("Scale").setValue([0, 0, 0]);

// Make the coin circular
var ellipseMask = coinLayer.Masks.addProperty("ADBE Mask Atom");
var myShape = new Shape();
myShape.vertices = [[0,0], [250,0], [250,250], [0,250]];
myShape.closed = true;
ellipseMask.property("ADBE Mask Shape").setValue(myShape);
ellipseMask.property("ADBE Mask Mode").setValue(1); // Add mode

// Add texture to the coin - using try/catch for compatibility
try {
    var fractalNoise = coinLayer.Effects.addProperty("Fractal Noise");
    fractalNoise.property("Contrast").setValue(150);
    fractalNoise.property("Brightness").setValue(-20);
    fractalNoise.property("Scale").setValue(200);
    fractalNoise.property("Complexity").setValue(3);
} catch (e) {
    try {
        // Alternative texture effect
        var turbulent = coinLayer.Effects.addProperty("Turbulent Noise");
        if (turbulent) {
            turbulent.property("Contrast").setValue(150);
            turbulent.property("Brightness").setValue(-20);
            turbulent.property("Scale").setValue(200);
            turbulent.property("Complexity").setValue(3);
        }
    } catch (e2) {
        alert("Could not add texture effect to coin: " + e2.message);
    }
}

// Add a stamp effect to represent the stamped design
var stampLayer = mainComp.layers.addSolid([0.1, 0.1, 0.1], "Coin Stamp", 150, 150, 1.0);
stampLayer.parent = coinLayer;
stampLayer.property("Position").setValue([125, 125]);
stampLayer.property("Opacity").setValue(80);

// Create a symbol for the stamp
var stampMask = stampLayer.Masks.addProperty("ADBE Mask Atom");
var stampShape = new Shape();
stampShape.vertices = [[50,50], [100,50], [100,100], [50,100]];
stampShape.closed = true;
stampMask.property("ADBE Mask Shape").setValue(stampShape);
stampMask.property("ADBE Mask Mode").setValue(1); // Add mode

// Add a secondary symbol
var symbolMask = stampLayer.Masks.addProperty("ADBE Mask Atom");
var symbolShape = new Shape();
symbolShape.vertices = [[75, 25], [125, 75], [75, 125], [25, 75]];
symbolShape.closed = true;
symbolMask.property("ADBE Mask Shape").setValue(symbolShape);
symbolMask.property("ADBE Mask Mode").setValue(1); // Add mode

// Animate the coin's reveal
coinLayer.property("Scale").setValueAtTime(10, [0, 0, 0]);
coinLayer.property("Scale").setValueAtTime(12, [100, 100, 100]);
coinLayer.property("Rotation").setValueAtTime(12, 0);
coinLayer.property("Rotation").setValueAtTime(15, 360*2);

// Add gleam effect to the coin
var gleamLayer = mainComp.layers.addSolid([1, 1, 1], "Coin Gleam", 300, 300, 1.0);
gleamLayer.parent = coinLayer;
gleamLayer.property("Position").setValue([125, 125]);
gleamLayer.property("Opacity").setValue(0);
gleamLayer.blendingMode = BlendingMode.ADD;

// Create a gleam shape
var gleamMask = gleamLayer.Masks.addProperty("ADBE Mask Atom");
var gleamShape = new Shape();
gleamShape.vertices = [[0, 125], [150, 0], [300, 125], [150, 250]];
gleamShape.closed = true;
gleamMask.property("ADBE Mask Shape").setValue(gleamShape);
gleamMask.property("ADBE Mask Feather").setValue([50, 50]);

// Animate the gleam
gleamLayer.property("Opacity").setValueAtTime(15, 0);
gleamLayer.property("Opacity").setValueAtTime(16, 80);
gleamLayer.property("Opacity").setValueAtTime(17, 0);

// ---- DIALOG CAPTIONS ----

// King Alyattes speech
var speechLayer = mainComp.layers.addText("\"Behold, people of Lydia! I present to you our kingdom's innovation - the first stamped coins of electrum!\"");
speechLayer.property("Position").setValue([compWidth/2, compHeight - 150]);
var speechTextProp = speechLayer.property("Source Text").value;
speechTextProp.fontSize = 32;
speechTextProp.justification = ParagraphJustification.CENTER_JUSTIFY;
speechLayer.property("Source Text").setValue(speechTextProp);

// Caption timing
speechLayer.property("Opacity").setValueAtTime(5, 0);
speechLayer.property("Opacity").setValueAtTime(6, 100);
speechLayer.property("Opacity").setValueAtTime(12, 100);
speechLayer.property("Opacity").setValueAtTime(13, 0);

// Final punchline caption
var punchlineLayer = mainComp.layers.addText("\"With these, my son Croesus will make our kingdom so wealthy that 'rich as Croesus' will echo through the ages!\"");
punchlineLayer.property("Position").setValue([compWidth/2, compHeight - 150]);
var punchlineTextProp = punchlineLayer.property("Source Text").value;
punchlineTextProp.fontSize = 32;
punchlineTextProp.justification = ParagraphJustification.CENTER_JUSTIFY;
punchlineTextProp.fillColor = [1, 0.8, 0.3]; // Gold color
punchlineLayer.property("Source Text").setValue(punchlineTextProp);

// Punchline timing
punchlineLayer.property("Opacity").setValueAtTime(20, 0);
punchlineLayer.property("Opacity").setValueAtTime(21, 100);
punchlineLayer.property("Opacity").setValueAtTime(28, 100);
punchlineLayer.property("Opacity").setValueAtTime(29, 0);

// ---- OUTRO ----

// Final text with historical context
var outroLayer = mainComp.layers.addText("The first coins were minted in Lydia around 600 BCE under King Alyattes,\nfather of the legendary wealthy King Croesus.");
outroLayer.property("Position").setValue([compWidth/2, compHeight/2]);
var outroTextProp = outroLayer.property("Source Text").value;
outroTextProp.fontSize = 36;
outroTextProp.justification = ParagraphJustification.CENTER_JUSTIFY;
outroTextProp.fillColor = [0.9, 0.8, 0.3]; // Gold color
outroLayer.property("Source Text").setValue(outroTextProp);

// Outro timing
outroLayer.property("Opacity").setValueAtTime(24, 0);
outroLayer.property("Opacity").setValueAtTime(25, 100);

// ---- AUDIO PLACEHOLDERS ----

// Add markers for sound effects and music
mainComp.markerProperty.setValueAtTime(0, new MarkerValue("Add dramatic music"));
mainComp.markerProperty.setValueAtTime(3, new MarkerValue("King entrance sound"));
mainComp.markerProperty.setValueAtTime(10, new MarkerValue("Coin reveal sound"));
mainComp.markerProperty.setValueAtTime(15, new MarkerValue("Gleam sound effect"));
mainComp.markerProperty.setValueAtTime(20, new MarkerValue("Dramatic pause"));
mainComp.markerProperty.setValueAtTime(21, new MarkerValue("Punchline music sting"));

// ---- CAMERA MOVEMENT ----

// Add a camera for dramatic shots
try {
    var camera = mainComp.layers.addCamera("Main Camera", [compWidth/2, compHeight/2]);
    camera.property("Position").setValue([compWidth/2, compHeight/2, -1500]);

    // Create camera movements
    camera.property("Position").setValueAtTime(0, [compWidth/2, compHeight/2, -1500]);
    camera.property("Position").setValueAtTime(10, [compWidth/2 - 200, compHeight/2, -1500]);
    camera.property("Position").setValueAtTime(12, [compWidth/2 + 200, compHeight/2, -1200]);
    camera.property("Position").setValueAtTime(20, [compWidth/2, compHeight/2, -1000]);
    camera.property("Position").setValueAtTime(25, [compWidth/2, compHeight/2, -1500]);
} catch (e) {
    alert("Could not create camera. This may be due to the composition not being set to 3D. Error: " + e.message);
}

// Try to save the project
try {
    var saveFile = new File("~/Desktop/King_Alyattes_Coin_Introduction.aep");
    project.save(saveFile);
    alert("King Alyattes Coin Introduction project successfully created and saved to desktop!");
} catch (e) {
    alert("Project created but could not save file automatically. Please use Save As... to save your project. Error: " + e.message);
}