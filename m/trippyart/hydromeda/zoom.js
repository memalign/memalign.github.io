
/* copyright Nikolaus Baumgarten http://nikkki.net */

var zoom = (function(){

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	var canvas = document.getElementById('zc');
	var zc = $('#zc');
	var context;
	//
	var window_w, window_h;
	var center_x, center_y;
	var element_w;
	var element_h;
	var startposition = 18;
	var z_position = 0
	var lastframe = null;
	var steps;
	//
	var playback = true;
	var hue = 0;
	// var fx = localStorage.getItem("fx") || 'nofx';
	// var fx = 'trippy';
	var fx;
	var direction = 1;
	var keyboardMap = {up:false,down:false};
	//
	var slowspeed = 8;
	var fastspeed = 20;
	var maxspeed = 100;

	var speedfactor = 1;
	var portrait = false;

	var speed = slowspeed;
	var visiblesteps = 4;
	var color1 = '#222';
	var color2 = '#444';
	var loaded = false;
	var loadpercent = 0;
	var tilewidth = 1600;
	var tileheight = 1200;
	var loadcompleted = false;
	var z_opac = 0;
	var z_opac_target = 0;
	var visitstart = Date.now();
	var filterelements = $('.filtered');

	var imgarray = [];


	var start = Math.floor( Math.random() * 67);
	for (var i = 0; i <= 66; i++) {
		var n = start+i;
		if (n > 66) n -= 67;
		imgarray.push('./web/hydro'+n+'.jpg');
	};



	// for (var i = 0; i <= 4; i++) {
	// 	var f = imgarray.pop();
	// 	imgarray.unshift(f)
	// };



	var length = imgarray.length;
	/* SETUP */
	$(window).resize(function() {
		resize();
	});

	function setup(){
		context = canvas.getContext('2d');
		resize();
		setupsteps();
		window.requestAnimationFrame(loop);
		setTimeout(function(){
			if (!loaded) $("#loading").css({'opacity':'1'});
		},1000);
	}

	function resize(scale){

		if(window.devicePixelRatio !== undefined) {
		    dpr = window.devicePixelRatio;
		} else {
		    dpr = 1;
		}
		var w = $(window).width();
		var h = $(window).height();
		window_w = w * dpr;
		window_h = h * dpr;

		center_x = window_w/2;
		center_y = window_h/2;

		if (window_w>window_h*(tilewidth/tileheight)){
			element_w = window_w;
			element_h = window_w*(tileheight/tilewidth);
		} else {
			element_w = window_h*(tilewidth/tileheight);
			element_h = window_h;
		}
		portrait = (window_h > window_w);

		$('#zc').attr('width',window_w);
		$('#zc').attr('height',window_h);

		lastdrawn = null;

	}
	function loadstatus(){
		if (!loaded) {
			loadpercent = 0;
			var isready = steps.every(function(element){
				if (element.ready) loadpercent += 100/steps.length;
				return element.ready;
			});
			$('#loadbar').css('width',Math.floor(loadpercent)+'%');
			if (isready) {
				$("#zc").animate({'opacity':1},(100-z_opac)*5);
				$("#logo").animate({'opacity':0},500);
				loadcompleted = true;
				// navFade();
				$('#loading').hide()
				$('body').removeClass('loading');
			}
			return isready;
		} else return true;
	}

	/* IMG OBJECT */
	function zoom_img(src) {
		var that = this;
		this.ready = false;
		this.img = new Image();
		this.img.onload = function(){
			that.ready = true;
			if (loadstatus()){
				loaded = true;
				var loadtime = (Date.now() - visitstart)/1000;
			}
		};
		this.img.src = src;
	}

	/* POPULATE STEP OBJECTS ARRAY */
	function setupsteps() {
		steps = [];
		for (var i = 0; i < imgarray.length; i++) {
			steps.push(new zoom_img(imgarray[i]));
		}
	}

	/* ANIMATION LOOP */

	var lastdrawn = null;

	function loop(timestamp){
		var elapsed = 0;
		if (!lastframe) {
			lastframe = timestamp;
		} else {
  			elapsed = timestamp - lastframe;
  			lastframe = timestamp;
		}

		// CONTROL
		if (loaded) {
			var zoomspeed = 0.0003*elapsed

			if (keyboardMap.up) {
				z_position += zoomspeed*5;
			} else if (keyboardMap.down){
				z_position -= zoomspeed*5;
			} else if (playback) {
				z_position += (zoomspeed/8*((portrait)?speed*speedfactor:speed));
			}
			if (z_position<0) {
				z_position+=steps.length;
			}
			if (z_position>steps.length) {
				z_position-=steps.length;
			}
		}

		// DISPLAY
		if (lastdrawn != z_position || ! loadcompleted) {
			lastdrawn = z_position;

			context.clearRect(0, 0, canvas.width, canvas.height);
			// build array of visible steps, looping end to the beginning
			var steparray = [];
			for (var i = 0; i < visiblesteps; i++) {
				steparray.push( steps[ (Math.floor(z_position)+i)%steps.length ] );
			}
			//
			var scale = Math.pow(2,(z_position%1));
			// draw the collected image steps
			for (var i = 0; i < steparray.length; i++) {
				var x = center_x - element_w/2*scale;
				var y = center_y - element_h/2*scale;
				var w = element_w*scale;
				var h = element_h*scale;

				if (steparray[i].ready) {
					context.drawImage(steparray[i].img,x,y,w,h);
				} else {
					context.fillStyle = ((Math.floor(z_position)+i)%2===0)?color1:color2;
					context.fillRect (x,y,w,h);
				}
				scale *= 0.5;
			}
			//console.log('drawing')
		}



		if (!loadcompleted) {
			if (steparray.every(function(e){return e.ready})){
				z_opac_target = loadpercent;
			}
			if (z_opac < z_opac_target) {
				z_opac +=0.5;
			}

			$('#zc').css('opacity',(z_opac/100));
			// z_position = startposition+(z_opac/2000);
			z_position = startposition;
		}

		if (fx === 'trippy') {
			hue += elapsed/50;
			if (hue >= 360) hue-= 360;

			filterelements.css('-webkit-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-moz-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-ms-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-o-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('filter', 'hue-rotate('+hue+'deg)');
		}

		updateNavBar();
 		window.requestAnimationFrame(loop);
	}

	if(canvas.getContext) {
		setup();
	}

	/** nav **/

	var nav = document.getElementById("nav");

	/** SEEKBAR **/

	var marker = $(".seekbar .marker");
	var seekbar = $(".seekbar");
	var seekbar_visible = $(".seekbar-visible");
	var preview = $("#preview");
	preview.attr('width',250);
	preview.attr('height',175);


	var previewcanvas = document.getElementById('preview');
	var previewcontext = previewcanvas.getContext('2d');;

	var preview_w = previewcanvas.width;
	var preview_h = previewcanvas.width*(tileheight/tilewidth);

	var preview_center_x = previewcanvas.width/2;
	var preview_center_y = previewcanvas.height/2;

	seekbar.click(function(e) {
		var percent =  (e.pageX - seekbar.offset().left) / seekbar.width();
		z_position = length * percent;
	});

	seekbar.mousemove(function(e) {
		var percent =  e.pageX / seekbar.width();
		var lp = (percent * seekbar.width()) - preview.width()/2;
		var m = 5;
		if (lp < m) lp = m;
		if (lp > seekbar.width()-preview.width()-m) lp = seekbar.width()-preview.width()-m;
		preview.css('left',lp);
		drawPreview( length*percent );
	});


	function updateNavBar() {
		var percent = z_position / length;
		marker.css('left',percent*100+"%");
	}

	function drawPreview(position) {
		if (loaded) {
			previewcontext.clearRect(0, 0, previewcanvas.width, previewcanvas.height);
			var steparray = [];
				steparray.push( steps[ (Math.floor(position))%steps.length ] );
			var scale = Math.pow(2,(position%1));
			for (var i = 0; i < steparray.length; i++) {
				var x = preview_center_x - preview_w/2*scale;
				var y = preview_center_y - preview_h/2*scale;
				var w = preview_w*scale;
				var h = preview_h*scale;
				if (steparray[i].ready) {
					previewcontext.drawImage(steparray[i].img,x,y,w,h);
				} else {
					previewcontext.fillStyle = ((Math.floor(position)+i)%2===0)?color1:color2;
					previewcontext.fillRect (x,y,w,h);
				}
				scale *= 0.5;
			}
		}
 	}

	seekbar.mouseenter(function() {
		preview.fadeIn(400);
	});
	seekbar.mouseleave(function() {
		preview.fadeOut(400);
	});



	/** SPEED CONTROL **/

	var speedcontrol = $('#speedcontrol');
	var speedhandle = $('#speedcontrol .handle');

	speedcontrol.on('mousedown', speedstartdrag);

	function speedstartdrag (e) {
		console.log(e)
		var s = (e.offsetX) / (speedcontrol.width()) * 2 - 1;
		if (s < -1) s = -1;
		if (s > 1) s = 1;
		speed = s * maxspeed;
		updateSpeedHandle();
		$('body').addClass('dragging');
		window.addEventListener('mousemove', speeddrag);
		window.addEventListener('mouseup', stopdrag);
		playback = true;
	}
	var speeddrag = function (e) {
		var s = (e.clientX - speedcontrol.offset().left) / (speedcontrol.width()) * 2 - 1;
		if (s < -1) s = -1;
		if (s > 1) s = 1;
		speed = s * maxspeed;
		updateSpeedHandle();
	}
	var stopdrag = function (e) {
		window.removeEventListener('mousemove', speeddrag);
		window.removeEventListener('mouseup', stopdrag);
		$('body').removeClass('dragging');
	}

	// document.getElementById('speedcontrol').addEventListener('touchstart', speedstarttouch);

	function speedstarttouch (e) {
		idletime = Date.now()
		var xPos = e.touches[0].pageX;
		var s = (xPos - speedcontrol.offset().left) / (speedcontrol.width()) * 2 - 1;
		if (s < -1) s = -1;
		if (s > 1) s = 1;
		speed = s * maxspeed;
		updateSpeedHandle();
		window.addEventListener('touchmove', speedtouchmove);
		window.addEventListener('touchend', speedtouchend);
		window.addEventListener('touchcancel', speedtouchend);
	}

	var speedtouchmove = function (e) {
		var xPos = e.touches[0].pageX;
		var s = (xPos - speedcontrol.offset().left) / (speedcontrol.width()) * 2 - 1;
		if (s < -1) s = -1;
		if (s > 1) s = 1;
		speed = s * maxspeed;
		updateSpeedHandle();
	}
	var speedtouchend = function (e) {
		idletime = Date.now()
		window.removeEventListener('touchmove', speedtouchmove);
		window.removeEventListener('touchend', speedtouchend);
		window.removeEventListener('touchcancel', speedtouchend);
	}





	var updateSpeedHandle = function (e) {
		var p = ((speed / maxspeed) + 1);
		var hp = 100 * p + 9;
		speedhandle.css('left', hp+'px');
	}
	updateSpeedHandle();



	/****/

	var idletime = Date.now();
	var navO = 0;
	document.body.addEventListener('mousemove', function(e) {
		idletime = Date.now();
	});
	// function navFade(){
	// 	if (Date.now() - idletime > 5000) {
	// 		$('body').addClass('navfade');
	// 	} else {
	// 		$('body').removeClass('navfade');
	// 	}
	// 	setTimeout(navFade,100)
	// };

	$('#zc').click(function () {
		$('body').toggleClass('uihidden');

		var video = $(".video").get(0);

		if (! $('body').hasClass('uihidden')) {
			video.play();
		} else {
			video.pause();
		}

	})

	var button_nofx = $("#nofx");
	var button_color = $("#trippy");
	var button_sw = $("#sw");
	var fxbuttons = $(".textbutton.fx");

	var button_settings = $("#settings");

	var button_ff = $("#ff");
	var button_f = $("#f");
	var button_p = $("#p");
	var button_r = $("#r");
	var button_rr = $("#rr");
	var speedbuttons = $(".icon.speed");



	button_ff.addClass('active');
	if (fx == 'trippy') {
		button_color.addClass('active');
	} else if (fx == 'sw') {
		button_sw.addClass('active');
	} else {
		button_nofx.addClass('active');
	}
	var active_speed_button = button_f;

	fxbuttons.mousedown(function(e){
		fxbuttons.removeClass('active');
		$(e.target).addClass('active');
	});

	button_nofx.mousedown(function(e){
		fx = false;
		filterelements.css('-webkit-filter', 'none');
		filterelements.css('-moz-filter', 'none');
		filterelements.css('-ms-filter', 'none');
		filterelements.css('-o-filter', 'none');
		filterelements.css('filter', 'none');
		// localStorage.setItem("fx", 'nofx');
	});
	button_color.mousedown(function(e){
		fx = 'trippy';
		hue = Math.random()*360;
		// localStorage.setItem("fx", 'trippy');
	});
	button_sw.mousedown(function(e){
		fx = 'sw';
		filterelements.css('-webkit-filter', 'grayscale(100%)');
		filterelements.css('-moz-filter', 'grayscale(100%)');
		filterelements.css('-ms-filter', 'grayscale(100%)');
		filterelements.css('-o-filter', 'grayscale(100%)');
		filterelements.css('filter', 'grayscale(100%)');
		// localStorage.setItem("fx", 'sw');
	});


	button_settings.mousedown(function(e) {
		button_info.removeClass('active');
		$('body').removeClass('creditsvisible');
		if (button_settings.hasClass('active')) {
			button_settings.removeClass('active');
			$('body').removeClass('settingsvisible');
		} else {
			button_settings.addClass('active');
			$('body').addClass('settingsvisible');
		}
	});

	speedbuttons.mousedown(function(e){
		speedbuttons.removeClass('active');
		$(e.target).addClass('active');
	});


	button_ff.mousedown(function(e){
		playback = true;
		speed = fastspeed;
		active_speed_button = $(e.target);
	});
	button_f.mousedown(function(e){
		playback = true;
		speed = slowspeed;
		active_speed_button = $(e.target);
	});
	button_p.mousedown(function(e){
		playback = false;
	});
	button_r.mousedown(function(e){
		playback = true;
		speed = -slowspeed;
		active_speed_button = $(e.target);
	});
	button_rr.mousedown(function(e){
		playback = true;
		speed = -fastspeed;
		active_speed_button = $(e.target);
	});

	/* KEYBOARD */
	$(document).keydown(function(event) {
		if (event.which === 32) {
			playback = !playback;
			speedbuttons.removeClass('active');
			if (playback) {
				active_speed_button.addClass('active');
			} else {
				button_p.addClass('active');
			}
			event.preventDefault();
		}
		if (event.which === 38) {keyboardMap.up = true;event.preventDefault();}
		if (event.which === 40) {keyboardMap.down = true;event.preventDefault();}
	});

	$(document).keyup(function(event) {
		if (event.which === 38) {keyboardMap.up = false;event.preventDefault();}
		if (event.which === 40) {keyboardMap.down = false;event.preventDefault();}
	});



	/****************/
	/* Fullscreen	*/
	/****************/

	var isFullscreen = false;
	$('#fullscreen').mousedown(function(e) {
		toggleFullScreen();
	});
	document.addEventListener('fullscreenchange', function () {
	    isFullscreen = !!document.fullscreen;
	    fullscreenchange();
	}, false);
	document.addEventListener('mozfullscreenchange', function () {
	    isFullscreen = !!document.mozFullScreen;
	    fullscreenchange();
	}, false);
	document.addEventListener('webkitfullscreenchange', function () {
	    isFullscreen = !!document.webkitIsFullScreen;
	    fullscreenchange();
	}, false);
	function fullscreenchange() {
	    if(isFullscreen) {
			$('#fullscreen').addClass('active');
	    } else {
			$('#fullscreen').removeClass('active');
	    }
	}
	function toggleFullScreen() {
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
			if (document.documentElement.requestFullscreen) {
			  document.documentElement.requestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
			  document.documentElement.msRequestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
			  document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
			  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.exitFullscreen) {
			  document.exitFullscreen();
			} else if (document.msExitFullscreen) {
			  document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
			  document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
			  document.webkitExitFullscreen();
			}
		}
	}

})();
