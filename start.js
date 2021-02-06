//core functions

function preload() {
	mainFont=loadFont('odin.otf');
	
	select.loadData(['tutorial','fish']);
	
	tutorial.loadImages();
}

let sound={};

function setup() {
	createCanvas(windowWidth, windowHeight);
	ellipseMode(RADIUS);
	
	//default settings
	if (setting('playfieldJank')==null) localStorage.setItem('playfieldJank',true);
	if (setting('backgroundFX')==null) localStorage.setItem('backgroundFX',true);
	if (setting('fancyMenu')==null) localStorage.setItem('fancyMenu',true);
	
	['bg','bgfx','line','ghost','ui'].forEach(val => {
		document.getElementById(val+'Color').value	    = setting(val+'Color');
	});
	document.getElementById('globalOffset').value		= setting('globalOffset');
	document.getElementById('playfieldJank').checked    = setting('playfieldJank');
	document.getElementById('backgroundFX').checked	    = setting('backgroundFX');
	document.getElementById('noSongPalettes').checked	= setting('noSongPalettes');
	document.getElementById('fancyMenu').checked	    = setting('fancyMenu');
	
	sound.change=new Howl({
		src: ['assets/change.wav']
	});
	sound.diffUp=new Howl({
		src: ['assets/diffup.wav']
	});
	sound.diffDown=new Howl({
		src: ['assets/diffdown.wav']
	});
	sound.select=new Howl({
		src: ['assets/start.wav']
	});
	sound.increment=new Howl({
		src: ['assets/increment.wav']
	});
	sound.noodle=new Howl({
		src: ['assets/noodle.wav']
	});
	
	select.init();
}

function draw() {
	textFont(mainFont);
	
	if (state===SELECT || state===OPTIONS) {
		select.fxStep();
		
		select.draw(width,height);
	}
	
	if (state===GAME) {
		game.fxStep();
		game.timingStep();
		
		game.draw(width,height);
	}
	
	if (state===RESULTS) {
		results.fxStep();
		
		results.draw(width,height);
	}
}

function keyPressed() {
	
	if (state===GAME) {
		game.onKeyPress(keyCode);
		return;
	}
	
	if (state===SELECT && !select.starting) {
		select.onKeyPress(keyCode);
		return;
	}
	
	if (state===OPTIONS && keyCode==79) { //were quitting options
		select.quitOptions();
	}
	
	if (state===RESULTS) { //were quitting options
		results.onKeyPress(keyCode);
	}
	
}

function mousePressed() {
	
	if (state===SELECT) {
		select.onMousePress();
		return;
	}
	
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}