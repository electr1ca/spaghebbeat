const select = {
	ids: [],
	songData: {},
	music: {},
	jacket: {},
	fx: {
		fadeIn: 1,
		songTransition: 0,
		scoreTransition: 0,
		diffTransition: 0,
		diffEased: 0,
		palette: {},
		hover: {settings:0,link:0},
		starting: {bg:0,text:0,fadeout:0}
	},
	sound: {
		change: null,
		diffUp: null,
		diffDown: null,
		select: null
	},
	songLoaded: {},
	starting: false,
	
	tips: [
		"use LEFT/RIGHT to change song and UP/DOWN to change difficulty!",
		"you can quit a song at any time using ESCAPE.",
		"background effects provide performance feedback.\nthe more there are, the better you're doing!",
		"settings lets you modify gameplay visuals, like palettes or playfield shake.",
		"if your timing seems a little off, try changing your global offset!",
		"want to show off your score? right-click anywhere and save a screenshot!"
	],
	
	loadData: (ids) => {
		select.ids=ids;
		for (let i=0;i<ids.length;i++) {
			let id=ids[i];
			select.songData[id]=loadJSON('music/'+id+'.json');
			select.jacket[id]=loadImage('music/'+id+'.png');
		}
	},
	
	loadSongAndFadeIn: (id,pos) => {
		select.songLoaded[id]=false;
		select.music[id]=new Howl({
			src: ['music/'+id+'.mp3']
		});
		select.music[id].once('load', function(){
			select.songLoaded[id]=true;
			if (select.ids[select.selection]===id && state===SELECT) { //don't play preview if we went elsewhere!!
				select.music[id].seek(pos);
				select.music[id].play();
				select.music[id].fade(0,1,300);
			}
		});
	},
	
	selection: 0,
	prevSelection: 0,
	
	difficulty: 0,
	prevDifficulty: 0,
	desiredDifficulty: 0,
	getDiff: (diff) => {
		if (!DIFF[diff]) return null;
		return select.songData[select.ids[select.selection]][DIFF[diff]];
	},
	
	calcTotalNotes: (patterns) => {
		let n=0;
		for (let i=0;i<patterns.length;i++) {
			n+=patterns[i].notes.length-1;
		}
		return n;
	},
	
	init: () => {
		select.starting = false;
		select.fx.fadeIn = 1;
		select.fx.starting = {bg:0,text:0,fadeout:0};
		
		if (!select.songLoaded[select.ids[select.selection]]) {
			select.loadSongAndFadeIn(select.ids[select.selection],select.songData[select.ids[select.selection]].preview);
		} else {
			select.music[select.ids[select.selection]].seek(select.songData[select.ids[select.selection]].preview);
			select.music[select.ids[select.selection]].play();
			select.music[select.ids[select.selection]].fade(0,1,300);
		}
	},
	
	fxStep: () => {
		select.fx.fadeIn+=(0-select.fx.fadeIn)/6;
		
		select.fx.scoreTransition+=(1-select.fx.scoreTransition)/6;
		select.fx.songTransition+=(0-select.fx.songTransition)*delta()/6;
		select.fx.diffTransition+=(0-select.fx.diffTransition)/3;
		select.fx.diffEased+=(select.songData[select.ids[select.selection]][DIFF[select.difficulty]]-select.fx.diffEased)/5;
		
		let song=select.songData[select.ids[select.selection]];
		let prevSong=select.songData[select.ids[select.prevSelection]];
		if (!setting('noSongPalettes')) {
			select.fx.palette = {
				bg: lerpColor(color(prevSong.palette.bg),color(song.palette.bg),1-abs(select.fx.songTransition)),
				bgfx: lerpColor(color(prevSong.palette.bgfx),color(song.palette.bgfx),1-abs(select.fx.songTransition)),
				ghost: lerpColor(color(prevSong.palette.ghost),color(song.palette.ghost),1-abs(select.fx.songTransition)),
				line: lerpColor(color(prevSong.palette.line),color(song.palette.line),1-abs(select.fx.songTransition)),
				ui: lerpColor(color(prevSong.palette.ui),color(song.palette.ui),1-abs(select.fx.songTransition))
			}
		} else {
			select.fx.palette = {
				bg: color(setting("bgColor")),
				bgfx: color(setting("bgfxColor")),
				ghost: color(setting("ghostColor")),
				line: color(setting("lineColor")),
				ui: color(setting("uiColor"))
			}
		}
		
		if (mouseInArea(0,0,290,90,height/900)) {
			select.fx.hover.settings+=(1-select.fx.hover.settings)/4;
		} else {
			select.fx.hover.settings+=(0-select.fx.hover.settings)/4;
		}
		if (mouseInArea(290,0,340,90,height/900)) {
			select.fx.hover.link+=(1-select.fx.hover.link)/4;
		} else {
			select.fx.hover.link+=(0-select.fx.hover.link)/4;
		}
		
		if (select.starting) {
			select.fx.starting.bg+=(1-select.fx.starting.bg)*delta()/5;
			select.fx.starting.text+=(1-select.fx.starting.text)*delta()/7;
			if (select.fx.starting.text>0.9996) {
				select.fx.starting.fadeout+=0.05*delta();
				if (select.fx.starting.fadeout>=1) {
					select.startSong();
				}
			}
		}
	},
	
	drawToolbar: (x,y,w,h) => { //i know this is long sorry.
		w=w*1/(h/900);
		
		push();
		translate(x,y);
		scale(h/900);
			
		select.drawScore(100,200,h);
		
		blendMode(OVERLAY);
		fill(0,150);
		noStroke();
		rect(0,0,w,90);
		
		textFont('Verdana');
		noStroke();
		fill(0,220);
		textAlign(CENTER,CENTER);
		textSize(60);
		text("⛭",40,50-select.fx.hover.settings*5);
		
		textFont(mainFont);
		stroke(0,100);
		strokeWeight(5);
		textAlign(LEFT,CENTER);
		textSize(40);
		text("settings (O)",75,40);
		blendMode(BLEND);
		noStroke();
		fill(255);
		text("settings (O)",75,40);
		
		fill(255,select.fx.hover.settings*60);
		rect(0,0,290,90);
		
		blendMode(OVERLAY);
		textFont('Verdana');
		noStroke();
		fill(0,220);
		textAlign(CENTER,CENTER);
		textSize(60);
		text("♫",325,50-select.fx.hover.link*5);
		
		textFont(mainFont);
		stroke(0,100);
		strokeWeight(5);
		textAlign(LEFT,CENTER);
		textSize(40);
		text("link to song (M)",360,40);
		blendMode(BLEND);
		noStroke();
		fill(255);
		text("link to song (M)",360,40);
		
		fill(255,select.fx.hover.link*60);
		rect(290,0,340,90);
		
		blendMode(OVERLAY); 
		noFill();
		stroke(0,clamp(abs(sin(frameCount*PI/500))*5,1,0)*100); //fadein fadeout tips :S
		textAlign(RIGHT,CENTER);
		textSize(20);
		text(select.tips[floor(frameCount/500)%select.tips.length],w-30,43);
		blendMode(BLEND);
		noStroke();
		fill(255,clamp(abs(sin(frameCount*PI/500))*5,1,0)*200);
		text(select.tips[floor(frameCount/500)%select.tips.length],w-30,43);
			
		pop();
	},
	
	drawToolbarFast: (x,y,w,h) => { //no overlay and less text drawn
		w=w*1/(h/900);
		
		push();
		translate(x,y);
		scale(h/900);
			
		select.drawScore(100,200,h);
		
		fill(0,100);
		noStroke();
		rect(0,0,w,90);
		
		textFont('Verdana');
		noStroke();
		fill(255,150);
		textAlign(CENTER,CENTER);
		textSize(60);
		text("⛭",40,50-select.fx.hover.settings*5);
		
		textFont(mainFont);
		stroke(0,50);
		strokeWeight(5);
		textAlign(LEFT,CENTER);
		textSize(40);
		fill(255);
		text("settings (O)",75,40);
		
		fill(255,select.fx.hover.settings*60);
		noStroke();
		rect(0,0,290,90);
		
		textFont('Verdana');
		noStroke();
		fill(255,150);
		textAlign(CENTER,CENTER);
		textSize(60);
		text("♫",325,50-select.fx.hover.link*5);
		
		textFont(mainFont);
		stroke(0,50);
		strokeWeight(5);
		textAlign(LEFT,CENTER);
		textSize(40);
		fill(255);
		text("link to song (M)",360,40);
		
		fill(255,select.fx.hover.link*60);
		noStroke();
		rect(290,0,340,90);
		 
		noStroke();
		textAlign(RIGHT,CENTER);
		textSize(20);
		fill(255,clamp(abs(sin(frameCount*PI/500))*5,1,0)*150);
		text(select.tips[floor(frameCount/500)%select.tips.length],w-30,43);
			
		pop();
	},
	
	drawSongInfo: (x,y,h) => {
		let song=select.songData[select.ids[select.selection]];
		
		push();
		translate(x,y);
		scale(h/900);
		
		stroke(255);
		strokeWeight(11);
		fill(select.fx.palette.line);
		textAlign(LEFT,BOTTOM);
		if (setting('fancyMenu')) {
			textSize(120);
			push();
			translate(30+select.fx.songTransition*20,0);
			if (textWidth(song.title)*(height/900)>width-750*(height/900)) scale((width-750*(height/900))/(textWidth(song.title)*(height/900)),1);
			textEmboss(song.title,0,-290);
			pop();
			textSize(70);
			textEmboss(song.artist,30+select.fx.songTransition*10,-230); //title and artist
		} else {
			textSize(120);
			text(song.title,30+select.fx.songTransition*20,-290);
			textSize(70);
			text(song.artist,30+select.fx.songTransition*10,-230); //title and artist
		}
		
		noStroke();
		fill(select.fx.palette.bg);
		textSize(40);
		if (!select.songLoaded[select.ids[select.selection]]) {
			text("length: ...",30+select.fx.songTransition*10,-420);
		} else {
			text("length: "+floor(select.music[select.ids[select.selection]].duration()/60)+
				":"+(select.music[select.ids[select.selection]].duration()%60<10?"0":"")+
				floor(select.music[select.ids[select.selection]].duration()%60),30+select.fx.songTransition*10,-420);
		}
		
		if (song.bpmChanges) {
			let max=song.bpm, min=song.bpm;
			for (let i=0;i<song.bpmChanges.length;i++) {
				let b=song.bpmChanges[i];
				if (b.bpm>max) max=b.bpm;
				if (b.bpm<min) min=b.bpm;
			}
			text("bpm: "+min+"-"+max,30+select.fx.songTransition*10,-460);
		} else {
			text("bpm: "+song.bpm,30+select.fx.songTransition*10,-460);
		}
		text("notes: "+select.calcTotalNotes(song.patterns[DIFF[select.difficulty]]),30+select.fx.songTransition*10,-500);
			
		pop();
	},
	
	drawJackets: (x,y,w,h) => {
		let len=Object.keys(select.ids).length;
		
		push();
		
		translate(x,y);
		
		scale(h/900);
		
		noStroke();
		fill(255);
		rect(-w*1/(h/900),-210,w*1/(h/900),10); //outline jackets
		
		let beat=0.999;
		try {
			beat=game.calcSongBeat(select.songData[select.ids[select.selection]],select.music[select.ids[select.selection]].seek());
		} catch (e) {};
		if (!beat) beat=0.999;
		
		if (setting('fancyMenu')) {
			blendMode(OVERLAY);
		}
		fill(255,70);
		circle(-400,-200,300+tweenCircOut(beat-floor(beat),40,-40,1)); //bg beat circle
		blendMode(BLEND);
		
		if (setting('fancyMenu')) {
			noFill();
			stroke(255,210-sin(beat*PI)*45); // left/right arrows
			strokeWeight(10);
			for (let i=0;i<2;i++) {
				beginShape();
				vertex(-650-i*40+(select.fx.songTransition<0?(select.fx.songTransition*20):0)-sin(beat*PI)*2, -300);
				vertex(-680-i*40+(select.fx.songTransition<0?(select.fx.songTransition*20):0)-sin(beat*PI)*2, -270);
				vertex(-650-i*40+(select.fx.songTransition<0?(select.fx.songTransition*20):0)-sin(beat*PI)*2, -240);
				endShape();
				beginShape();
				vertex(-150+i*40+(select.fx.songTransition>0?(select.fx.songTransition*20):0)+sin(beat*PI)*2, -300);
				vertex(-120+i*40+(select.fx.songTransition>0?(select.fx.songTransition*20):0)+sin(beat*PI)*2, -270);
				vertex(-150+i*40+(select.fx.songTransition>0?(select.fx.songTransition*20):0)+sin(beat*PI)*2, -240);
				endShape();
			}
		}
		
		for (let i=-1;i<((w*1/(h/900))-600)/200+1;i++) {
			let ind=mod(select.selection-i-1,len);
			image(select.jacket[select.ids[ind]],-800-i*200+select.fx.songTransition*200,-200,200,200); //jackets left
		}
		
		image(select.jacket[select.ids[mod(select.selection+1,len)]],-200+select.fx.songTransition*200,-200,200,200); //jackets right
		image(select.jacket[select.ids[mod(select.selection+1+sign(select.fx.songTransition*-1),len)]],
			-200+select.fx.songTransition*200+200*sign(select.fx.songTransition*-1),
			-200,200,200);
		
		image(select.jacket[select.ids[select.prevSelection]],-600,-400,400,400,
			(200-abs(select.fx.songTransition)*200)*sign(select.fx.songTransition),0); //mian jacket
		image(select.jacket[select.ids[select.selection]],-600,-400,400,400,select.fx.songTransition*-400,0);
		if (!select.songLoaded[select.ids[select.selection]]) {
			fill(0,150);
			noStroke();
			rect(-600,-400,400,400);
			
			fill(255);
			textAlign(CENTER,CENTER);
			textSize(30);
			text("loading...",-400,-200);
		}
		
		select.drawDifficulty(-600,-400); //diff
		
		pop();
	},
	
	drawDifficulty: (x,y,w) => {
		push();
		translate(x,y);
		
		let song=select.songData[select.ids[select.selection]];
		
		let beat=0.999;
		try {
			beat=game.calcSongBeat(select.songData[select.ids[select.selection]],
				select.music[select.ids[select.selection]].seek());
		} catch (e) {};
		if (!beat) beat=0.999;
		
		fill(lerpColor(color(DIFFCOLOR[select.prevDifficulty]),
			color(DIFFCOLOR[select.difficulty]),
			1-abs(select.fx.diffTransition)));
		stroke(255);
		strokeWeight(10);
		circle(0,0,60+tweenCircOut(beat-floor(beat),10,-10,1));
		
		stroke(255);
		strokeWeight(10);
		textSize(80);
		textAlign(CENTER,CENTER);
		text(round(select.fx.diffEased),0,-9);
		
		textSize(40);
		let h=0;
		for (var i=DIFF.length;i>=0;i--) {
			strokeWeight(7+(select.difficulty==i ? 5-abs(select.fx.diffTransition)*5 : 
				(select.prevDifficulty==i ? 5*abs(select.fx.diffTransition) : 0)));
			let d=song[DIFF[i]];
			if (d) {
				fill(color(DIFFCOLOR[i]));
				text(d,0,90+h*40)
				h+=1;
			}
		}
		
		strokeWeight(10);
		fill(color(DIFFCOLOR[select.difficulty]));
		textSize(50);
		textAlign(LEFT,CENTER);
		text(DIFF[select.difficulty],56,-6+select.fx.diffTransition*10);
		
		pop();
	},
	
	drawScore: (x,y,h) => {
		let score=JSON.parse(localStorage.getItem(select.ids[select.selection]+select.difficulty));
		
		push();
		translate(x,y);
		
		stroke(select.fx.palette.bg);
		strokeWeight(100);
		line(0,0,300,0);
		
		noStroke();
		fill(select.fx.palette.bg);
		circle(0,0,80);
		
		stroke(255);
		strokeWeight(30);
		fill(select.fx.palette.line);
		textAlign(CENTER,CENTER);
		textSize(130);
		if (score) {
			game.drawPlayfieldPointsSnake(0,0,
				results.gradePoints[results.getGrade(score.percent)],0,30,
				select.fx.scoreTransition);
			stroke(select.fx.palette.line);
			strokeWeight(20);
			game.drawPlayfieldPointsSnake(0,0,
				results.gradePoints[results.getGrade(score.percent)],0,30,
				select.fx.scoreTransition);
			textSize(60);
			textAlign(LEFT,BOTTOM);
			stroke(255);
			strokeWeight(10);
			fill(select.fx.palette.ui);
			text(score.percent.toFixed(2)+'%',70,20);
			textSize(32);
			fill(select.fx.palette.bgfx);
			noStroke();
			textAlign(LEFT,TOP);
			if (score.maxCombo==score.totalNotes) {
				text("full combo!",70,10);
			} else {
				text("max combo: "+score.maxCombo+"x",70,10);
			}
		} else {
			game.drawPlayfieldPointsSnake(0,0,				//HUH?? WHAT??????
				results.gradePoints['?'],0,30,
				select.fx.scoreTransition);
			stroke(select.fx.palette.line);
			strokeWeight(20);
			game.drawPlayfieldPointsSnake(0,0,
				results.gradePoints['?'],0,30,
				select.fx.scoreTransition);
			noStroke();
			fill(255);
			circle(0,30,15);
			fill(select.fx.palette.line);
			circle(0,30,10);
			textSize(24);
			fill(select.fx.palette.bgfx);
			noStroke();
			textAlign(LEFT,CENTER);
			text("you haven't played\nthis chart yet!",70,-5);
		}
		

		
		pop();
	},
	
	drawSongStarting: (w,h) => {
		let song=select.songData[select.ids[select.selection]];
		
		push();
		translate(w/2,h/2);
		
		scale(h/900);
		
		background(select.fx.palette.bg._getRed(),
			select.fx.palette.bg._getGreen(),
			select.fx.palette.bg._getBlue(),
			select.fx.starting.bg*255);
			
		noStroke();
		fill(select.fx.palette.bgfx._getRed(),
			select.fx.palette.bgfx._getGreen(),
			select.fx.palette.bgfx._getBlue(),
			select.fx.starting.bg*255);
		ellipse(0,0,500-200*select.fx.starting.text);
			
		strokeWeight(10);
		stroke(255);
		fill(select.fx.palette.line);
		textAlign(CENTER,CENTER);
		if (setting('fancyMenu')) {
			textSize(1000-900*select.fx.starting.text);
			textEmboss(song.title,0,-30-800*(1-select.fx.starting.bg));
			textSize(500-450*select.fx.starting.text);
			textEmboss(song.artist,0,60+400*(1-select.fx.starting.bg));
		} else {
			textSize(1000-900*select.fx.starting.text);
			text(song.title,0,-30-800*(1-select.fx.starting.bg));
			textSize(500-450*select.fx.starting.text);
			text(song.artist,0,60+400*(1-select.fx.starting.bg));
		}
		
		background(select.fx.palette.bg._getRed(),
			select.fx.palette.bg._getGreen(),
			select.fx.palette.bg._getBlue(),
			select.fx.starting.fadeout*255);
			
		pop();
	},
	
	drawBGCircles: (x,y,h) => {
		push();
		translate(x,y);
		
		scale(h/900);
		
		let div=10;
		
		blendMode(OVERLAY);
		strokeWeight(20);
		noFill();
		for (let i=0;i<7;i++) {
			let yy=i*128-frameCount/2;
			yy=yy-floor(yy/900)*900;
			stroke(255,(yy*(255/900))/4);
			circle(-400,yy,40);
		}
		blendMode(BLEND);
		
		pop();
	},
	
	drawBGCookie: (x,y,w,h) => {
		push();
		translate(x,y);
		
		noStroke();
		fill(select.fx.palette.bg); 
		circle(0,0,w*2/3); 
		
		if (select.fx.fadeIn<0.999) {
			scale(1-select.fx.fadeIn);
		}
		fill(select.fx.palette.bgfx); 
		circle(0,0,w/2); 
		for (let i=0;i<20;i++) {
			fill(select.fx.palette.bgfx); 
			circle(sin(i*PI/10+frameCount*0.001)*(w*0.46),cos(i*PI/10+frameCount*0.001)*(w*0.46),w*0.056);
			
			fill(select.fx.palette.bg);
			circle(sin(i*PI/10+PI/20+frameCount*0.001)*(w*0.54),cos(i*PI/10+PI/20+frameCount*0.001)*(w*0.54),w*0.056);
		}
		pop(); //bg circle wave thing
	},
	
	draw: (w,h) => {
		let song=select.songData[select.ids[select.selection]];
		let prevSong=select.songData[select.ids[select.prevSelection]];
		
		if (!select.starting) {
			
			if (setting('fancyMenu')) {
				image(select.jacket[select.ids[select.selection]],w-h,0,h,h);
				background(withAlpha(select.fx.palette.bg,275-40*(1-abs(select.fx.songTransition))));
			} else {
				background(select.fx.palette.bg); //bg colour
			}
			
			if (setting('fancyMenu')) {
				select.drawBGCircles(w,0,h);
			}
			
			select.drawBGCookie(0,h*2/3,w,h);
			
			//gradient(0,h/2,w,h*2/3,withAlpha(select.fx.palette.bg,0),select.fx.palette.bg,false);
			
			select.drawSongInfo(0,h+h*select.fx.fadeIn/5,h);
			
			select.drawJackets(w,h+h*select.fx.fadeIn/5,w,h);
			if (setting('fancyMenu')) {
				select.drawToolbar(0,-h*select.fx.fadeIn/10,w,h);
			} else {
				select.drawToolbarFast(0,-h*select.fx.fadeIn/10,w,h);
			}
		} else {
			select.drawSongStarting(w,h);
		}
		
		background(select.fx.palette.bg._getRed(),
			select.fx.palette.bg._getGreen(),
			select.fx.palette.bg._getBlue(),
			select.fx.fadeIn*255);
	},
	
	onMousePress: () => {
		if (mouseInArea(0,0,290,90,height/900)) { //clicked settings
			let eContainer=document.getElementById('settings-cover');
			if (state==SELECT) {
				let bgc=color(select.fx.palette.bg);
				eContainer.style.backgroundColor="rgba("+bgc._getRed()+","+
					bgc._getGreen()+","+
					bgc._getBlue()+",0.6)";
				eContainer.style.display="flex";
				select.music[select.ids[select.selection]].fade(1,0.5,200);
				state=OPTIONS;
			}
		} else if (mouseInArea(290,0,340,90,height/900)) { //clicked link to song
			window.open(select.songData[select.ids[select.selection]].url);
		}
		
		if (mouseInArea(-600,-400,400,400,height/900,width,height)) { //start song
			sound.select.play();
			select.music[select.ids[select.selection]].fade(1,0,1000);
			select.starting=true;
		}
		if (mouseInArea(-200,-200,200,200,height/900,width,height)) { //right song
			select.songChange(1);
		}
		if (mouseY>height-200*(height/900) && mouseX<width-600*(height/900)) { //left song
			select.songChange(-floor((width-mouseX-600*(height/900))/(200*(height/900)))-1);
		}
	},
	
	onKeyPress: (key) => {
		if (key==37) {
			select.songChange(-1);
		} else if (key==39) {
			select.songChange(1);
		} else if (key==38) {
			select.diffChange(1);
		} else if (key==40) {
			select.diffChange(-1);
		} 
		
		else if ((key==32 || key==13) && select.songLoaded[select.ids[select.selection]]) {
			sound.select.play();
			select.music[select.ids[select.selection]].fade(1,0,1000);
			select.starting=true;
		} 
		
		else if (key==77) {
			window.open(select.songData[select.ids[select.selection]].url);
		}
		
		else if (key==79) {
			let eContainer=document.getElementById('settings-cover');
			if (state==SELECT) {
				let bgc=color(select.songData[select.ids[select.selection]].palette.bg);
				eContainer.style.backgroundColor="rgba("+bgc._getRed()+","+
					bgc._getGreen()+","+
					bgc._getBlue()+",0.6)";
				eContainer.style.display="flex";
				select.music[select.ids[select.selection]].fade(1,0.5,200);
				state=OPTIONS;
			}
		}
	},
	
	songChange: (delta) => {
		sound.change.play();
		
		select.music[select.ids[select.selection]].stop();
		
		select.prevSelection = select.selection;
		select.selection = mod(select.selection+delta,select.ids.length);
		
		if (!select.songLoaded[select.ids[select.selection]]) {
			select.loadSongAndFadeIn(select.ids[select.selection],select.songData[select.ids[select.selection]].preview);
		} else {
			select.music[select.ids[select.selection]].seek(select.songData[select.ids[select.selection]].preview);
			select.music[select.ids[select.selection]].play();
			select.music[select.ids[select.selection]].fade(0,1,300);
		}
		
		select.fx.songTransition = delta;
		select.fx.scoreTransition = 0;
		
		if (select.getDiff([select.desiredDifficulty])) {
			select.difficulty = select.desiredDifficulty;
		} else {
			if (select.desiredDifficulty==2) {
				if (select.getDiff(1)) select.difficulty = 1;
				else if (select.getDiff(0)) select.difficulty = 0;
			} else if (select.desiredDifficulty==1) {
				if (select.getDiff(0)) select.difficulty = 0;
				else if (select.getDiff(2)) select.difficulty = 2;
			} else if (select.desiredDifficulty==0) {
				if (select.getDiff(1)) select.difficulty = 1;
				else if (select.getDiff(2)) select.difficulty = 2;
			}
		}
	},
	diffChange: (delta) => {
		if (select.getDiff([select.difficulty+delta])) {
			if (delta>0) sound.diffUp.play();
			else sound.diffDown.play();
			
			select.fx.diffTransition = delta;
			select.fx.scoreTransition = 0;
			
			select.prevDifficulty = select.difficulty;
			select.difficulty = select.difficulty+delta;
			select.desiredDifficulty = select.difficulty;
		}
	},
	
	startSong: () => {
		select.music[select.ids[select.selection]].stop();
		select.music[select.ids[select.selection]].volume(1);
		
		game.init(select.songData[select.ids[select.selection]],
			select.difficulty,
			select.music[select.ids[select.selection]]);
		state=GAME;
	},
	
	quitOptions: () => {
		['bg','bgfx','line','ghost','ui'].forEach(val => {
			localStorage.setItem(val+'Color',document.getElementById(val+'Color').value);
		});
		localStorage.setItem('globalOffset',document.getElementById('globalOffset').value); //set settings
		localStorage.setItem('playfieldJank',document.getElementById('playfieldJank').checked);
		localStorage.setItem('backgroundFX',document.getElementById('backgroundFX').checked);
		localStorage.setItem('noSongPalettes',document.getElementById('noSongPalettes').checked);
		localStorage.setItem('fancyMenu',document.getElementById('fancyMenu').checked);
		
		state=SELECT;
		select.music[select.ids[select.selection]].fade(0.5,1,200);
		document.getElementById('settings-cover').style.display="none";
	}
}