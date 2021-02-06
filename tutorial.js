//this is for special events fired in the tutorial level
//for pausing and showing text and stuff
//might be unorganized

const tutorial = {
	ind: 0,
	indText: 0,
	textScroll: 0,
	dialog: [
		[""],
		[
			"heya! i'm noodle, and i'm gonna show you how to play.",
			"this game's about hitting keys to the rhythm of the music. see that line over there? that little white dot is you!",
			"after that circle around your dot depletes, a guide will follow you to that hollow circle down there.",
			"once the guide meets with the circle, that's when you hit the key!",
			"the key you hit depends on how the guide travels. in this case, you're gonna want to press RIGHT. give it a go!"
		],
		[
			"nice! i'm not programmed to know if you hit it or not, but i'm sure you did great.",
			"you'll notice that this next pattern has multiple spots where you need to hit a key.",
			"it's just like before, but when you reach one target, another one gets activated!",
			"in this case, you're gonna wanna press the keys in this order: DOWN, RIGHT, UP, RIGHT. try it out!",
		],
		[
			"great job! you've probably also noticed that dark pattern that shows up at the end.",
			"that's meant to indicate how the next pattern will look like!",
			"you've probably also noticed a white circle surrounding the target at the end of a pattern means there'll be a delay before the next one starts.",
			"there doesn't seem to be one here, though; that means the next pattern will start right after you complete this one!",
			"i'm sure you've figured out how the keys work by now. this last part's a little more difficult, best of luck!",
		],
		[
			"fantastic! that sums up pretty much all you have to know to play the game.",
			"you can start out by playing some songs on EASY difficulty, then work your way up towards HARD and maybe even EXPERT.",
			"peace",
		],
	],
	dialogLines: [
		[2],
		[2,4,4,3,4],
		[3,3,3,4],
		[4,3,6,4,4],
		[3,5,1],
	], //no textHeight() we die like men
	dialogImage: [
		[0],
		[0,1,1,0,2],
		[2,1,0,1],
		[1,0,0,1,0],
		[2,0,1],
	],
	dialogGuide: [
		[0],
		[0,1,2,3,0],
		[0,0,0,0],
		[0,0,4,0,0],
		[0,0,0],
	],
	lineHeight: 2,
	bubbleScale: 0,
	entry: 1,
	peaceOut: false,
	active: false,
	
	images: [],
	guides: [],
	loadImages: () => {
		for (let i=0;i<4;i++) {
			tutorial.images[i]=loadImage('assets/noodle'+(i+1)+'.png');
			tutorial.guides[i]=loadImage('assets/guide'+(i+1)+'.png');
		}
	},
	
	update: (beat) => {
		if (beat>68 && tutorial.ind==3) {
			tutorial.ind++;
			tutorial.active=true;
			game.song.pause();
		}
		if (beat>42 && tutorial.ind==2) {
			tutorial.ind++;
			tutorial.active=true;
			game.song.pause();
		}
		if (beat>18 && tutorial.ind==1) {
			tutorial.ind++;
			tutorial.active=true;
			game.song.pause();
		}
		if (beat>2 && tutorial.ind==0) {
			tutorial.ind++;
			tutorial.active=true;
			game.song.pause();
		}
		
		if (tutorial.active) {
			if (tutorial.textScroll<tutorial.dialog[tutorial.ind][tutorial.indText].length) {
				tutorial.textScroll++;
				if (frameCount%5==0) {
					sound.noodle.rate(0.9+random(-0.2,0.2));
					sound.noodle.play();
				}
			}
			tutorial.bubbleScale+=(1-tutorial.bubbleScale)/4;
			if (!tutorial.peaceOut) {
				tutorial.entry+=(0-tutorial.entry)/6;
			}
		} else tutorial.bubbleScale+=(0-tutorial.bubbleScale)/4;
		
		if (tutorial.peaceOut) {
			tutorial.entry+=0.002+tutorial.entry*0.1;
		}
		
		tutorial.lineHeight+=(tutorial.dialogLines[tutorial.ind][tutorial.indText]-tutorial.lineHeight)/5;
	},
	
	draw: (x,y,w,h) => {
		push();
		
		background(0,tutorial.bubbleScale*80);
		
		translate(x,y);
		scale(height/900);
		
		tutorial.drawBubble(150,-50,w,h);
		
		if (tutorial.active) {
			image(tutorial.images[tutorial.dialogImage[tutorial.ind][tutorial.indText]],-tutorial.entry*300,-50,200,266);
		} else {
			image(tutorial.images[3],
				-tutorial.entry*300-tweenCircOut(game.calcSongBeat()-floor(game.calcSongBeat()),10,-10,1),
				-50+tweenCircOut(game.calcSongBeat()-floor(game.calcSongBeat()),20,-20,1),
				200+tweenCircOut(game.calcSongBeat()-floor(game.calcSongBeat()),20,-20,1),
				266-tweenCircOut(game.calcSongBeat()-floor(game.calcSongBeat()),20,-20,1));
		}
		if (tutorial.dialogGuide[tutorial.ind][tutorial.indText]!=0) {
			image(tutorial.guides[tutorial.dialogGuide[tutorial.ind][tutorial.indText]-1],250,0,200,200);
		}
	
		pop();
	},
	
	drawBubble: (x,y,w,h) => {
		push();
		translate(x,y);
		scale(tutorial.bubbleScale);
		rotate((1-tutorial.bubbleScale)*0.2);
		
		noStroke();
		fill(255);
		rect(0,-30-tutorial.lineHeight*30,340,30+tutorial.lineHeight*30,20,20,20,0);
		fill(game.songData.palette.bg);
		textSize(24);
		text(tutorial.dialog[tutorial.ind][tutorial.indText].substring(0,tutorial.textScroll),20,6-tutorial.lineHeight*30,300);
		
		pop();
	},
	
	advance: () => {
		if (tutorial.indText<tutorial.dialog[tutorial.ind].length-1) {
			tutorial.indText++;
			tutorial.textScroll=0;
			if (tutorial.ind==4 && tutorial.indText==2) tutorial.peaceOut=true;
		} else {
			tutorial.active=false;
			tutorial.textScroll=0;
			tutorial.indText=0;
			game.song.play();
		}
	},
	
	reset: () => {
		tutorial.ind=0;
		tutorial.indText=0;
		tutorial.textScroll=0;
		tutorial.active=false;
		tutorial.peaceOut=false;
		tutorial.bubbleScale=0;
		tutorial.entry=1;
	}
}