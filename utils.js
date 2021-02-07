function sign(v) { //why....
	if (v==0) return 0
	else if (v>0) return 1
	else return -1
}

function mod(n,m) { //WHY
    let remain = n%m;
    return Math.floor(remain>=0 ? remain : remain+m);
}

function clamp(x,mx,mn) {
	return min(max(x, mn), mx);
}

function withAlpha(c,a) {
	return color(c._getRed(),c._getGreen(),c._getBlue(),a)
}

function tweenElasticOut(t,b,c,d) {
	if (t==0) return b;
	t=t/d;
	var p=d*0.3;
	var s=p/4;
	var a=c;
	return a * pow(2, -10 * t) * sin((t * d - s) * (2 * PI) / p) + c + b;
}
function tweenCircOut(t,b,c,d) {
	return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
}
function tweenSineIn(t,b,c,d) {
	return -c * Math.cos(t/d * (Math.PI/2)) + c + b
}

function setting(id) {
	if (!id.includes('Color') && !eval(localStorage.getItem(id))) {
		if (id === 'globalOffset') return 0;
		if (id === 'fancyMenu') return true;
		else return false;
	}
	if (id.includes('Color')) return localStorage.getItem(id);
	else return eval(localStorage.getItem(id));
}

function mouseInArea(x,y,w,h,s=1,ox=0,oy=0) {
	return mouseX>x*s+ox && mouseX<x*s+w*s+ox && mouseY>y*s+oy && mouseY<y*s+h*s+oy;
}

function delta() {
	//use deltatime for easing that would be annoying if slowed down
	//like scrolling through songs, starting songs, etc.
	//this doesnt apply during a song because it uses the song's time anyways
	return deltaTime/16;
}

function textEmboss(t,x,y) {
	let s=textSize();
	push();
	fill(255);
	text(t,x,y+s*0.06);
	text(t,x,y+s*0.03);
	pop();
	text(t,x,y);
}

//FROM https://p5js.org/examples/color-linear-gradient.html
function gradient(x, y, w, h, c1, c2, axis) {
	push();
	noFill();
	
	strokeWeight(2);
	if (axis === false) {
		for (let i = y; i <= y + h; i++) {
			let inter = map(i, y, y + h, 0, 1);
			let c = lerpColor(c1, c2, inter);
			stroke(c);
			line(x, i, x + w, i);
		}
	} else if (axis === true) {
		for (let i = x; i <= x + w; i++) {
			let inter = map(i, x, x + w, 0, 1);
			let c = lerpColor(c1, c2, inter);
			stroke(c);
			line(i, y, i, y + h);
		}
	}
	pop();
}

//constants

const GAME=0, SELECT=1, RESULTS=2, OPTIONS=3;		//state
const BIG=0, SMALL=1, BUBBLE=2, PCLEAR=3;			//particles
const DIFF=['easy','hard','expert'];				//difficulty names
const DIFFCOLOR=['#87eb49','#eb7f49','#4987eb'];	//difficulty colours

let state=SELECT;