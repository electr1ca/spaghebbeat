const game = {
	pattern: {
		playerPos: 0,
		playerDist: 0,
		ind: 0,
		center: {x:0,y:0},
		lastHitBeat: 0
	},
	scoring: {
		hitNotes: 0,
		ok: 0,
		nice: 0,
		miss: 0,
		combo: 0,
		maxCombo: 0,
		totalNotes: 0,
		percent: 0,
	},
	fx: {
		patternTransition: {x:0,y:0,scale:0,mult:1,ghostSnake:0,linear:0,circ:1},
		noteHit: {ease:1,rotation:0,circX:0,circY:0,linearX:0,linearY:0,elasticX:0,elasticY:0,uiEase:0},
		bgParticles: [],
		fade: 1
	},
	timing: {
		ok: 0.15,
		nice: 0.03
	},
	diff: null,
	ending: false,
	
	init: (data,diff,song) => {
		game.diff = diff;
		game.songData = Object.assign({},data);
		game.song = song;
		game.song.on('end', function(){
			if (state===GAME) {
				game.ending=true;
			}
		});
		
		if (!setting("noSongPalettes")) {
			for (let c in game.songData.palette) {
				game.songData.palette[c] = color(game.songData.palette[c]);
			}
		} else {
			game.songData.palette = {
				bg: color(setting("bgColor")),
				bgfx: color(setting("bgfxColor")),
				ghost: color(setting("ghostColor")),
				line: color(setting("lineColor")),
				ui: color(setting("uiColor"))
			}
			// game.songData.palette = {
				// bg: color("#26AF56"),
				// bgfx: color("#3FC66E"),
				// ghost: color("#209449"),
				// line: color("#E13131"),
				// ui: color("#31E16F")
			// }
		}
		
		game.patterns = data.patterns[DIFF[diff]];
		for (let n in game.patterns) {
			game.scoring.totalNotes+=game.patterns[n].notes.length-1;
		}
	},
	
	calcSongBeat: (data=game.songData,pos) => {
		if (!pos) pos=game.song.seek();
		
		if (data.bpmChanges) {
			let bt=0, off=0, bpm=data.bpm;
			for (let i=0;i<data.bpmChanges.length;i++) {
				let b=data.bpmChanges[i];
				if (pos>b.start) {
					bt+=(b.start-off)/60*bpm;
					off=b.start;
					bpm=b.bpm;
				} else break;
			}
			return ((pos-off+data.offset+parseFloat(setting('globalOffset')))/60*bpm+bt);
		} else {
			return (pos+data.offset+parseFloat(setting('globalOffset')))/60*data.bpm;
		}
	},
	calcSongPos: (data=game.songData,pos) => {
		if (!pos) pos=game.song.seek();
		return (pos+data.offset+parseFloat(setting('globalOffset')));
	},
	calcPlayerDist: (pattern,pos) => {
		return abs(pattern[pos].y-pattern[pos-1].y)+abs(pattern[pos].x-pattern[pos-1].x);
	},
	calcCenter: (pattern) => {
		let mx={x:0,y:0}, mn={x:0,y:0};
		for (let j=0;j<pattern.length;j++) {
			if (pattern[j].x>mx.x) mx.x=pattern[j].x;
			if (pattern[j].y>mx.y) mx.y=pattern[j].y;
			if (pattern[j].x<mn.x) mn.x=pattern[j].x;
			if (pattern[j].y<mn.y) mn.y=pattern[j].y;
		}
		
		return {x:(mx.x+mn.x)/2,y:(mx.y+mn.y)/2};
	},
	calcTotalDistance: (pattern,len=pattern.length-1) => {
		let dist=0;
		for (let i=0;i<len;i++) {
			dist+=abs(pattern[i+1].x-pattern[i].x)+
				  abs(pattern[i+1].y-pattern[i].y);
		}
		return dist;
	},
	calcHitTiming: () => {
		let pattern = game.patterns[game.pattern.ind];
		let targetTime = pattern.start+
						 game.pattern.playerDist+
						 abs(pattern.notes[game.pattern.playerPos+1].x-pattern.notes[game.pattern.playerPos].x)+
						 abs(pattern.notes[game.pattern.playerPos+1].y-pattern.notes[game.pattern.playerPos].y);
		
		if (game.songData.bpmChanges) {
			let bt=0, off=0, bpm=game.songData.bpm, newTime=0;
			for (let i=0;i<game.songData.bpmChanges.length;i++) {
				let b=game.songData.bpmChanges[i];
				if (targetTime<bt+(b.start-off)/60*bpm) {
					break;
				} else {
					bt+=(b.start-off)/60*bpm;
					off=b.start;
					bpm=b.bpm;
				}
			}
			newTime=off+(targetTime-bt)/bpm*60;
			console.log(newTime);
			targetTime=newTime;
		} else {
			targetTime = targetTime/game.songData.bpm*60;
		}
		
		return targetTime-game.calcSongPos();
	},
	calcPercentScore: () => {
		return (game.scoring.ok*0.6+game.scoring.nice)/game.scoring.totalNotes*100;
	},
	
	getDirection: () => {
		let pattern=game.patterns[game.pattern.ind].notes;
		let point1=pattern[game.pattern.playerPos], point2=pattern[game.pattern.playerPos+1];
		return atan2(point2.y-point1.y,point2.x-point1.x)+PI/2;
	},
	getDirectionKey: () => {
		switch (game.getDirection()) {
			case PI*3/2: return LEFT_ARROW
			case PI: return DOWN_ARROW
			case PI/2: return RIGHT_ARROW
			case 0: return UP_ARROW
		}
		return null;
	},
	
	createBigRipple: (x,y,nice) => {
		game.fx.bgParticles.push({
			x: x,
			y: y,
			ease: 0,
			type: BIG
		});
		if (nice) {
			for (var i=0;i<2+random()*2;i++) {
				game.fx.bgParticles.push({
					x: x,
					y: y,
					ease: 0,
					colorease: 0,
					dir: random()*PI*2,
					mag: 30+random()*60,
					type: BUBBLE
				});
			}
		}
	},
	createSmallRipple: (x,y) => {
		game.fx.bgParticles.push({
			x: x,
			y: y,
			ease: 0,
			type: SMALL
		});
	},
	createClearText: (x,y,p) => {
		game.fx.bgParticles.push({
			x: x,
			y: y,
			ease: 0,
			colorease: 0,
			type: PCLEAR,
			perfect: p
		});
	},
	
	fxStep: () => {
		if (game.ending) {
			game.fx.fade+=0.1;
			if (game.fx.fade>=1) {
				let ps=JSON.parse(localStorage.getItem(game.songData.id+game.diff));
				if (!ps || ps.percent<game.scoring.percent) {
					localStorage.setItem(game.songData.id+game.diff,JSON.stringify(game.scoring));
				}
				results.init(game.scoring,game.songData,game.diff);
				state=RESULTS;
				game.reset();
			};
		} else {
			game.fx.fade+=sign(game.fx.fade)*-0.1;
		}
		
		game.fx.patternTransition.x+=(0-game.fx.patternTransition.x)/8;
		game.fx.patternTransition.y+=(0-game.fx.patternTransition.y)/8;
		game.fx.patternTransition.scale+=(0-game.fx.patternTransition.scale)/4;
		game.fx.patternTransition.linear-=sign(game.fx.patternTransition.linear)/30;
		game.fx.patternTransition.circ=tweenCircOut(1-game.fx.patternTransition.linear,0,1,1);
		
		game.fx.patternTransition.ghostSnake+=(1-game.fx.patternTransition.ghostSnake)/10;
		
		if (game.patterns[game.pattern.ind]) {
			game.fx.patternTransition.mult+=(game.patterns[game.pattern.ind].scale-game.fx.patternTransition.mult)/8;
		
			let center=game.calcCenter(game.patterns[game.pattern.ind].notes);
			game.pattern.center.x+=(center.x-game.pattern.center.x)/8;
			game.pattern.center.y+=(center.y-game.pattern.center.y)/8;
		}
		
		if (setting('playfieldJank')) {
			game.fx.noteHit.linearX-=sign(game.fx.noteHit.linearX)/50;
			game.fx.noteHit.linearY-=sign(game.fx.noteHit.linearY)/50;
			game.fx.noteHit.elasticX=tweenElasticOut(1-abs(game.fx.noteHit.linearX),1,-1,1)*sign(game.fx.noteHit.linearX);
			game.fx.noteHit.elasticY=tweenElasticOut(1-abs(game.fx.noteHit.linearY),1,-1,1)*sign(game.fx.noteHit.linearY);
			game.fx.noteHit.circX=tweenCircOut(min(0.5,1-abs(game.fx.noteHit.linearX)),1,-1,0.5)*sign(game.fx.noteHit.linearX);
			game.fx.noteHit.circY=tweenCircOut(min(0.5,1-abs(game.fx.noteHit.linearY)),1,-1,0.5)*sign(game.fx.noteHit.linearY);
			game.fx.noteHit.ease+=(1-game.fx.noteHit.ease)/6;
			game.fx.noteHit.rotation+=(0-game.fx.noteHit.rotation)/6;
		} else {
			game.fx.noteHit = Object.assign(game.fx.noteHit,
				{ease:1,rotation:0,circX:0,circY:0,linearX:0,linearY:0,elasticX:0,elasticY:0});
		}
		
		game.fx.noteHit.uiEase+=(0-game.fx.noteHit.uiEase)/3;
		
		for (let i=0;i<game.fx.bgParticles.length;i++) {
			let p=game.fx.bgParticles[i];
			let e=7;
			if (p.type==SMALL) e=3;
			
			p.ease+=(1-p.ease)/e;
			if (p.type==BUBBLE) p.colorease+=(1-p.colorease)/14;
			if (p.type==PCLEAR) p.colorease+=1;
			if (p.ease>0.999 && p.type!=PCLEAR || p.type==PCLEAR && p.colorease>=60) game.fx.bgParticles.splice(i,1);
		}
	},
	timingStep: () => {
		if (game.patterns[game.pattern.ind] && game.calcHitTiming()<-game.timing.ok) game.missNote();
		if (keyIsDown(80)) game.song.rate(50);
		else game.song.rate(1);
		
		if (game.songData.id==="tutorial") {
			tutorial.update(game.calcSongBeat());
		}
	},
	
	drawStats: (x,y) => {
		push();
		
		let bpm=game.songData.bpm, off=0;
		for (let i=0;i<game.songData.bpmChanges.length;i++) {
			let b=game.songData.bpmChanges[i];
			if (game.song.seek()>b.start) {
				bpm=b.bpm;
				off=b.start;
			} else break;
		}
		
		fill(255);
		stroke(0);
		strokeWeight(3);
		textSize(18);
		text("beat:     "+game.calcSongBeat().toFixed(3)+"\n"+
			 "seconds: "+game.calcSongPos().toFixed(3)+"\n"+
			 "bpm:      "+bpm+" since "+off+"s",120,200);
		
		pop();
	},
	drawTimeBar: (x,y,w) => {
		push();
		translate(x,y);
		
		stroke(game.songData.palette.bgfx);
		strokeWeight(20);
		line(0,0,0+w,0);
		
		stroke(255,150);
		strokeWeight(14);
		line(0,0,0+w*(game.calcSongPos()/game.song.duration())+(game.ending?w:0),0);
		
		pop();
	},
	drawComboAndScore: (x,y,h) => {
		push();
		translate(x,y);
		scale(h/900);
		
		// stroke(withAlpha(game.songData.palette.bg,100));
		// strokeWeight(150);
		// line(-220,-68,220,-68);
		
		fill(game.songData.palette.ui);
		stroke(255);
		strokeWeight(8);
		textSize(112);
		textAlign(RIGHT,BOTTOM);
		
		push();
		scale(1+game.fx.noteHit.uiEase*0.2);
		rotate(game.fx.noteHit.uiEase*0.1);
		if (game.scoring.combo>0) {
			stroke(game.songData.palette.bg);
			strokeWeight(20);
			text(game.scoring.combo+"x",-12,0);
			stroke(255);
			strokeWeight(8);
			text(game.scoring.combo+"x",-12,0);
		} else if (game.pattern.ind) {
			stroke(game.songData.palette.bg);
			strokeWeight(20);
			text("miss",-12,0);
			stroke(255);
			strokeWeight(8);
			text("miss",-12,0);
		} else {
			stroke(game.songData.palette.bg);
			strokeWeight(20);
			text("0x",-12,0);
			stroke(255);
			strokeWeight(8);
			text("0x",-12,0);
		}
		pop();
		
		game.scoring.percent=game.calcPercentScore();
		textSize(72);
		textAlign(LEFT,BOTTOM);
		stroke(game.songData.palette.bg);
		strokeWeight(20);
		text(game.scoring.percent.toFixed(2)+"%",10,-44);
		stroke(255);
		strokeWeight(8);
		text(game.scoring.percent.toFixed(2)+"%",10,-44);
		
		fill(game.songData.palette.bgfx);
		noStroke();
		textSize(32);
		textAlign(LEFT,BOTTOM);
		text("nice "+game.scoring.nice+" ok "+game.scoring.ok+" miss "+game.scoring.miss,10,-18);
		
		pop();
	},
	
	drawPlayfieldPoints: (x,y,points,pos,mult) => {
		push();
		translate(x,y);
		for (let i=points.length-2;i>=pos;i--) {
			let point1=points[i], point2=points[i+1];
			
			line(point1.x*mult,point1.y*mult,point2.x*mult,point2.y*mult);
		}	
		pop();
	},
	drawPlayfieldPointsSnake: (x,y,points,pos,mult,amt) => {
		push();
		translate(x,y);
		
		
		let totalDist=game.calcTotalDistance(points);
		let accumulaDist=0;
		
		for (let i=0;i<amt*(points.length-1);i++) {
			let point1=points[i], point2=points[i+1];
			
			let dist=abs(point2.x-point1.x+
						 point2.y-point1.y);
			let amount=clamp(amt-accumulaDist,dist/totalDist,0)*totalDist/dist;
			
			if (amt-accumulaDist>0) {
				line(point1.x*mult,
					point1.y*mult,
					point1.x*mult+sign(point2.x-point1.x)*dist*amount*mult,
					point1.y*mult+sign(point2.y-point1.y)*dist*amount*mult);
			}
				 
			accumulaDist+=(dist/totalDist);
		}
		
		pop();
	},
	
	drawPlayfield: (x,y,h) => {
		let pattern=game.patterns[game.pattern.ind];
		let mult=100*game.fx.patternTransition.mult;
		let beat=game.calcSongBeat(game.songData,game.song.seek());
		
		push();
		translate(x,y);
		scale(h/900);
		
		if (setting('backgroundFX')) {
			for (let i=0;i<game.fx.bgParticles.length;i++) { //bg particles
				let p=game.fx.bgParticles[i];
				
				push();
				noFill();
				stroke(game.songData.palette.bgfx);
				if (p.type==SMALL) {
					strokeWeight(70-p.ease*70);
					ellipse(p.x,p.y,p.ease*45,p.ease*45);
				} else if (p.type==BUBBLE) {
					strokeWeight(20-p.colorease*20);
					line(p.x+p.ease*cos(p.dir)*p.mag+p.mag*cos(p.dir),
						p.y+p.ease*sin(p.dir)*p.mag+p.mag*sin(p.dir),
						p.x+p.ease*cos(p.dir)*p.mag*2,
						p.y+p.ease*sin(p.dir)*p.mag*2);
					// ellipse(
						// p.x+p.ease*cos(p.dir)*p.mag,
						// p.y+p.ease*sin(p.dir)*p.mag,
						// p.ease*p.mag/3,p.ease*p.mag/3
					// );
				} else if (p.type==BIG) {
					strokeWeight(70-p.ease*70);
					ellipse(p.x,p.y,p.ease*75,p.ease*75);
				}
				
				pop();
			}
			for (let i=0;i<game.fx.bgParticles.length;i++) {
				let p=game.fx.bgParticles[i];
				if (p.type==PCLEAR) {
					push();
					textSize(80-p.ease*45);
					textAlign(CENTER,CENTER);
					stroke(game.songData.palette.bg);
					strokeWeight(8);
					fill(lerpColor(game.songData.palette.bgfx,
						game.songData.palette.bg,
						tweenSineIn(clamp(p.colorease-30,30,0),0,1,30)));
					text(p.perfect?"perfect clear!!":"full combo!",p.x,p.y-4-(5-p.ease*5));
					pop();
				}
			}
		}
		
		if (!pattern) { //were finished, so leave!!!
			pop();
			return; 
		}
		
		rotate(game.fx.noteHit.rotation/40);
		translate(-(game.pattern.center.x-game.fx.patternTransition.x)*mult+game.fx.noteHit.circX*5,
				  -(game.pattern.center.y-game.fx.patternTransition.y)*mult+game.fx.noteHit.circY*5);
		
		if (game.patterns[game.pattern.ind+1]) { //next pattern ghost
			noFill();
			strokeWeight(40);
			stroke(game.songData.palette.ghost);
			game.drawPlayfieldPointsSnake(pattern.notes[pattern.notes.length-1].x*mult,
				pattern.notes[pattern.notes.length-1].y*mult,
				game.patterns[game.pattern.ind+1].notes,
				0,mult,
				game.fx.patternTransition.ghostSnake)
		}
		
		fill(255,90);
		noStroke();
		if (beat<pattern.start &&
			((game.patterns[game.pattern.ind-1] &&
			game.patterns[game.pattern.ind-1].start+game.calcTotalDistance(game.patterns[game.pattern.ind-1].notes)!=pattern.start) ||
			game.scoring.combo==0)) { //next pattern timing pie circle
			arc(pattern.notes[game.pattern.playerPos].x*mult,
				pattern.notes[game.pattern.playerPos].y*mult,
				60,60,-PI/2,
				PI*2*clamp((pattern.start-beat)/(pattern.start-game.pattern.lastHitBeat),1,0)-PI/2);
		}
		
		if (game.patterns[game.pattern.ind+1] && 
			game.patterns[game.pattern.ind+1].start!=pattern.start+game.calcTotalDistance(pattern.notes)) {
			ellipse(pattern.notes[pattern.notes.length-1].x*mult,
					pattern.notes[pattern.notes.length-1].y*mult,
					game.fx.patternTransition.circ*60,
					game.fx.patternTransition.circ*60); //indicating next timing pie circle
		}
		
		stroke(255);
		
		strokeWeight(50+game.fx.patternTransition.scale*16);
		line(pattern.notes[game.pattern.playerPos].x*mult+game.fx.noteHit.elasticX*15,
			 pattern.notes[game.pattern.playerPos].y*mult+game.fx.noteHit.elasticY*15,
			 pattern.notes[game.pattern.playerPos].x*mult,
			 pattern.notes[game.pattern.playerPos].y*mult); //player dot outline
			 
		strokeWeight(38+game.fx.patternTransition.circ*12);
		game.drawPlayfieldPoints(0,0,pattern.notes,game.pattern.playerPos,mult); //outline
		
		stroke(lerpColor(game.songData.palette.ghost,game.songData.palette.line,game.fx.patternTransition.circ));
		
		strokeWeight(38+game.fx.patternTransition.scale*16);
		line(pattern.notes[game.pattern.playerPos].x*mult+game.fx.noteHit.elasticX*15,
				pattern.notes[game.pattern.playerPos].y*mult+game.fx.noteHit.elasticY*15,
				pattern.notes[game.pattern.playerPos].x*mult,
				pattern.notes[game.pattern.playerPos].y*mult); //player dot meat
	
		strokeWeight(38);
		game.drawPlayfieldPoints(0,0,pattern.notes,game.pattern.playerPos,mult); //meat
		
		// **calculating rhythm indicator**
		let indicatorPos=beat-game.pattern.playerDist-pattern.start;
		let indicatorDest={ x: 
			clamp(indicatorPos,
				  abs(pattern.notes[game.pattern.playerPos+1].x-pattern.notes[game.pattern.playerPos].x),
				  0
			)*sign(
				pattern.notes[game.pattern.playerPos+1].x-pattern.notes[game.pattern.playerPos].x
			), y: 
			clamp(indicatorPos,
				  abs(pattern.notes[game.pattern.playerPos+1].y-pattern.notes[game.pattern.playerPos].y),
				  0
			)*sign(
				pattern.notes[game.pattern.playerPos+1].y-pattern.notes[game.pattern.playerPos].y
			)};
		// **calculating rhythm indicator**
		
		stroke(255,180);
		noFill();
		strokeWeight(20);
		line(pattern.notes[game.pattern.playerPos].x*mult,
			 pattern.notes[game.pattern.playerPos].y*mult,
			 (pattern.notes[game.pattern.playerPos].x+indicatorDest.x)*mult,
			 (pattern.notes[game.pattern.playerPos].y+indicatorDest.y)*mult); //rhythm indicator
			
		for (let i=game.pattern.playerPos+1;i<=pattern.notes.length-1;i++) { //point circles
			let point=pattern.notes[i];
			strokeWeight(2);
			noFill();
			if (i==game.pattern.playerPos+1) {
				stroke(255,150+game.fx.noteHit.ease*105);
				ellipse(point.x*mult,point.y*mult,6+game.fx.noteHit.ease*6,6+game.fx.noteHit.ease*6);
			} else {
				stroke(255,170-(i-game.pattern.playerPos)*20);
				ellipse(point.x*mult,point.y*mult,6,6);
			}
		}
		
		noStroke();
		fill(255);
		ellipse(pattern.notes[game.pattern.playerPos].x*mult+game.fx.noteHit.elasticX*15,
				pattern.notes[game.pattern.playerPos].y*mult+game.fx.noteHit.elasticY*15,
				12+game.fx.patternTransition.scale*8,12+game.fx.patternTransition.scale*8); //player dot
				
		fill(255,30); //pie circles part 2
		noStroke();
		if (beat<pattern.start &&
			((game.patterns[game.pattern.ind-1] &&
			game.patterns[game.pattern.ind-1].start+game.calcTotalDistance(game.patterns[game.pattern.ind-1].notes)!=pattern.start) ||
			game.scoring.combo==0)) {
			arc(pattern.notes[game.pattern.playerPos].x*mult,
				pattern.notes[game.pattern.playerPos].y*mult,
				60,60,-PI/2,
				PI*2*clamp((pattern.start-beat)/(pattern.start-game.pattern.lastHitBeat),1,0)-PI/2);
		}
		
		if (game.patterns[game.pattern.ind+1] && 
			game.patterns[game.pattern.ind+1].start!=pattern.start+game.calcTotalDistance(pattern.notes)) {
			ellipse(pattern.notes[pattern.notes.length-1].x*mult,
					pattern.notes[pattern.notes.length-1].y*mult,
					game.fx.patternTransition.circ*60,
					game.fx.patternTransition.circ*60);
		}
		
		pop();
	},
	
	draw: (w,h) => {
		background(game.songData.palette.bg);
		
		game.drawPlayfield(w/2,h/2,h);
		game.drawComboAndScore(w/2,h,h);
		game.drawTimeBar(20,20,w-40);
		
		if (game.songData.id==="tutorial") {
			tutorial.draw(30,h/2,w,h);
		}
		
		background(withAlpha(game.songData.palette.bg,game.fx.fade*255));
	},
	
	onKeyPress: (key) => {
		if (key==27) { //go back to select
		
			game.reset();
			select.init();
			state=SELECT;
			
		} else if ((key==32 || key==13) && !game.song.playing()) {
			if (tutorial.active) {
				tutorial.advance();
			} else {
				game.song.play();
			}
		} else if ([37,38,39,40].includes(key)) {
			
			let timing=abs(game.calcHitTiming());
			
			if (key==game.getDirectionKey() && timing<game.timing.ok) {
				game.hitNote(key,timing);
				let mult=100*game.fx.patternTransition.mult;
				
				if (game.pattern.playerPos>=game.patterns[game.pattern.ind].notes.length-1) {
					game.nextPattern();
				
					if (game.scoring.hitNotes==game.scoring.totalNotes) {
						game.createClearText(
							game.patterns[game.pattern.ind-1].notes[game.patterns[game.pattern.ind-1].notes.length-1].x*mult
								-(game.pattern.center.x-game.fx.patternTransition.x)*mult,
							game.patterns[game.pattern.ind-1].notes[game.patterns[game.pattern.ind-1].notes.length-1].y*mult
								-(game.pattern.center.y-game.fx.patternTransition.y)*mult,
							game.scoring.ok==0
						);
					}
					
					if (game.patterns[game.pattern.ind]) {
						game.createBigRipple(
							game.patterns[game.pattern.ind].notes[0].x*mult-(game.pattern.center.x-game.fx.patternTransition.x)*mult,
							game.patterns[game.pattern.ind].notes[0].y*mult-(game.pattern.center.y-game.fx.patternTransition.y)*mult,
							timing<game.timing.nice
						);
					} else {
						game.createBigRipple(
							game.patterns[game.pattern.ind-1].notes[game.patterns[game.pattern.ind-1].notes.length-1].x*mult
								-(game.pattern.center.x-game.fx.patternTransition.x)*mult,
							game.patterns[game.pattern.ind-1].notes[game.patterns[game.pattern.ind-1].notes.length-1].y*mult
								-(game.pattern.center.y-game.fx.patternTransition.y)*mult,
							timing<game.timing.nice
						);
					}
				} else if (timing<game.timing.nice) {
					game.createSmallRipple(
						game.patterns[game.pattern.ind].notes[game.pattern.playerPos].x*mult-(game.pattern.center.x-game.fx.patternTransition.x)*mult,
						game.patterns[game.pattern.ind].notes[game.pattern.playerPos].y*mult-(game.pattern.center.y-game.fx.patternTransition.y)*mult,
					);
				}
			} else if (game.calcSongBeat()>game.patterns[game.pattern.ind].start){
				game.missNote();
			}
		}
		
		if (keyCode==219) game.song.seek(game.song.duration()-0.1);
	},
	
	hitNote: (key,timing) => {
		game.pattern.playerPos++;
		game.pattern.playerDist += game.calcPlayerDist(game.patterns[game.pattern.ind].notes,game.pattern.playerPos);
		
		game.fx.noteHit.ease=0;
		game.fx.noteHit.uiEase=1;
		game.fx.noteHit.linearX=0;
		game.fx.noteHit.linearY=0;
		
		if (key==37) game.fx.noteHit.linearX=-1;
		else if (key==38) game.fx.noteHit.linearY=-1;
		else if (key==39) game.fx.noteHit.linearX=1;
		else if (key==40) game.fx.noteHit.linearY=1;
		
		if (key==37 || key==39) {
			game.fx.noteHit.rotation=(key-38)*
				(game.patterns[game.pattern.ind].notes[game.pattern.playerPos].y-
				 game.calcCenter(game.patterns[game.pattern.ind].notes).y)
				 *-1;
		} else if (key==38 || key==40) {
			game.fx.noteHit.rotation=(key-39)*
				(game.patterns[game.pattern.ind].notes[game.pattern.playerPos].x-
				 game.calcCenter(game.patterns[game.pattern.ind].notes).x);
		}
		
		game.scoring.hitNotes++;
		game.scoring.combo++;
		if (game.scoring.combo>game.scoring.maxCombo) game.scoring.maxCombo=game.scoring.combo;
		if (timing<game.timing.nice) {
			game.scoring.nice++;
		} else {
			game.scoring.ok++;
		}
	},
	
	missNote: () => {
		game.scoring.miss+=game.patterns[game.pattern.ind].notes.length-game.pattern.playerPos-1;
		
		game.scoring.combo=0;
		
		game.nextPattern();
	},
	
	nextPattern: () => {
		if (game.patterns[game.pattern.ind+1]) {
			game.fx.patternTransition.x=game.patterns[game.pattern.ind].notes[game.patterns[game.pattern.ind].notes.length-1].x;
			game.fx.patternTransition.y=game.patterns[game.pattern.ind].notes[game.patterns[game.pattern.ind].notes.length-1].y;
			game.fx.patternTransition.ghostSnake=0;
			game.fx.patternTransition.linear=1;
			game.fx.patternTransition.scale=1;
		}
		
		game.pattern.lastHitBeat=game.calcSongBeat();
		//game.pattern.lastHitBeat=game.patterns[game.pattern.ind].start+
		//						 game.calcTotalDistance(game.patterns[game.pattern.ind].notes,game.pattern.playerPos);
		game.pattern.ind++;
		game.pattern.playerPos=0;
		game.pattern.playerDist=0;
	},
	
	reset: () => {
		game.song.stop();
			
		game.pattern = {
			playerPos: 0,
			playerDist: 0,
			ind: 0,
			center: {x:0,y:0},
			lastHitBeat: 0
		};
		
		game.scoring = {
			hitNotes: 0,
			ok: 0,
			nice: 0,
			miss: 0,
			combo: 0,
			maxCombo: 0,
			totalNotes: 0,
			percent: 0
		};
		
		game.fx = {
			patternTransition: {x:0,y:0,scale:0,mult:1,ghostSnake:0,linear:0,circ:1},
			noteHit: {ease:1,rotation:0,circX:0,circY:0,linearX:0,linearY:0,elasticX:0,elasticY:0,uiEase:0},
			bgParticles: [],
			fade: 1
		};
		
		tutorial.reset();
		
		game.diff=null;
		game.ending=false;
	}
	
}