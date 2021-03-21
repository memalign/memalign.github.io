"use strict"

//=== utils =====================================================

function stepNaN(a,x) { return (Number.isNaN(x)||Number.isNaN(a)||x>a)?x:Number.NaN; }
function clamp(x,a,b) { if( x<a ) return a; if( x>b ) return b; return x; }
function saturate(x) { return clamp(x,0.0,1.0); }
function remap(a,b,x,c,d) { if( x<a ) return c; if( x>b ) return d; let y=(x-a)/(b-a); return c + (d-c)*y; }
function smoothstep(a,b,x) { let y = saturate((x-a)/(b-a)); return y*y*(3.0-2.0*y); }
function ssign(x) { return (x>=0.0)?1.0:-1.0; }
function radians(degrees) { return degrees*Math.PI/180.0; }
function degrees(radians) { return radians*180.0/Math.PI; }
function inversesqrt(x) { return 1.0/Math.sqrt(x); }
function rsqrt(x) { return inversesqrt(x); }
function rcbrt(x) { return 1.0/Math.cbrt(x); }
function rcp(x) { return 1.0/x; }
function fma(x,y,z) { return x*y+z; }
function step(a,x) { return (x<a)?0.0:1.0; }
function mix(a,b,x) { return a + (b-a)*x; }
function lerp(a,b,x) { return mix(a,b,x); }
function over(x,y) { return 1.0 - (1.0-x)*(1.0-y); }
function tri(a,x) { x = x / (2.0*Math.PI); x = x % 1.0; x = (x>0.0) ? x : x+1.0; if(x<a) x=x/a; else x=1.0-(x-a)/(1.0-a); return -1.0+2.0*x; }
function sqr(a,x) { return (Math.sin(x)>a)?1.0:-1.0; }
function frac(x)  { return x - Math.floor(x); }
function fract(x) { return frac(x); }
function exp2(x)  { return pow(2.0,x); }
function exp10(x) { return pow(10.0,x); }
function mod(x,y) { return x-y*Math.floor(x/y); }
function cellnoise(x)
{
  let n = Math.floor(x) | 0;
  n = (n << 13) ^ n;
  n = (n * (n * n * 15731 + 789221) + 1376312589);
  n = (n>>14) & 65535;
  return n/65535.0;
}
function voronoi(x)
{
  const i = Math.floor(x);
  const f = x - i;
  const x0 = cellnoise(i-1); const d0 = Math.abs(f-(-1+x0));
  const x1 = cellnoise(i  ); const d1 = Math.abs(f-(   x1));
  const x2 = cellnoise(i+1); const d2 = Math.abs(f-( 1+x2));
  let r = d0;
  r = (d1<r)?d1:r;
  r = (d2<r)?d2:r;
  return r;
}
function noise(x)
{
  const i = Math.floor(x) | 0;
  const f = x - i;
  const w = f*f*f*(f*(f*6.0-15.0)+10.0);
  const a = (2.0*cellnoise( i+0 )-1.0)*(f+0.0);
  const b = (2.0*cellnoise( i+1 )-1.0)*(f-1.0);
  return 2.0*(a + (b-a)*w);
}

//=== grapher ===================================================

function Grapher()
{
	// --- private ----------------------------------------------

    const mCanvas = document.getElementById('mainCanvas');
    const mContext = mCanvas.getContext('2d');
	const kTheme =
	[
		{
			mBackground : "#202020",
			mBackgroundOut : "#000000",
			mText : "#B0B0B0",
			mGrid     : "#606060",
			mGridThin : "#404040",
			mGraphs : ['#ffc040', '#ffffa0', '#a0ffc0', '#40c0ff', '#d0a0ff', '#ff80b0']
		},
		{
			mBackground : "#FFFFFF",
			mBackgroundOut : "#808080",
			mText : "#000000",
			mGrid : "#A0A0A0",
			mGridThin : "#D0D0D0",
			mGraphs : ['#ff8000', '#ffe800', '#40ff00', '#1040ff', '#ff10ff', '#ff0000']
		}
	];

    let mMouseFunction = 0;
    let mCx = 0.0;
    let mCy = 0.0;
    let mRa = 12.0;
    let mRefCx = -1.0;
    let mRefCy = -1.0;
    let mRefRa = -1.0;
    let mRefMouseX = -1.0;
    let mRefMouseY = -1.0;
    let mRangeType = 2;
    let mShowAxes = true;
	let mPaused = true;
    let mTimeMS = 0;
	let mOffsetMS = 0;
	let mStartMS = 0;
	let mTimeS = 0.0;
	let mTheme = 0;
	let mFocusFormula = null;
	let mFunctionFun = [null,null,null,null,null,null];
	let mFunctionVis = [true,true,true,true,true,true];
	let mXres = 0;
	let mYres = 0;

	function iMouseUp(e)
	{
		mMouseFunction = 0;
	}

	function iMouseDown(e)
	{
	    if( !e ) e = window.event;
		if( mRangeType!=2 ) return;
		if( (e.button==0) && (e.shiftKey==false) )
			mMouseFunction = 1;
		else
			mMouseFunction = 2;
		mRefCx = mCx;
		mRefCy = mCy;
		mRefRa = mRa;
		mRefMouseX = e.pageX;
		mRefMouseY = e.pageY;
	}

	function iMouseMove(e)
	{
		if(!e) e = window.event;
		const cxres = mCanvas.offsetWidth;
		const cyres = mCanvas.offsetHeight;

		if( mMouseFunction==0 )
		{
			const rx = mRa;
			const ry = mRa*cyres/cxres;
			const x = mCx + 2.0*rx*((e.offsetX/cxres)-0.5);
			const y = mCy - 2.0*ry*((e.offsetY/cyres)-0.5);
			const n = 1+Math.floor(  Math.log(cxres/(rx*2.0))/Math.log(10.0) );
			document.getElementById('myCoords').innerHTML = '(' + x.toFixed(n) + ', ' + y.toFixed(n) + ')';
		}

		if( mRangeType!=2 ) return;

		if( mMouseFunction==1 )
		{
			mCx = mRefCx - (e.pageX - mRefMouseX) * 2.0*mRa/cxres;
			mCy = mRefCy + (e.pageY - mRefMouseY) * 2.0*mRa/cxres;
			if( mPaused ) iDraw();
		}
		else if( mMouseFunction==2 )
		{
			const scale = Math.pow(0.99, (e.pageX - mRefMouseX));
			mRa = mRefRa * scale;
			if( mPaused ) iDraw();
		}
	}

	function iMouseWheel(e)
	{
		if(!e) e = window.event;
		const sfactor = 1.1;
		const scale = (e.deltaY<0 || e.wheelDelta>0) ? 1.0/sfactor : sfactor;
		e.preventDefault();
		mRa = mRa * scale;
		if( mPaused ) iDraw();
	}

    mCanvas.onmousedown = function(ev) { iMouseDown(ev); }
    mCanvas.onmousemove = function(ev) { iMouseMove(ev); }
    mCanvas.onmouseup   = function(ev) { iMouseUp(ev); }
    mCanvas.onmouseout  = function(ev) { iMouseUp(ev); }
	mCanvas.onwheel     = function(ev) { iMouseWheel(ev); }

	mCanvas.addEventListener("touchstart", function (e) {
		e.preventDefault();
		if( mRangeType!=2 ) return;

		if( e.touches.length === 1 )
		{
			mMouseFunction = 1;
			mRefCx = mCx;
			mRefCy = mCy;
			mRefRa = mRa;
			mRefMouseX = e.changedTouches[0].clientX;
			mRefMouseY = e.changedTouches[0].clientY;
		}
		else if( e.touches.length === 2 )
		{
			let d = Math.hypot( e.touches[0].clientX - e.touches[1].clientX,
                                e.touches[0].clientY - e.touches[1].clientY );
			mMouseFunction = 2;
			mRefCx = mCx;
			mRefCy = mCy;
			mRefRa = mRa;
			mRefMouseX = d;
			mRefMouseY = 0;
		}
	}, false);

	mCanvas.addEventListener("touchend", function (e) {
		e.preventDefault();
		mMouseFunction = 0;
	}, false);

	mCanvas.addEventListener("touchmove", function (e) {
		e.preventDefault();
		if( mRangeType!=2 ) return;
		let touches = e.changedTouches;

		if( mMouseFunction===1 )
		{
			let x = touches[0].clientX;
			let y = touches[0].clientY;
			let dpr = window.devicePixelRatio || 1;
			mCx = mRefCx - (x - mRefMouseX) * dpr*2.0*mRa / mXres;
			mCy = mRefCy + (y - mRefMouseY) * dpr*2.0*mRa / mXres;
			if( mPaused ) iDraw();
		}
		else if( mMouseFunction===2 )
		{
			let d = Math.hypot( touches[0].clientX - touches[1].clientX,
                                touches[0].clientY - touches[1].clientY );
			let scale = Math.pow(0.99, d - mRefMouseX);
			mRa = mRefRa * scale;
			if( mPaused ) iDraw();
		}
	}, false);

	let eles = document.querySelectorAll(".uiFunc, .uiFuncB");
    for( let i = 0; i < eles.length; i++)
	{
		eles[i].addEventListener('mousedown',function() { mFocusFormula = document.activeElement; }, false);
	}

	window.onresize = function(ev) { iResize(ev); }

	function iResetCoords()
	{
	  mCx = 0.0;
	  mCy = 0.0;
	  mRa = 12.0;
	}

	function iAdjustCanvas()
	{
	  const devicePixelRatio = window.devicePixelRatio || 1;
	  const w = mCanvas.offsetWidth * devicePixelRatio;
	  const h = mCanvas.offsetHeight * devicePixelRatio;
	  mCanvas.width =  w;
	  mCanvas.height = h;
	  mXres = w;
	  mYres = h;
	}

	function iApplyFormulaVisibilityColor( index )
	{
	  const id = index - 1;
	  const ele = document.getElementById('f'+index	);
	  const vis = mFunctionVis[id];
	  if( vis===true ) ele.classList.add(   "formVisDar"+index);
	  else             ele.classList.remove("formVisDar"+index);
	}

	function iCompile( id )
	{
	  const index = id+1;
	  const uiFormula = document.getElementById('formula'+index);
	  const strFormula = uiFormula.value;

	  mFunctionFun[id] = null;
	  uiFormula.style.borderColor = "transparent";

	  if( strFormula==null ) return;
	  if( strFormula=='' ) return;

	  uiFormula.style.borderColor = "#ff0000";
	  if( iNotOnBlackList(strFormula) == false ) return;

	  let str = "with(Math){";
	  if(id>=1)
		str += "function f1(x,t){return ("+document.getElementById('formula1').value+");}"
	  if(id>=2)
		str += "function f2(x,t){return ("+document.getElementById('formula2').value+");}"
	  if(id>=3)
		str += "function f3(x,t){return ("+document.getElementById('formula3').value+");}"
	  if(id>=4)
		str += "function f4(x,t){return ("+document.getElementById('formula4').value+");}"
	  if(id>=5)
		str += "function f5(x,t){return ("+document.getElementById('formula5').value+");}"

	  str = str + "return("+strFormula+");}";

      const kPHI = "(1.61803398874989484820)";

      function iSubst( str, a, b ) { return str.split(a).join(b); }

	//str = str.replaceAll( "^", "**" );
	//str = str.split("^").join("**");
      str = iSubst(str,"^","**");
      str = iSubst(str,"²","**2" ); // &#xB2;
      str = iSubst(str,"³","**3"); // &#xB3;
      str = iSubst(str,"\u2074","**4");
      str = iSubst(str,"\u2075","**5");
      str = iSubst(str,"\u2076","**6");
      str = iSubst(str,"\u2077","**7");
      str = iSubst(str,"\u2078","**8");
      str = iSubst(str,"\u2079","**9");
      str = iSubst(str,"𝜋","PI" ); // &#x1D70B;
      str = iSubst(str,"π","PI" ); // &#x3C0;
      str = iSubst(str,"𝛑","PI" );
      str = iSubst(str,"𝝅","PI" );
      str = iSubst(str,"𝞹","PI" );
      str = iSubst(str,"PHI",kPHI);
      str = iSubst(str,"\u03C6",kPHI);
      str = iSubst(str,"TAU","(2*PI)");
      str = iSubst(str,"𝜏","(2*PI)" ); // &#120591;
      str = iSubst(str,"½","(1/2)" ); // &#xBD;
      str = iSubst(str,"⅓","(1/3)" ); // &#x2153;
      str = iSubst(str,"⅔","(2/3)" ); // &#x2154;
      str = iSubst(str,"¼","(1/4)" ); // &#xBC;
      str = iSubst(str,"¾","(3/4)" ); // &#xBE;
      str = iSubst(str,"⅕","(1/5)" ); // &#x2155;
      str = iSubst(str,"⅖","(2/5)" ); // &#x2156;
      str = iSubst(str,"⅗","(3/5)" ); // &#x2157;
      str = iSubst(str,"⅘","(4/5)" ); // &#x2158;
      str = iSubst(str,"⅙","(1/6)" ); // &#x2159;
      str = iSubst(str,"⅚","(5/6)" ); // &#x215A;
      str = iSubst(str,"⅐","(1/7)" ); // &#x2150;
      str = iSubst(str,"⅛","(1/8)" ); // &#x215B;
      str = iSubst(str,"⅜","(3/8)" ); // &#x215C;
      str = iSubst(str,"⅝","(5/8)" ); // &#x215D;
      str = iSubst(str,"⅞","(7/8)" ); // &#x215E;
      str = iSubst(str,"⅑","(1/9)" ); // &#x2151;
      str = iSubst(str,"⅒","(1/10)" ); // &#x2152;

	  let fnFormula = null;

	  try { fnFormula=new Function( "x,t", str ); }
	  catch( err ){return;}
	  try { let y=fnFormula(0.1,0.2); } catch(err){return;}

	  uiFormula.style.borderColor = "transparent";
	  mFunctionFun[id] = fnFormula;
	}

	function iApplyGrid()
	{
		const ele = document.getElementById("myAxes");
		ele.textContent = (mShowAxes==true)?"Grid On":"Grid Off";
	}

	function iSetVisibility(index, vis)
	{
	  const id = index - 1;
	  mFunctionVis[id] = vis;
	  iApplyFormulaVisibilityColor( index, vis );
	  if( mPaused ) iDraw();
	}

	function iNotOnBlackList( formula )
	{
		if( formula.length > 256 )
		{
			alert("Formula is too long...");
			return false;
		}

		// ripped from Ed Mackey
		const kBlackList = ["?","=","[","]","'",";", "new", "ml", "$", ").",
		                    "alert", "ook", "ipt", "doc", "win", "set", "get",
							"tim", "net", "post", "black", "z", "if"];
		const lowFormula = formula.toLowerCase();
		for( let n=0; n<kBlackList.length; n++ )
		{
			if( lowFormula.indexOf(kBlackList[n]) != -1 )
			{
				console.log( "Forbidden word");
				return false;
			}
		}
		return true;
	}

	function iDrawGraph(id,mycolor)
	{
		mContext.strokeStyle = mycolor;
		mContext.lineWidth = (mTheme===0) ? 2.0 : 3.0;
		mContext.fillStyle = mycolor;

		let oldBadNum = true;
		let success = true;

		const formula = mFunctionFun[id];
		const rx = mRa;
		const ry = mRa*mYres/mXres;
		const t = mTimeS;
		mContext.beginPath();
		for( let i=0; i<mXres; i++ )
		{
			const x = mCx + rx * (-1.0 + 2.0*i/mXres);
			let y = 0.0;
			try { y = formula(x,t); } catch(err){success=false;break;}

			let badNum = isNaN(y) || (y==Number.NEGATIVE_INFINITY) || (y==Number.POSITIVE_INFINITY) || (Math.abs(y)>1e9);

			if( !badNum )
			{
				let j = mYres*(0.5 + 0.5*(mCy-y)/ry);
				if( oldBadNum )
					mContext.moveTo(i, j);
				else
					mContext.lineTo(i, j);
			}
			oldBadNum = badNum;
		}
		mContext.stroke();

		return success;
	}

	function iResize( e )
	{
	    iAdjustCanvas();
	    if( mPaused ) iDraw();
	}

	function iDraw()
	{
		if( mRangeType===0 )
		{
		  mCx = 0.5;
		  mCy = 0.5;
		  mRa = 0.5*mXres/mYres;
		}
		else if( mRangeType===1 )
		{
		  mCx = 0.0;
		  mCy = 0.0;
		  mRa = 1.0*mXres/mYres;
		}
		else
		{
		}

		const rx = mRa;
		const ry = mRa*mYres/mXres;
		const minx = mCx - rx;
		const maxx = mCx + rx;
		const miny = mCy - ry;
		const maxy = mCy + ry;

		const theme = kTheme[mTheme];

		// axes
		const ctx = mContext;
		ctx.setTransform(1, 0.0, 0.0, 1, 0.5, 0.5);
		ctx.fillStyle = theme.mBackground;
		ctx.fillRect(0, 0, mXres, mYres);

		if( mRangeType===0 || mRangeType===1 )
		{
			ctx.fillStyle = theme.mBackgroundOut;
			let ww = (mXres - mYres)/2;
			ctx.fillRect(0, 0, ww, mYres);
			ctx.fillRect(mXres-1-ww, 0, ww, mYres);
		}

		if( mShowAxes )
		{
			const devicePixelRatio = window.devicePixelRatio || 1;
			const fontSize = 10*devicePixelRatio;
			ctx.lineWidth = 1.0;
			ctx.font = fontSize.toFixed(0)+'px arial';

			let n = -1+Math.floor(Math.log(mXres/(rx*2.0))/Math.log(5.0) );
			if( n<0 ) n=0; else if( n>100 ) n=100;


			function drawGrid( off, color )
			{
				ctx.strokeStyle = color;

				//let ste = Math.pow(10.0,off+Math.floor(Math.log10(rx)));
				let ste = Math.pow(5.0,off+Math.floor(Math.log(rx)/Math.log(5.0)));

				const iax = Math.floor(minx/ste);
				const ibx = Math.floor(maxx/ste);
				const iay = Math.floor(miny/ste);
				const iby = Math.floor(maxy/ste);

				ctx.beginPath();
				for( let i=iax; i<=ibx; i++ )
				{
					 let x = i*ste;
					 let ix = mXres*(0.5 + (x-mCx)/(2.0*rx));
					 ctx.moveTo(ix, mYres);
					 ctx.lineTo(ix, 0);
				}
				for( let i=iay; i<=iby; i++ )
				{
					 let y = i*ste;
					 let iy = mYres*(0.5 - (y-mCy)/(2.0*ry));
					 ctx.moveTo(mXres, iy);
					 ctx.lineTo(0, iy);
				}
				ctx.stroke();

				if( off==0 )
				{
					ctx.fillStyle = theme.mText;
					for( let i=iax; i<=ibx; i++ )
					{
						 let x = i*ste;
						 let ix = mXres*(0.5 + (x-mCx)/(2.0*rx));
						 ctx.fillText(x.toFixed(n), ix + 4, mYres - 2);
					}
					for( let i=iay; i<=iby; i++ )
					{
						 let y = i*ste;
						 let iy = mYres*(0.5 - (y-mCy)/(2.0*ry));
						 ctx.fillText(y.toFixed(n), 2, iy + 10 );
					}
				}
			}

			drawGrid(-1, theme.mGridThin); // thin grid
			drawGrid( 0, theme.mGrid);     // coarse grid

			// axis
			{
				const xPos = mXres*(0.5-mCx/(2.0*rx));
				const yPos = mYres*(0.5+mCy/(2.0*ry));
				ctx.strokeStyle = theme.mGrid;
				ctx.lineWidth = 2;
				ctx.beginPath();
					ctx.moveTo(xPos, 0); ctx.lineTo(xPos, mYres);
					ctx.moveTo(0, yPos); ctx.lineTo(mXres,  yPos);
				ctx.stroke();
			}
		}

		// graphs
		for( let i=0; i<6; i++ )
		{
			const uiFormula = document.getElementById('formula'+(1+i));
			const strFormula = uiFormula.value;

			if( strFormula==null ) { continue; }
			if( strFormula=='' ) { continue; }
			if( iNotOnBlackList(strFormula) == false ) continue;

			if( mFunctionVis[i] )
			{
				iDrawGraph(i, theme.mGraphs[i]);
			}
		}
	}

	// --- public ----------------------------------------------

	let me = {};

	me.clearFormulas = function()
	{
	  for( let i=0; i<6; i++ )
	  {
		const uiFormula = document.getElementById('formula'+(i+1));
		uiFormula.value = "";
		let vis = false;
		if( i==0 )
		{
		  uiFormula.value = "x";
		  vis = true;
		}
		me.newFormula( (i+1) );
		iSetVisibility( (i+1), vis );
	  }
	  iResetCoords();
	  if( mPaused ) iDraw();
	}

	me.createLink = function()
	{
	  let url = "";
	  for( let i=0; i<6; i++ )
	  {
		let id = i + 1;
		let uiFormula = document.getElementById('formula'+id);

		url += (i==0)?"?":"&";
		url += "f"+id+"(x,t)="+encodeURI(uiFormula.value);
		url += "&v"+id+"="+((mFunctionVis[i]===true)?"true":"false");
	  }
	  url += "&grid=" + ((mShowAxes===true)?"true":"false");
	  url += "&coords=" + mCx + "," + mCy + "," + mRa;

	  let base = window.location.href.split('?')[0];
	  let finalURL = base + url;

	  if( navigator.clipboard )
	  {
		navigator.clipboard.writeText(finalURL).then(
		  function()   {window.location.replace(finalURL);},
		  function(err){window.location.replace(finalURL);});
	  }
	  else
	  {
		window.location.replace(finalURL);
	  }
	}


	me.parseUrlFormulas = function( args )
	{
		let thereAreArgs = false;
		for( let i=0; i<args.length; i++ )
		{
			if( args[i][0]=='f' && args[i][2]=='(' && args[i][3]=='x' &&
				args[i][4]==',' && args[i][5]=='t' && args[i][6]==')' && args[i][7]=='=' )
			{
				let id = args[i][1] - '0';
				let param = args[i].substring(8);

				let uiFormula = document.getElementById('formula'+id);
				uiFormula.value = decodeURI(param).replace(/\s/g, "");
				thereAreArgs = true;

				me.newFormula( id );
			}
			else if( args[i][0]=='v' && args[i][2]=='=' )
			{
				let id = args[i][1] - '0';
				let param = args[i].substring(3);
				iSetVisibility( id, (param==="true") );
			}
			else if( args[i][0]=='g' && args[i][1]=='r' && args[i][2]=='i' &&
					 args[i][3]=='d' && args[i][4]=='=' )
			{
				let param = args[i].substring(5);
				mShowAxes = (param==="true");
				iApplyGrid(mShowAxes);
			}
			else if( args[i][0]=='c' && args[i][1]=='o' && args[i][2]=='o' &&
			         args[i][3]=='r' && args[i][4]=='d' && args[i][5]=='s' &&
					 args[i][6]=='=' )
			{
				let param = args[i].substring(7);
				let subargs = param.split(',');
				mCx = Number(subargs[0]);
				mCy = Number(subargs[1]);
				mRa = Number(subargs[2]);
				if( Number.isNaN(mCx) ||
					Number.isNaN(mCy) ||
					Number.isNaN(mRa) )
				{
					iResetCoords();
				}
			}
		}
		if( thereAreArgs )
		{
			if( mPaused ) iDraw();
		}
		else
		{
		   me.sample1Formulas();
		}
	}

	me.sample1Formulas = function()
	{
	  for( let i=0; i<6; i++ )
	  {
		const uiFormula = document.getElementById('formula'+(i+1));
		if( i==0 ) uiFormula.value = "4 + 4*smoothstep(0,0.7,sin(x+t))";
		if( i==1 ) uiFormula.value = "sqrt(9^2-x^2)";
		if( i==2 ) uiFormula.value = "3*sin(x)/x";
		if( i==3 ) uiFormula.value = "2*noise(3*x+t)+f3(x,t)";
		if( i==4 ) uiFormula.value = "(t + floor(x-t))/2 - 5";
		if( i==5 ) uiFormula.value = "sin(f5(x,t)) - 5";
		me.newFormula( (i+1) );
		iSetVisibility( (i+1), (i!=4) );
	  }
	  iResetCoords();
	  if( mPaused ) iDraw();
	}

	me.sample2Formulas = function()
	{
	  for( let i=0; i<6; i++ )
	  {
		const uiFormula = document.getElementById('formula'+(i+1));
		if( i==0 ) uiFormula.value = "sqrt(8^2-x^2)";
		if( i==1 ) uiFormula.value = "-f1(x,t)";
		if( i==2 ) uiFormula.value = "7/2-sqrt(3^2-(abs(x)-3.5)^2)";
		if( i==3 ) uiFormula.value = "7/2+sqrt(3^2-(abs(x)-3.5)^2)/2";
		if( i==4 ) uiFormula.value = "3+sqrt(1-(abs(x+sin(4*t)/2)-3)^2)*2/3";
		if( i==5 ) uiFormula.value = "-3-sqrt(5^2-x^2)*(1/4+pow(0.5+0.5*sin(2*PI*t),6)/10)";
		me.newFormula( (i+1) );
		iSetVisibility( (i+1), true );
	  }
	  iResetCoords();
	  if( mPaused ) iDraw();
	}

	me.resetTime  = function()
	{
	  mTimeMS = 0;
	  mTimeS = 0.0;
	  mStartMS = 0;
	  mOffsetMS = 0;
	  if( mPaused )
	  {
		iDraw();
		let eleTime = document.getElementById('myTime');
		eleTime.textContent = "t = " + mTimeS.toFixed(2);
	  }
	}

	me.togglePlay = function()
	{
		mPaused = !mPaused;

		const elePlay = document.getElementById('myPlay');
		elePlay.src = (mPaused) ? "play.png" : "pause.png"

		if( !mPaused )
		{
			const eleTime = document.getElementById('myTime');
			mStartMS = 0;
			mOffsetMS = mTimeMS;
			function update( time )
			{
				if( mStartMS==0 ) mStartMS = time;

				mTimeMS = mOffsetMS + (time-mStartMS);
				mTimeS = mTimeMS / 1000.0;
				eleTime.textContent = "t = " + mTimeS.toFixed(2);

				iDraw();
				if( !mPaused ) requestAnimationFrame(update);
			}
			requestAnimationFrame(update);
		}
	}

	me.inject = function(str)
	{
	  const ele = mFocusFormula;
	  if( ele==null ) return;
	  let eleName = ele.getAttribute("name");
	  if( eleName==null ) return;
	  if( !eleName.startsWith("formula") ) return;

	  const start = ele.selectionStart;
	  const end = ele.selectionEnd;
	  const text = ele.value;
	  //ele.setRangeText(str, start, end, 'end');
	  ele.focus();
	  document.execCommand("insertText", false, str);
	}

	me.newFormula = function( index )
	{
	  const id = index - 1;
	  for( let i=id; i<6; i++ )
	  {
		iCompile(i);
	  }
	}

	me.toggleTheme = function()
	{
	  mTheme = 1 - mTheme;
	  const eleTheme = document.getElementById("myTheme");
	  eleTheme.textContent = (mTheme==0)?"Dark":"Light";
	  for( let i=0; i<6; i++ )
	  {
		iApplyFormulaVisibilityColor( i+1 );
	  }
	  if( mPaused ) iDraw();
	}

	me.toggleVisibility = function(index)
	{
	  const id = index - 1;
	  const vis = mFunctionVis[id];
	  iSetVisibility(index,!vis);
	}

	me.toggleShowAxes = function()
	{
	  mShowAxes = !mShowAxes;
	  iApplyGrid(mShowAxes);
	  if( mPaused ) iDraw();
	}

	me.toggleRange = function()
	{
	  mRangeType = (mRangeType+1)%3;
	  const ele = document.getElementById("myRange");

	  ele.textContent = (mRangeType==0)?"0..1":
						(mRangeType==1)?"-1..1":
							            "Free";

	  if( mPaused ) iDraw();
	}

	me.draw = function()
	{
		iDraw();
	}

    //--- initialize ---

	iAdjustCanvas();
    iDraw();
	me.togglePlay();

	return me;
}
