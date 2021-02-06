const results = {
	stats: {},
	song: {},
	diff: null,
	fx: {
		fade: 1,
		zoom: 1,
		percent: 0,
	},
	gradePoints: {
		'?': [{'x':0,'y':0},{'x':1,'y':0},{'x':1,'y':-1},{'x':-1,'y':-1}],
		'F': [{'x':-1,'y':1},{'x':-1,'y':0},{'x':0,'y':0},{'x':-1,'y':0},{'x':-1,'y':-1},{'x':1,'y':-1}],
		'C': [{'x':1,'y':1},{'x':-1,'y':1},{'x':-1,'y':-1},{'x':1,'y':-1}],
		'B': [{'x':-1,'y':1},{'x':1,'y':1},{'x':1,'y':0},{'x':-1,'y':0},{'x':0.5,'y':0},{'x':0.5,'y':-1},{'x':-1,'y':-1},{'x':-1,'y':1},],
		'A': [{'x':-1,'y':1},{'x':-1,'y':0},{'x':1,'y':0},{'x':-1,'y':0},{'x':-1,'y':-1},{'x':1,'y':-1},{'x':1,'y':1}],
		'S': [{'x':-1,'y':1},{'x':1,'y':1},{'x':1,'y':0},{'x':-1,'y':0},{'x':-1,'y':-1},{'x':1,'y':-1}],
		'P': [{"x":-1,"y":1},{"x":-1,"y":-1},{"x":1,"y":-1},{"x":1,"y":0},{"x":-1,"y":0}]
	},
	goBack: false,
	
	init: (stats,song,diff) => {
		results.stats=stats;
		results.song=song;
		results.diff=diff;
	},
	
	getGrade: (perc) => {
		if (perc<50) 	    return 'F';
		else if (perc<65)   return 'C';
		else if (perc<80)   return 'B';
		else if (perc<90)   return 'A';
		else if (perc<100)   return 'S';
		else if (perc==100)  return 'P';
		else 				return '?';
	},
	
	fxStep: () => {
		results.fx.zoom+=(0-results.fx.zoom)/7;
		if (results.fx.percent<results.stats.percent) {
			results.fx.percent+=results.stats.percent/40;
			if (frameCount%3==0) {
				sound.increment.rate(0.8+results.fx.percent/100);
				sound.increment.play();
			}
		} else results.fx.percent=results.stats.percent;
		
		if (results.goBack) {
			if (results.fx.fade>=1) {
				select.init();
				state=SELECT;
				results.fx={
					fade: 1,
					zoom: 1,
					percent: 0
				};
				results.goBack=false;
			}
			results.fx.fade+=0.1;
		} else {
			results.fx.fade+=sign(results.fx.fade)*-0.1;
		}
	},
	
	draw: (w,h) => {
		background(results.song.palette.bg);
		
		push();
		translate(w/2,h);
		scale(h/900);
		
		textAlign(CENTER,BOTTOM);
		noStroke();
		fill(results.song.palette.ghost);
		textSize(30);
		text("press any key to return",0,-20);						//press any key blahdsdxcnv
		
		pop();
		
		push();
		translate(w/2,h/2);
		
		scale(h*(1+results.fx.zoom)/900);
		
		noStroke();
		fill(results.song.palette.bgfx);
		circle(0,0,300);	
		
		image(select.jacket[results.song.id],0,-170,300,300); 		//jacket
			
		fill(color(DIFFCOLOR[results.diff]));
		stroke(255);
		strokeWeight(8);
		circle(300,-170,50);
		
		textSize(70);
		textAlign(CENTER,CENTER);
		text(results.song[DIFF[results.diff]],300,-179);   			
		
		textAlign(RIGHT,CENTER);
		textSize(40);
		text(DIFF[results.diff],250,-175); 							//difficulty
		
		fill(withAlpha(results.song.palette.bg,150));
		noStroke();
		circle(-150,-150,130);
		stroke(255);												//grade
		strokeWeight(50);
		game.drawPlayfieldPointsSnake(-150,-150,
			results.gradePoints[results.getGrade(results.stats.percent)],0,60,
			1-results.fx.zoom);	
		stroke(results.song.palette.line);												
		strokeWeight(35);
		game.drawPlayfieldPointsSnake(-150,-150,
			results.gradePoints[results.getGrade(results.stats.percent)],0,60,
			1-results.fx.zoom);				
		
		textAlign(RIGHT,TOP);
		stroke(results.song.palette.bgfx);
		strokeWeight(10);
		fill(results.song.palette.bg);
		textSize(40);
		if (results.stats.maxCombo==results.stats.totalNotes) {
			text("full combo!",-30,69);
		} else {
			text("max combo "+results.stats.maxCombo+"x",-30,69);
		}
		textSize(30);
		noStroke();
		text(results.stats.nice,-90,109);
		text(results.stats.ok,-90,139);
		text(results.stats.miss,-90,169);
		text("nice",-30,109);
		text("ok",-30,139);
		text("miss",-30,169);										//extra stuff
		
		fill(results.song.palette.ui);
		strokeWeight(10);
		stroke(255);
		textSize(90);
		text((results.fx.percent).toFixed(2)+"%",-30,-20);			//percentage
		
		textAlign(LEFT,TOP);
		fill(results.song.palette.line);
		textSize(60);
		text(results.song.title,0,100);
		textSize(40);
		text(results.song.artist,0,158);							//title artist
			
		pop();
		
		background(withAlpha(results.song.palette.bg,results.fx.fade*255));
	},
	
	onKeyPress: (key) => {
		results.goBack=true;
	},
}