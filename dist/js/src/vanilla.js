/*!
 * classie v1.0.1
 * class helper functions
 * from bonzo https://github.com/ded/bonzo
 * MIT license
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = classie;
} else {
  // browser global
  window.classie = classie;
}

})( window );

(function(window, factory) {
	var globalInstall = function(){
		factory(window.lazySizes);
		window.removeEventListener('lazyunveilread', globalInstall, true);
	};

	factory = factory.bind(null, window, window.document);

	if(typeof module == 'object' && module.exports){
		factory(require('lazysizes'), require('../fix-ios-sizes/fix-ios-sizes'));
	} else if(window.lazySizes) {
		globalInstall();
	} else {
		window.addEventListener('lazyunveilread', globalInstall, true);
	}
}(window, function(window, document, lazySizes) {
	/*jshint eqnull:true */
	'use strict';
	var polyfill;
	var config = (lazySizes && lazySizes.cfg) || window.lazySizesConfig;
	var img = document.createElement('img');
	var supportSrcset = ('sizes' in img) && ('srcset' in img);
	var regHDesc = /\s+\d+h/g;
	var fixEdgeHDescriptor = (function(){
		var regDescriptors = /\s+(\d+)(w|h)\s+(\d+)(w|h)/;
		var forEach = Array.prototype.forEach;

		return function(edgeMatch){
			var img = document.createElement('img');
			var removeHDescriptors = function(source){
				var ratio, match;
				var srcset = source.getAttribute(lazySizesConfig.srcsetAttr);
				if(srcset){
					if((match = srcset.match(regDescriptors))){
						if(match[2] == 'w'){
							ratio = match[1] / match[3];
						} else {
							ratio = match[3] / match[1];
						}

						if(ratio){
							source.setAttribute('data-aspectratio', ratio);
						}
					}
					source.setAttribute(lazySizesConfig.srcsetAttr, srcset.replace(regHDesc, ''));
				}
			};
			var handler = function(e){
				var picture = e.target.parentNode;

				if(picture && picture.nodeName == 'PICTURE'){
					forEach.call(picture.getElementsByTagName('source'), removeHDescriptors);
				}
				removeHDescriptors(e.target);
			};

			var test = function(){
				if(!!img.currentSrc){
					document.removeEventListener('lazybeforeunveil', handler);
				}
			};

			if(edgeMatch[1]){
				document.addEventListener('lazybeforeunveil', handler);

				if(true || edgeMatch[1] > 14){
					img.onload = test;
					img.onerror = test;

					img.srcset = 'data:,a 1w 1h';

					if(img.complete){
						test();
					}
				}
			}
		};
	})();


	if(!config){
		config = {};
		window.lazySizesConfig = config;
	}

	if(!config.supportsType){
		config.supportsType = function(type/*, elem*/){
			return !type;
		};
	}

	if(window.picturefill || config.pf){return;}

	if(window.HTMLPictureElement && supportSrcset){

		if(document.msElementsFromPoint){
			fixEdgeHDescriptor(navigator.userAgent.match(/Edge\/(\d+)/));
		}

		config.pf = function(){};
		return;
	}

	config.pf = function(options){
		var i, len;
		if(window.picturefill){return;}
		for(i = 0, len = options.elements.length; i < len; i++){
			polyfill(options.elements[i]);
		}
	};

	// partial polyfill
	polyfill = (function(){
		var ascendingSort = function( a, b ) {
			return a.w - b.w;
		};
		var regPxLength = /^\s*\d+\.*\d*px\s*$/;
		var reduceCandidate = function (srces) {
			var lowerCandidate, bonusFactor;
			var len = srces.length;
			var candidate = srces[len -1];
			var i = 0;

			for(i; i < len;i++){
				candidate = srces[i];
				candidate.d = candidate.w / srces.w;

				if(candidate.d >= srces.d){
					if(!candidate.cached && (lowerCandidate = srces[i - 1]) &&
						lowerCandidate.d > srces.d - (0.13 * Math.pow(srces.d, 2.2))){

						bonusFactor = Math.pow(lowerCandidate.d - 0.6, 1.6);

						if(lowerCandidate.cached) {
							lowerCandidate.d += 0.15 * bonusFactor;
						}

						if(lowerCandidate.d + ((candidate.d - srces.d) * bonusFactor) > srces.d){
							candidate = lowerCandidate;
						}
					}
					break;
				}
			}
			return candidate;
		};

		var parseWsrcset = (function(){
			var candidates;
			var regWCandidates = /(([^,\s].[^\s]+)\s+(\d+)w)/g;
			var regMultiple = /\s/;
			var addCandidate = function(match, candidate, url, wDescriptor){
				candidates.push({
					c: candidate,
					u: url,
					w: wDescriptor * 1
				});
			};

			return function(input){
				candidates = [];
				input = input.trim();
				input
					.replace(regHDesc, '')
					.replace(regWCandidates, addCandidate)
				;

				if(!candidates.length && input && !regMultiple.test(input)){
					candidates.push({
						c: input,
						u: input,
						w: 99
					});
				}

				return candidates;
			};
		})();

		var runMatchMedia = function(){
			if(runMatchMedia.init){return;}

			runMatchMedia.init = true;
			addEventListener('resize', (function(){
				var timer;
				var matchMediaElems = document.getElementsByClassName('lazymatchmedia');
				var run = function(){
					var i, len;
					for(i = 0, len = matchMediaElems.length; i < len; i++){
						polyfill(matchMediaElems[i]);
					}
				};

				return function(){
					clearTimeout(timer);
					timer = setTimeout(run, 66);
				};
			})());
		};

		var createSrcset = function(elem, isImage){
			var parsedSet;
			var srcSet = elem.getAttribute('srcset') || elem.getAttribute(config.srcsetAttr);

			if(!srcSet && isImage){
				srcSet = !elem._lazypolyfill ?
					(elem.getAttribute(config.srcAttr) || elem.getAttribute('src')) :
					elem._lazypolyfill._set
				;
			}

			if(!elem._lazypolyfill || elem._lazypolyfill._set != srcSet){

				parsedSet = parseWsrcset( srcSet || '' );
				if(isImage && elem.parentNode){
					parsedSet.isPicture = elem.parentNode.nodeName.toUpperCase() == 'PICTURE';

					if(parsedSet.isPicture){
						if(window.matchMedia){
							lazySizes.aC(elem, 'lazymatchmedia');
							runMatchMedia();
						}
					}
				}

				parsedSet._set = srcSet;
				Object.defineProperty(elem, '_lazypolyfill', {
					value: parsedSet,
					writable: true
				});
			}
		};

		var getX = function(elem){
			var dpr = window.devicePixelRatio || 1;
			var optimum = lazySizes.getX && lazySizes.getX(elem);
			return Math.min(optimum || dpr, 2.5, dpr);
		};

		var matchesMedia = function(media){
			if(window.matchMedia){
				matchesMedia = function(media){
					return !media || (matchMedia(media) || {}).matches;
				};
			} else {
				return !media;
			}

			return matchesMedia(media);
		};

		var getCandidate = function(elem){
			var sources, i, len, media, source, srces, src, width;

			source = elem;
			createSrcset(source, true);
			srces = source._lazypolyfill;

			if(srces.isPicture){
				for(i = 0, sources = elem.parentNode.getElementsByTagName('source'), len = sources.length; i < len; i++){
					if( config.supportsType(sources[i].getAttribute('type'), elem) && matchesMedia( sources[i].getAttribute('media')) ){
						source = sources[i];
						createSrcset(source);
						srces = source._lazypolyfill;
						break;
					}
				}
			}

			if(srces.length > 1){
				width = source.getAttribute('sizes') || '';
				width = regPxLength.test(width) && parseInt(width, 10) || lazySizes.gW(elem, elem.parentNode);
				srces.d = getX(elem);
				if(!srces.src || !srces.w || srces.w < width){
					srces.w = width;
					src = reduceCandidate(srces.sort(ascendingSort));
					srces.src = src;
				} else {
					src = srces.src;
				}
			} else {
				src = srces[0];
			}

			return src;
		};

		var p = function(elem){
			if(supportSrcset && elem.parentNode && elem.parentNode.nodeName.toUpperCase() != 'PICTURE'){return;}
			var candidate = getCandidate(elem);

			if(candidate && candidate.u && elem._lazypolyfill.cur != candidate.u){
				elem._lazypolyfill.cur = candidate.u;
				candidate.cached = true;
				elem.setAttribute(config.srcAttr, candidate.u);
				elem.setAttribute('src', candidate.u);
			}
		};

		p.parse = parseWsrcset;

		return p;
	})();

	if(config.loadedClass && config.loadingClass){
		(function(){
			var sels = [];
			['img[sizes$="px"][srcset].', 'picture > img:not([srcset]).'].forEach(function(sel){
				sels.push(sel + config.loadedClass);
				sels.push(sel + config.loadingClass);
			});
			config.pf({
				elements: document.querySelectorAll(sels.join(', '))
			});
		})();

	}
}));

/*
This plugin extends lazySizes to lazyLoad:
background images, videos/posters and scripts

Background-Image:
For background images, use data-bg attribute:
<div class="lazyload" data-bg="bg-img.jpg"></div>

 Video:
 For video/audio use data-poster and preload="none":
 <video class="lazyload" data-poster="poster.jpg" preload="none">
 <!-- sources -->
 </video>

 Scripts:
 For scripts use data-script:
 <div class="lazyload" data-script="module-name.js"></div>


 Script modules using require:
 For modules using require use data-require:
 <div class="lazyload" data-require="module-name"></div>
*/

(function(window, factory) {
	var globalInstall = function(){
		factory(window.lazySizes);
		window.removeEventListener('lazyunveilread', globalInstall, true);
	};

	factory = factory.bind(null, window, window.document);

	if(typeof module == 'object' && module.exports){
		factory(require('lazysizes'));
	} else if(window.lazySizes) {
		globalInstall();
	} else {
		window.addEventListener('lazyunveilread', globalInstall, true);
	}
}(window, function(window, document, lazySizes) {
	/*jshint eqnull:true */
	'use strict';
	var bgLoad, regBgUrlEscape;
	var uniqueUrls = {};

	if(document.addEventListener){
		regBgUrlEscape = /\(|\)|\s|'/;

		bgLoad = function (url, cb){
			var img = document.createElement('img');
			img.onload = function(){
				img.onload = null;
				img.onerror = null;
				img = null;
				cb();
			};
			img.onerror = img.onload;

			img.src = url;

			if(img && img.complete && img.onload){
				img.onload();
			}
		};

		addEventListener('lazybeforeunveil', function(e){
			if(e.detail.instance != lazySizes){return;}

			var tmp, load, bg, poster;
			if(!e.defaultPrevented) {

				if(e.target.preload == 'none'){
					e.target.preload = 'auto';
				}

				tmp = e.target.getAttribute('data-link');
				if(tmp){
					addStyleScript(tmp, true);
				}

				// handle data-script
				tmp = e.target.getAttribute('data-script');
				if(tmp){
					addStyleScript(tmp);
				}

				// handle data-require
				tmp = e.target.getAttribute('data-require');
				if(tmp){
					if(lazySizes.cfg.requireJs){
						lazySizes.cfg.requireJs([tmp]);
					} else {
						addStyleScript(tmp);
					}
				}

				// handle data-bg
				bg = e.target.getAttribute('data-bg');
				if (bg) {
					e.detail.firesLoad = true;
					load = function(){
						e.target.style.backgroundImage = 'url(' + (regBgUrlEscape.test(bg) ? JSON.stringify(bg) : bg ) + ')';
						e.detail.firesLoad = false;
						lazySizes.fire(e.target, '_lazyloaded', {}, true, true);
					};

					bgLoad(bg, load);
				}

				// handle data-poster
				poster = e.target.getAttribute('data-poster');
				if(poster){
					e.detail.firesLoad = true;
					load = function(){
						e.target.poster = poster;
						e.detail.firesLoad = false;
						lazySizes.fire(e.target, '_lazyloaded', {}, true, true);
					};

					bgLoad(poster, load);

				}
			}
		}, false);

	}

	function addStyleScript(src, style){
		if(uniqueUrls[src]){
			return;
		}
		var elem = document.createElement(style ? 'link' : 'script');
		var insertElem = document.getElementsByTagName('script')[0];

		if(style){
			elem.rel = 'stylesheet';
			elem.href = src;
		} else {
			elem.src = src;
		}
		uniqueUrls[src] = true;
		uniqueUrls[elem.src || elem.href] = true;
		insertElem.parentNode.insertBefore(elem, insertElem);
	}
}));

(function(window, factory) {
	var globalInstall = function(){
		factory(window.lazySizes);
		window.removeEventListener('lazyunveilread', globalInstall, true);
	};

	factory = factory.bind(null, window, window.document);

	if(typeof module == 'object' && module.exports){
		factory(require('lazysizes'));
	} else if(window.lazySizes) {
		globalInstall();
	} else {
		window.addEventListener('lazyunveilread', globalInstall, true);
	}
}(window, function(window, document, lazySizes) {
	'use strict';

	if(!window.addEventListener){return;}

	var forEach = Array.prototype.forEach;

	var imageRatio, extend$, $;

	var regPicture = /^picture$/i;
	var aspectRatioAttr = 'data-aspectratio';
	var aspectRatioSel = 'img[' + aspectRatioAttr + ']';

	var matchesMedia = function(media){
		if(window.matchMedia){
			matchesMedia = function(media){
				return !media || (matchMedia(media) || {}).matches;
			};
		} else if(window.Modernizr && Modernizr.mq){
			return !media || Modernizr.mq(media);
		} else {
			return !media;
		}
		return matchesMedia(media);
	};

	var addClass = lazySizes.aC;
	var removeClass = lazySizes.rC;
	var lazySizesConfig = lazySizes.cfg;

	function AspectRatio(){
		this.ratioElems = document.getElementsByClassName('lazyaspectratio');
		this._setupEvents();
		this.processImages();
	}

	AspectRatio.prototype = {
		_setupEvents: function(){
			var module = this;

			var addRemoveAspectRatio = function(elem){
				if(elem.naturalWidth < 36){
					module.addAspectRatio(elem, true);
				} else {
					module.removeAspectRatio(elem, true);
				}
			};
			var onload = function(){
				module.processImages();
			};

			document.addEventListener('load', function(e){
				if(e.target.getAttribute && e.target.getAttribute(aspectRatioAttr)){
					addRemoveAspectRatio(e.target);
				}
			}, true);

			addEventListener('resize', (function(){
				var timer;
				var resize = function(){
					forEach.call(module.ratioElems, addRemoveAspectRatio);
				};

				return function(){
					clearTimeout(timer);
					timer = setTimeout(resize, 99);
				};
			})());

			document.addEventListener('DOMContentLoaded', onload);

			addEventListener('load', onload);
		},
		processImages: function(context){
			var elements, i;

			if(!context){
				context = document;
			}

			if('length' in context && !context.nodeName){
				elements = context;
			} else {
				elements = context.querySelectorAll(aspectRatioSel);
			}

			for(i = 0; i < elements.length; i++){
				if(elements[i].naturalWidth > 36){
					this.removeAspectRatio(elements[i]);
					continue;
				}
				this.addAspectRatio(elements[i]);
			}
		},
		getSelectedRatio: function(img){
			var i, len, sources, customMedia, ratio;
			var parent = img.parentNode;
			if(parent && regPicture.test(parent.nodeName || '')){
				sources = parent.getElementsByTagName('source');

				for(i = 0, len = sources.length; i < len; i++){
					customMedia = sources[i].getAttribute('data-media') || sources[i].getAttribute('media');

					if(lazySizesConfig.customMedia[customMedia]){
						customMedia = lazySizesConfig.customMedia[customMedia];
					}

					if(matchesMedia(customMedia)){
						ratio = sources[i].getAttribute(aspectRatioAttr);
						break;
					}
				}
			}

			return ratio || img.getAttribute(aspectRatioAttr) || '';
		},
		parseRatio: (function(){
			var regRatio = /^\s*([+\d\.]+)(\s*[\/x]\s*([+\d\.]+))?\s*$/;
			var ratioCache = {};
			return function(ratio){
				var match;

				if(!ratioCache[ratio] && (match = ratio.match(regRatio))){
					if(match[3]){
						ratioCache[ratio] = match[1] / match[3];
					} else {
						ratioCache[ratio] = match[1] * 1;
					}
				}

				return ratioCache[ratio];
			};
		})(),
		addAspectRatio: function(img, notNew){
			var ratio;
			var width = img.offsetWidth;
			var height = img.offsetHeight;

			if(!notNew){
				addClass(img, 'lazyaspectratio');
			}

			if(width < 36 && height <= 0){
				if(width || height && window.console){
					console.log('Define width or height of image, so we can calculate the other dimension');
				}
				return;
			}

			ratio = this.getSelectedRatio(img);
			ratio = this.parseRatio(ratio);

			if(ratio){
				if(width){
					img.style.height = (width / ratio) + 'px';
				} else {
					img.style.width = (height * ratio) + 'px';
				}
			}
		},
		removeAspectRatio: function(img){
			removeClass(img, 'lazyaspectratio');
			img.style.height = '';
			img.style.width = '';
			img.removeAttribute(aspectRatioAttr);
		}
	};

	extend$ = function(){
		$ = window.jQuery || window.Zepto || window.shoestring || window.$;
		if($ && $.fn && !$.fn.imageRatio && $.fn.filter && $.fn.add && $.fn.find){
			$.fn.imageRatio = function(){
				imageRatio.processImages(this.find(aspectRatioSel).add(this.filter(aspectRatioSel)));
				return this;
			};
		} else {
			$ = false;
		}
	};

	extend$();
	setTimeout(extend$);

	imageRatio = new AspectRatio();

	window.imageRatio = imageRatio;

	if(typeof module == 'object' && module.exports){
		module.exports = imageRatio;
	} else if (typeof define == 'function' && define.amd) {
		define(imageRatio);
	}

}));

(function(window, factory) {
	var globalInstall = function(){
		factory(window.lazySizes);
		window.removeEventListener('lazyunveilread', globalInstall, true);
	};

	factory = factory.bind(null, window, window.document);

	if(typeof module == 'object' && module.exports){
		factory(require('lazysizes'));
	} else if(window.lazySizes) {
		globalInstall();
	} else {
		window.addEventListener('lazyunveilread', globalInstall, true);
	}
}(window, function(window, document, lazySizes) {
	'use strict';
	if(!window.addEventListener){return;}

	var regWhite = /\s+/g;
	var regSplitSet = /\s*\|\s+|\s+\|\s*/g;
	var regSource = /^(.+?)(?:\s+\[\s*(.+?)\s*\])(?:\s+\[\s*(.+?)\s*\])?$/;
	var regType = /^\s*\(*\s*type\s*:\s*(.+?)\s*\)*\s*$/;
	var regBgUrlEscape = /\(|\)|'/;
	var allowedBackgroundSize = {contain: 1, cover: 1};
	var proxyWidth = function(elem){
		var width = lazySizes.gW(elem, elem.parentNode);

		if(!elem._lazysizesWidth || width > elem._lazysizesWidth){
			elem._lazysizesWidth = width;
		}
		return elem._lazysizesWidth;
	};
	var getBgSize = function(elem){
		var bgSize;

		bgSize = (getComputedStyle(elem) || {getPropertyValue: function(){}}).getPropertyValue('background-size');

		if(!allowedBackgroundSize[bgSize] && allowedBackgroundSize[elem.style.backgroundSize]){
			bgSize = elem.style.backgroundSize;
		}

		return bgSize;
	};
	var setTypeOrMedia = function(source, match){
		if(match){
			var typeMatch = match.match(regType);
			if(typeMatch && typeMatch[1]){
				source.setAttribute('type', typeMatch[1]);
			} else {
				source.setAttribute('media', lazySizesConfig.customMedia[match] || match);
			}
		}
	};
	var createPicture = function(sets, elem, img){
		var picture = document.createElement('picture');
		var sizes = elem.getAttribute(lazySizesConfig.sizesAttr);
		var ratio = elem.getAttribute('data-ratio');
		var optimumx = elem.getAttribute('data-optimumx');

		if(elem._lazybgset && elem._lazybgset.parentNode == elem){
			elem.removeChild(elem._lazybgset);
		}

		Object.defineProperty(img, '_lazybgset', {
			value: elem,
			writable: true
		});
		Object.defineProperty(elem, '_lazybgset', {
			value: picture,
			writable: true
		});

		sets = sets.replace(regWhite, ' ').split(regSplitSet);

		picture.style.display = 'none';
		img.className = lazySizesConfig.lazyClass;

		if(sets.length == 1 && !sizes){
			sizes = 'auto';
		}

		sets.forEach(function(set){
			var match;
			var source = document.createElement('source');

			if(sizes && sizes != 'auto'){
				source.setAttribute('sizes', sizes);
			}

			if((match = set.match(regSource))){
				source.setAttribute(lazySizesConfig.srcsetAttr, match[1]);

				setTypeOrMedia(source, match[2]);
				setTypeOrMedia(source, match[3]);
			} else {
				source.setAttribute(lazySizesConfig.srcsetAttr, set);
			}

			picture.appendChild(source);
		});

		if(sizes){
			img.setAttribute(lazySizesConfig.sizesAttr, sizes);
			elem.removeAttribute(lazySizesConfig.sizesAttr);
			elem.removeAttribute('sizes');
		}
		if(optimumx){
			img.setAttribute('data-optimumx', optimumx);
		}
		if(ratio) {
			img.setAttribute('data-ratio', ratio);
		}

		picture.appendChild(img);

		elem.appendChild(picture);
	};

	var proxyLoad = function(e){
		if(!e.target._lazybgset){return;}

		var image = e.target;
		var elem = image._lazybgset;
		var bg = image.currentSrc || image.src;

		if(bg){
			elem.style.backgroundImage = 'url(' + (regBgUrlEscape.test(bg) ? JSON.stringify(bg) : bg ) + ')';
		}

		if(image._lazybgsetLoading){
			lazySizes.fire(elem, '_lazyloaded', {}, false, true);
			delete image._lazybgsetLoading;
		}
	};

	addEventListener('lazybeforeunveil', function(e){
		var set, image, elem;

		if(e.defaultPrevented || !(set = e.target.getAttribute('data-bgset'))){return;}

		elem = e.target;
		image = document.createElement('img');

		image.alt = '';

		image._lazybgsetLoading = true;
		e.detail.firesLoad = true;

		createPicture(set, elem, image);

		setTimeout(function(){
			lazySizes.loader.unveil(image);

			lazySizes.rAF(function(){
				lazySizes.fire(image, '_lazyloaded', {}, true, true);
				if(image.complete) {
					proxyLoad({target: image});
				}
			});
		});

	});

	document.addEventListener('load', proxyLoad, true);

	window.addEventListener('lazybeforesizes', function(e){
		if(e.detail.instance != lazySizes){return;}
		if(e.target._lazybgset && e.detail.dataAttr){
			var elem = e.target._lazybgset;
			var bgSize = getBgSize(elem);

			if(allowedBackgroundSize[bgSize]){
				e.target._lazysizesParentFit = bgSize;

				lazySizes.rAF(function(){
					e.target.setAttribute('data-parent-fit', bgSize);
					if(e.target._lazysizesParentFit){
						delete e.target._lazysizesParentFit;
					}
				});
			}
		}
	}, true);

	document.documentElement.addEventListener('lazybeforesizes', function(e){
		if(e.defaultPrevented || !e.target._lazybgset || e.detail.instance != lazySizes){return;}
		e.detail.width = proxyWidth(e.target._lazybgset);
	});
}));

/*
This lazysizes plugin optimizes perceived performance by adding better support for rendering progressive JPGs/PNGs in conjunction with the LQIP pattern.
*/
(function(window, factory) {
	var globalInstall = function(){
		factory(window.lazySizes);
		window.removeEventListener('lazyunveilread', globalInstall, true);
	};

	factory = factory.bind(null, window, window.document);

	if(typeof module == 'object' && module.exports){
		factory(require('lazysizes'));
	} else if(window.lazySizes) {
		globalInstall();
	} else {
		window.addEventListener('lazyunveilread', globalInstall, true);
	}
}(window, function(window, document, lazySizes) {
	/*jshint eqnull:true */
	'use strict';
	var regImg, onLoad;

	if('srcset' in document.createElement('img')){
		regImg = /^img$/i;

		onLoad = function(e){
			e.target.style.backgroundSize = '';
			e.target.style.backgroundImage = '';
			e.target.removeEventListener(e.type, onLoad);
		};

		document.addEventListener('lazybeforeunveil', function(e){
			if(e.detail.instance != lazySizes){return;}

			var img = e.target;
			if(!regImg.test(img.nodeName)){
				return;
			}
			var src = img.getAttribute('src');
			if(src) {
				img.style.backgroundSize = '100% 100%';
				img.style.backgroundImage = 'url(' + src + ')';
				img.removeAttribute('src');
				img.addEventListener('load', onLoad);
			}
		}, false);
	}
}));

(function(window, factory) {
	var lazySizes = factory(window, window.document);
	window.lazySizes = lazySizes;
	if(typeof module == 'object' && module.exports){
		module.exports = lazySizes;
	}
}(window, function l(window, document) {
	'use strict';
	/*jshint eqnull:true */
	if(!document.getElementsByClassName){return;}

	var lazysizes, lazySizesConfig;

	var docElem = document.documentElement;

	var Date = window.Date;

	var supportPicture = window.HTMLPictureElement;

	var _addEventListener = 'addEventListener';

	var _getAttribute = 'getAttribute';

	var addEventListener = window[_addEventListener];

	var setTimeout = window.setTimeout;

	var requestAnimationFrame = window.requestAnimationFrame || setTimeout;

	var requestIdleCallback = window.requestIdleCallback;

	var regPicture = /^picture$/i;

	var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];

	var regClassCache = {};

	var forEach = Array.prototype.forEach;

	var hasClass = function(ele, cls) {
		if(!regClassCache[cls]){
			regClassCache[cls] = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		}
		return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
	};

	var addClass = function(ele, cls) {
		if (!hasClass(ele, cls)){
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
		}
	};

	var removeClass = function(ele, cls) {
		var reg;
		if ((reg = hasClass(ele,cls))) {
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
		}
	};

	var addRemoveLoadEvents = function(dom, fn, add){
		var action = add ? _addEventListener : 'removeEventListener';
		if(add){
			addRemoveLoadEvents(dom, fn);
		}
		loadEvents.forEach(function(evt){
			dom[action](evt, fn);
		});
	};

	var triggerEvent = function(elem, name, detail, noBubbles, noCancelable){
		var event = document.createEvent('CustomEvent');

		if(!detail){
			detail = {};
		}

		detail.instance = lazysizes;

		event.initCustomEvent(name, !noBubbles, !noCancelable, detail);

		elem.dispatchEvent(event);
		return event;
	};

	var updatePolyfill = function (el, full){
		var polyfill;
		if( !supportPicture && ( polyfill = (window.picturefill || lazySizesConfig.pf) ) ){
			polyfill({reevaluate: true, elements: [el]});
		} else if(full && full.src){
			el.src = full.src;
		}
	};

	var getCSS = function (elem, style){
		return (getComputedStyle(elem, null) || {})[style];
	};

	var getWidth = function(elem, parent, width){
		width = width || elem.offsetWidth;

		while(width < lazySizesConfig.minSize && parent && !elem._lazysizesWidth){
			width =  parent.offsetWidth;
			parent = parent.parentNode;
		}

		return width;
	};

	var rAF = (function(){
		var running, waiting;
		var firstFns = [];
		var secondFns = [];
		var fns = firstFns;

		var run = function(){
			var runFns = fns;

			fns = firstFns.length ? secondFns : firstFns;

			running = true;
			waiting = false;

			while(runFns.length){
				runFns.shift()();
			}

			running = false;
		};

		var rafBatch = function(fn, queue){
			if(running && !queue){
				fn.apply(this, arguments);
			} else {
				fns.push(fn);

				if(!waiting){
					waiting = true;
					(document.hidden ? setTimeout : requestAnimationFrame)(run);
				}
			}
		};

		rafBatch._lsFlush = run;

		return rafBatch;
	})();

	var rAFIt = function(fn, simple){
		return simple ?
			function() {
				rAF(fn);
			} :
			function(){
				var that = this;
				var args = arguments;
				rAF(function(){
					fn.apply(that, args);
				});
			}
		;
	};

	var throttle = function(fn){
		var running;
		var lastTime = 0;
		var gDelay = lazySizesConfig.throttleDelay;
		var rICTimeout = lazySizesConfig.ricTimeout;
		var run = function(){
			running = false;
			lastTime = Date.now();
			fn();
		};
		var idleCallback = requestIdleCallback && rICTimeout > 49 ?
			function(){
				requestIdleCallback(run, {timeout: rICTimeout});

				if(rICTimeout !== lazySizesConfig.ricTimeout){
					rICTimeout = lazySizesConfig.ricTimeout;
				}
			} :
			rAFIt(function(){
				setTimeout(run);
			}, true)
		;

		return function(isPriority){
			var delay;

			if((isPriority = isPriority === true)){
				rICTimeout = 33;
			}

			if(running){
				return;
			}

			running =  true;

			delay = gDelay - (Date.now() - lastTime);

			if(delay < 0){
				delay = 0;
			}

			if(isPriority || delay < 9){
				idleCallback();
			} else {
				setTimeout(idleCallback, delay);
			}
		};
	};

	//based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html
	var debounce = function(func) {
		var timeout, timestamp;
		var wait = 99;
		var run = function(){
			timeout = null;
			func();
		};
		var later = function() {
			var last = Date.now() - timestamp;

			if (last < wait) {
				setTimeout(later, wait - last);
			} else {
				(requestIdleCallback || run)(run);
			}
		};

		return function() {
			timestamp = Date.now();

			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
		};
	};

	(function(){
		var prop;

		var lazySizesDefaults = {
			lazyClass: 'lazyload',
			loadedClass: 'lazyloaded',
			loadingClass: 'lazyloading',
			preloadClass: 'lazypreload',
			errorClass: 'lazyerror',
			//strictClass: 'lazystrict',
			autosizesClass: 'lazyautosizes',
			srcAttr: 'data-src',
			srcsetAttr: 'data-srcset',
			sizesAttr: 'data-sizes',
			//preloadAfterLoad: false,
			minSize: 40,
			customMedia: {},
			init: true,
			expFactor: 1.5,
			hFac: 0.8,
			loadMode: 2,
			loadHidden: true,
			ricTimeout: 0,
			throttleDelay: 125,
		};

		lazySizesConfig = window.lazySizesConfig || window.lazysizesConfig || {};

		for(prop in lazySizesDefaults){
			if(!(prop in lazySizesConfig)){
				lazySizesConfig[prop] = lazySizesDefaults[prop];
			}
		}

		window.lazySizesConfig = lazySizesConfig;

		setTimeout(function(){
			if(lazySizesConfig.init){
				init();
			}
		});
	})();

	var loader = (function(){
		var preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;

		var eLvW, elvH, eLtop, eLleft, eLright, eLbottom;

		var defaultExpand, preloadExpand, hFac;

		var regImg = /^img$/i;
		var regIframe = /^iframe$/i;

		var supportScroll = ('onscroll' in window) && !(/glebot/.test(navigator.userAgent));

		var shrinkExpand = 0;
		var currentExpand = 0;

		var isLoading = 0;
		var lowRuns = -1;

		var resetPreloading = function(e){
			isLoading--;
			if(e && e.target){
				addRemoveLoadEvents(e.target, resetPreloading);
			}

			if(!e || isLoading < 0 || !e.target){
				isLoading = 0;
			}
		};

		var isNestedVisible = function(elem, elemExpand){
			var outerRect;
			var parent = elem;
			var visible = getCSS(document.body, 'visibility') == 'hidden' || getCSS(elem, 'visibility') != 'hidden';

			eLtop -= elemExpand;
			eLbottom += elemExpand;
			eLleft -= elemExpand;
			eLright += elemExpand;

			while(visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem){
				visible = ((getCSS(parent, 'opacity') || 1) > 0);

				if(visible && getCSS(parent, 'overflow') != 'visible'){
					outerRect = parent.getBoundingClientRect();
					visible = eLright > outerRect.left &&
						eLleft < outerRect.right &&
						eLbottom > outerRect.top - 1 &&
						eLtop < outerRect.bottom + 1
					;
				}
			}

			return visible;
		};

		var checkElements = function() {
			var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal, beforeExpandVal;

			var lazyloadElems = lazysizes.elements;

			if((loadMode = lazySizesConfig.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)){

				i = 0;

				lowRuns++;

				if(preloadExpand == null){
					if(!('expand' in lazySizesConfig)){
						lazySizesConfig.expand = docElem.clientHeight > 500 && docElem.clientWidth > 500 ? 500 : 370;
					}

					defaultExpand = lazySizesConfig.expand;
					preloadExpand = defaultExpand * lazySizesConfig.expFactor;
				}

				if(currentExpand < preloadExpand && isLoading < 1 && lowRuns > 2 && loadMode > 2 && !document.hidden){
					currentExpand = preloadExpand;
					lowRuns = 0;
				} else if(loadMode > 1 && lowRuns > 1 && isLoading < 6){
					currentExpand = defaultExpand;
				} else {
					currentExpand = shrinkExpand;
				}

				for(; i < eLlen; i++){

					if(!lazyloadElems[i] || lazyloadElems[i]._lazyRace){continue;}

					if(!supportScroll){unveilElement(lazyloadElems[i]);continue;}

					if(!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)){
						elemExpand = currentExpand;
					}

					if(beforeExpandVal !== elemExpand){
						eLvW = innerWidth + (elemExpand * hFac);
						elvH = innerHeight + elemExpand;
						elemNegativeExpand = elemExpand * -1;
						beforeExpandVal = elemExpand;
					}

					rect = lazyloadElems[i].getBoundingClientRect();

					if ((eLbottom = rect.bottom) >= elemNegativeExpand &&
						(eLtop = rect.top) <= elvH &&
						(eLright = rect.right) >= elemNegativeExpand * hFac &&
						(eLleft = rect.left) <= eLvW &&
						(eLbottom || eLright || eLleft || eLtop) &&
						(lazySizesConfig.loadHidden || getCSS(lazyloadElems[i], 'visibility') != 'hidden') &&
						((isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4)) || isNestedVisible(lazyloadElems[i], elemExpand))){
						unveilElement(lazyloadElems[i]);
						loadedSomething = true;
						if(isLoading > 9){break;}
					} else if(!loadedSomething && isCompleted && !autoLoadElem &&
						isLoading < 4 && lowRuns < 4 && loadMode > 2 &&
						(preloadElems[0] || lazySizesConfig.preloadAfterLoad) &&
						(preloadElems[0] || (!elemExpandVal && ((eLbottom || eLright || eLleft || eLtop) || lazyloadElems[i][_getAttribute](lazySizesConfig.sizesAttr) != 'auto')))){
						autoLoadElem = preloadElems[0] || lazyloadElems[i];
					}
				}

				if(autoLoadElem && !loadedSomething){
					unveilElement(autoLoadElem);
				}
			}
		};

		var throttledCheckElements = throttle(checkElements);

		var switchLoadingClass = function(e){
			addClass(e.target, lazySizesConfig.loadedClass);
			removeClass(e.target, lazySizesConfig.loadingClass);
			addRemoveLoadEvents(e.target, rafSwitchLoadingClass);
			triggerEvent(e.target, 'lazyloaded');
		};
		var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);
		var rafSwitchLoadingClass = function(e){
			rafedSwitchLoadingClass({target: e.target});
		};

		var changeIframeSrc = function(elem, src){
			try {
				elem.contentWindow.location.replace(src);
			} catch(e){
				elem.src = src;
			}
		};

		var handleSources = function(source){
			var customMedia;

			var sourceSrcset = source[_getAttribute](lazySizesConfig.srcsetAttr);

			if( (customMedia = lazySizesConfig.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) ){
				source.setAttribute('media', customMedia);
			}

			if(sourceSrcset){
				source.setAttribute('srcset', sourceSrcset);
			}
		};

		var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg){
			var src, srcset, parent, isPicture, event, firesLoad;

			if(!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented){

				if(sizes){
					if(isAuto){
						addClass(elem, lazySizesConfig.autosizesClass);
					} else {
						elem.setAttribute('sizes', sizes);
					}
				}

				srcset = elem[_getAttribute](lazySizesConfig.srcsetAttr);
				src = elem[_getAttribute](lazySizesConfig.srcAttr);

				if(isImg) {
					parent = elem.parentNode;
					isPicture = parent && regPicture.test(parent.nodeName || '');
				}

				firesLoad = detail.firesLoad || (('src' in elem) && (srcset || src || isPicture));

				event = {target: elem};

				if(firesLoad){
					addRemoveLoadEvents(elem, resetPreloading, true);
					clearTimeout(resetPreloadingTimer);
					resetPreloadingTimer = setTimeout(resetPreloading, 2500);

					addClass(elem, lazySizesConfig.loadingClass);
					addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
				}

				if(isPicture){
					forEach.call(parent.getElementsByTagName('source'), handleSources);
				}

				if(srcset){
					elem.setAttribute('srcset', srcset);
				} else if(src && !isPicture){
					if(regIframe.test(elem.nodeName)){
						changeIframeSrc(elem, src);
					} else {
						elem.src = src;
					}
				}

				if(isImg && (srcset || isPicture)){
					updatePolyfill(elem, {src: src});
				}
			}

			if(elem._lazyRace){
				delete elem._lazyRace;
			}
			removeClass(elem, lazySizesConfig.lazyClass);

			rAF(function(){
				if( !firesLoad || (elem.complete && elem.naturalWidth > 1)){
					if(firesLoad){
						resetPreloading(event);
					} else {
						isLoading--;
					}
					switchLoadingClass(event);
				}
			}, true);
		});

		var unveilElement = function (elem){
			var detail;

			var isImg = regImg.test(elem.nodeName);

			//allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")
			var sizes = isImg && (elem[_getAttribute](lazySizesConfig.sizesAttr) || elem[_getAttribute]('sizes'));
			var isAuto = sizes == 'auto';

			if( (isAuto || !isCompleted) && isImg && (elem[_getAttribute]('src') || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesConfig.errorClass) && hasClass(elem, lazySizesConfig.lazyClass)){return;}

			detail = triggerEvent(elem, 'lazyunveilread').detail;

			if(isAuto){
				 autoSizer.updateElem(elem, true, elem.offsetWidth);
			}

			elem._lazyRace = true;
			isLoading++;

			lazyUnveil(elem, detail, isAuto, sizes, isImg);
		};

		var onload = function(){
			if(isCompleted){return;}
			if(Date.now() - started < 999){
				setTimeout(onload, 999);
				return;
			}
			var afterScroll = debounce(function(){
				lazySizesConfig.loadMode = 3;
				throttledCheckElements();
			});

			isCompleted = true;

			lazySizesConfig.loadMode = 3;

			throttledCheckElements();

			addEventListener('scroll', function(){
				if(lazySizesConfig.loadMode == 3){
					lazySizesConfig.loadMode = 2;
				}
				afterScroll();
			}, true);
		};

		return {
			_: function(){
				started = Date.now();

				lazysizes.elements = document.getElementsByClassName(lazySizesConfig.lazyClass);
				preloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass + ' ' + lazySizesConfig.preloadClass);
				hFac = lazySizesConfig.hFac;

				addEventListener('scroll', throttledCheckElements, true);

				addEventListener('resize', throttledCheckElements, true);

				if(window.MutationObserver){
					new MutationObserver( throttledCheckElements ).observe( docElem, {childList: true, subtree: true, attributes: true} );
				} else {
					docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);
					docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);
					setInterval(throttledCheckElements, 999);
				}

				addEventListener('hashchange', throttledCheckElements, true);

				//, 'fullscreenchange'
				['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend', 'webkitAnimationEnd'].forEach(function(name){
					document[_addEventListener](name, throttledCheckElements, true);
				});

				if((/d$|^c/.test(document.readyState))){
					onload();
				} else {
					addEventListener('load', onload);
					document[_addEventListener]('DOMContentLoaded', throttledCheckElements);
					setTimeout(onload, 20000);
				}

				if(lazysizes.elements.length){
					checkElements();
					rAF._lsFlush();
				} else {
					throttledCheckElements();
				}
			},
			checkElems: throttledCheckElements,
			unveil: unveilElement
		};
	})();


	var autoSizer = (function(){
		var autosizesElems;

		var sizeElement = rAFIt(function(elem, parent, event, width){
			var sources, i, len;
			elem._lazysizesWidth = width;
			width += 'px';

			elem.setAttribute('sizes', width);

			if(regPicture.test(parent.nodeName || '')){
				sources = parent.getElementsByTagName('source');
				for(i = 0, len = sources.length; i < len; i++){
					sources[i].setAttribute('sizes', width);
				}
			}

			if(!event.detail.dataAttr){
				updatePolyfill(elem, event.detail);
			}
		});
		var getSizeElement = function (elem, dataAttr, width){
			var event;
			var parent = elem.parentNode;

			if(parent){
				width = getWidth(elem, parent, width);
				event = triggerEvent(elem, 'lazybeforesizes', {width: width, dataAttr: !!dataAttr});

				if(!event.defaultPrevented){
					width = event.detail.width;

					if(width && width !== elem._lazysizesWidth){
						sizeElement(elem, parent, event, width);
					}
				}
			}
		};

		var updateElementsSizes = function(){
			var i;
			var len = autosizesElems.length;
			if(len){
				i = 0;

				for(; i < len; i++){
					getSizeElement(autosizesElems[i]);
				}
			}
		};

		var debouncedUpdateElementsSizes = debounce(updateElementsSizes);

		return {
			_: function(){
				autosizesElems = document.getElementsByClassName(lazySizesConfig.autosizesClass);
				addEventListener('resize', debouncedUpdateElementsSizes);
			},
			checkElems: debouncedUpdateElementsSizes,
			updateElem: getSizeElement
		};
	})();

	var init = function(){
		if(!init.i){
			init.i = true;
			autoSizer._();
			loader._();
		}
	};

	lazysizes = {
		cfg: lazySizesConfig,
		autoSizer: autoSizer,
		loader: loader,
		init: init,
		uP: updatePolyfill,
		aC: addClass,
		rC: removeClass,
		hC: hasClass,
		fire: triggerEvent,
		gW: getWidth,
		rAF: rAF,
	};

	return lazysizes;
}
));

'use strict';

/*
 * 1. Check if the browser supports `position: sticky` natively or is too old to run the polyfill.
 *    If either of these is the case set `seppuku` flag. It will be checked later to disable key features
 *    of the polyfill, but the API will remain functional to avoid breaking things.
 */
let seppuku = false;

// The polyfill cant’t function properly without `getComputedStyle`.
if (!window.getComputedStyle) seppuku = true;
// Dont’t get in a way if the browser supports `position: sticky` natively.
else {
    const testNode = document.createElement('div');

    if (
        ['', '-webkit-', '-moz-', '-ms-'].some(prefix => {
            try {
                testNode.style.position = prefix + 'sticky';
            }
            catch(e) {}

            return testNode.style.position != '';
        })
    ) seppuku = true;
}


/*
 * 2. “Global” vars used across the polyfill
 */

// Check if Shadow Root constructor exists to make further checks simpler
const shadowRootExists = typeof ShadowRoot !== 'undefined';

// Last saved scroll position
const scroll = {
    top: null,
    left: null
};

// Array of created Sticky instances
const stickies = [];


/*
 * 3. Utility functions
 */
function extend (targetObj, sourceObject) {
    for (var key in sourceObject) {
        if (sourceObject.hasOwnProperty(key)) {
            targetObj[key] = sourceObject[key];
        }
    }
}

function parseNumeric (val) {
    return parseFloat(val) || 0;
}

function getDocOffsetTop (node) {
    let docOffsetTop = 0;

    while (node) {
        docOffsetTop += node.offsetTop;
        node = node.offsetParent;
    }

    return docOffsetTop;
}


/*
 * 4. Sticky class
 */
class Sticky {
    constructor (node) {
        if (!(node instanceof HTMLElement))
            throw new Error('First argument must be HTMLElement');
        if (stickies.some(sticky => sticky._node === node))
            throw new Error('Stickyfill is already applied to this node');

        this._node = node;
        this._stickyMode = null;
        this._active = false;

        stickies.push(this);

        this.refresh();
    }

    refresh () {
        if (seppuku || this._removed) return;
        if (this._active) this._deactivate();

        const node = this._node;

        /*
         * 1. Save node computed props
         */
        const nodeComputedStyle = getComputedStyle(node);
        const nodeComputedProps = {
            top: nodeComputedStyle.top,
            display: nodeComputedStyle.display,
            marginTop: nodeComputedStyle.marginTop,
            marginBottom: nodeComputedStyle.marginBottom,
            marginLeft: nodeComputedStyle.marginLeft,
            marginRight: nodeComputedStyle.marginRight,
            cssFloat: nodeComputedStyle.cssFloat
        };

        /*
         * 2. Check if the node can be activated
         */
        if (
            isNaN(parseFloat(nodeComputedProps.top)) ||
            nodeComputedProps.display == 'table-cell' ||
            nodeComputedProps.display == 'none'
        ) return;

        this._active = true;

        /*
         * 3. Get necessary node parameters
         */
        const referenceNode = node.parentNode;
        const parentNode = shadowRootExists && referenceNode instanceof ShadowRoot? referenceNode.host: referenceNode;
        const nodeWinOffset = node.getBoundingClientRect();
        const parentWinOffset = parentNode.getBoundingClientRect();
        const parentComputedStyle = getComputedStyle(parentNode);

        this._parent = {
            node: parentNode,
            styles: {
                position: parentNode.style.position
            },
            offsetHeight: parentNode.offsetHeight
        };
        this._offsetToWindow = {
            left: nodeWinOffset.left,
            right: document.documentElement.clientWidth - nodeWinOffset.right
        };
        this._offsetToParent = {
            top: nodeWinOffset.top - parentWinOffset.top - parseNumeric(parentComputedStyle.borderTopWidth),
            left: nodeWinOffset.left - parentWinOffset.left - parseNumeric(parentComputedStyle.borderLeftWidth),
            right: -nodeWinOffset.right + parentWinOffset.right - parseNumeric(parentComputedStyle.borderRightWidth)
        };
        this._styles = {
            position: node.style.position,
            top: node.style.top,
            bottom: node.style.bottom,
            left: node.style.left,
            right: node.style.right,
            width: node.style.width,
            marginTop: node.style.marginTop,
            marginLeft: node.style.marginLeft,
            marginRight: node.style.marginRight
        };

        const nodeTopValue = parseNumeric(nodeComputedProps.top);
        this._limits = {
            start: nodeWinOffset.top + window.pageYOffset - nodeTopValue,
            end: parentWinOffset.top + window.pageYOffset + parentNode.offsetHeight -
                parseNumeric(parentComputedStyle.borderBottomWidth) - node.offsetHeight -
                nodeTopValue - parseNumeric(nodeComputedProps.marginBottom)
        };

        /*
         * 4. Ensure that the node will be positioned relatively to the parent node
         */
        const parentPosition = parentComputedStyle.position;

        if (
            parentPosition != 'absolute' &&
            parentPosition != 'relative'
        ) {
            parentNode.style.position = 'relative';
        }

        /*
         * 5. Recalc node position.
         *    It’s important to do this before clone injection to avoid scrolling bug in Chrome.
         */
        this._recalcPosition();

        /*
         * 6. Create a clone
         */
        const clone = this._clone = {};
        clone.node = document.createElement('div');

        // Apply styles to the clone
        extend(clone.node.style, {
            width: nodeWinOffset.right - nodeWinOffset.left + 'px',
            height: nodeWinOffset.bottom - nodeWinOffset.top + 'px',
            marginTop: nodeComputedProps.marginTop,
            marginBottom: nodeComputedProps.marginBottom,
            marginLeft: nodeComputedProps.marginLeft,
            marginRight: nodeComputedProps.marginRight,
            cssFloat: nodeComputedProps.cssFloat,
            padding: 0,
            border: 0,
            borderSpacing: 0,
            fontSize: '1em',
            position: 'static'
        });

        referenceNode.insertBefore(clone.node, node);
        clone.docOffsetTop = getDocOffsetTop(clone.node);
    }

    _recalcPosition () {
        if (!this._active || this._removed) return;

        const stickyMode = scroll.top <= this._limits.start? 'start': scroll.top >= this._limits.end? 'end': 'middle';

        if (this._stickyMode == stickyMode) return;

        switch (stickyMode) {
            case 'start':
                extend(this._node.style, {
                    position: 'absolute',
                    left: this._offsetToParent.left + 'px',
                    right: this._offsetToParent.right + 'px',
                    top: this._offsetToParent.top + 'px',
                    bottom: 'auto',
                    width: 'auto',
                    marginLeft: 0,
                    marginRight: 0,
                    marginTop: 0
                });
                break;

            case 'middle':
                extend(this._node.style, {
                    position: 'fixed',
                    left: this._offsetToWindow.left + 'px',
                    right: this._offsetToWindow.right + 'px',
                    top: this._styles.top,
                    bottom: 'auto',
                    width: 'auto',
                    marginLeft: 0,
                    marginRight: 0,
                    marginTop: 0
                });
                break;

            case 'end':
                extend(this._node.style, {
                    position: 'absolute',
                    left: this._offsetToParent.left + 'px',
                    right: this._offsetToParent.right + 'px',
                    top: 'auto',
                    bottom: 0,
                    width: 'auto',
                    marginLeft: 0,
                    marginRight: 0
                });
                break;
        }

        this._stickyMode = stickyMode;
    }

    _fastCheck () {
        if (!this._active || this._removed) return;

        if (
            Math.abs(getDocOffsetTop(this._clone.node) - this._clone.docOffsetTop) > 1 ||
            Math.abs(this._parent.node.offsetHeight - this._parent.offsetHeight) > 1
        ) this.refresh();
    }

    _deactivate () {
        if (!this._active || this._removed) return;

        this._clone.node.parentNode.removeChild(this._clone.node);
        delete this._clone;

        extend(this._node.style, this._styles);
        delete this._styles;

        // Check whether element’s parent node is used by other stickies.
        // If not, restore parent node’s styles.
        if (!stickies.some(sticky => sticky !== this && sticky._parent && sticky._parent.node === this._parent.node)) {
            extend(this._parent.node.style, this._parent.styles);
        }
        delete this._parent;

        this._stickyMode = null;
        this._active = false;

        delete this._offsetToWindow;
        delete this._offsetToParent;
        delete this._limits;
    }

    remove () {
        this._deactivate();

        stickies.some((sticky, index) => {
            if (sticky._node === this._node) {
                stickies.splice(index, 1);
                return true;
            }
        });

        this._removed = true;
    }
}


/*
 * 5. Stickyfill API
 */
const Stickyfill = {
    stickies,
    Sticky,

    addOne (node) {
        // Check whether it’s a node
        if (!(node instanceof HTMLElement)) {
            // Maybe it’s a node list of some sort?
            // Take first node from the list then
            if (node.length && node[0]) node = node[0];
            else return;
        }

        // Check if Stickyfill is already applied to the node
        // and return existing sticky
        for (var i = 0; i < stickies.length; i++) {
            if (stickies[i]._node === node) return stickies[i];
        }

        // Create and return new sticky
        return new Sticky(node);
    },

    add (nodeList) {
        // If it’s a node make an array of one node
        if (nodeList instanceof HTMLElement) nodeList = [nodeList];
        // Check if the argument is an iterable of some sort
        if (!nodeList.length) return;

        // Add every element as a sticky and return an array of created Sticky instances
        const addedStickies = [];

        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];

            // If it’s not an HTMLElement – create an empty element to preserve 1-to-1
            // correlation with input list
            if (!(node instanceof HTMLElement)) {
                addedStickies.push(void 0);
                continue;
            }

            // If Stickyfill is already applied to the node
            // add existing sticky
            if (stickies.some(sticky => {
                if (sticky._node === node) {
                    addedStickies.push(sticky);
                    return true;
                }
            })) continue;

            // Create and add new sticky
            addedStickies.push(new Sticky(node));
        }

        return addedStickies;
    },

    refreshAll () {
        stickies.forEach(sticky => sticky.refresh());
    },

    removeOne (node) {
        // Check whether it’s a node
        if (!(node instanceof HTMLElement)) {
            // Maybe it’s a node list of some sort?
            // Take first node from the list then
            if (node.length && node[0]) node = node[0];
            else return;
        }

        // Remove the stickies bound to the nodes in the list
        stickies.some(sticky => {
            if (sticky._node === node) {
                sticky.remove();
                return true;
            }
        });
    },

    remove (nodeList) {
        // If it’s a node make an array of one node
        if (nodeList instanceof HTMLElement) nodeList = [nodeList];
        // Check if the argument is an iterable of some sort
        if (!nodeList.length) return;

        // Remove the stickies bound to the nodes in the list
        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];

            stickies.some(sticky => {
                if (sticky._node === node) {
                    sticky.remove();
                    return true;
                }
            });
        }
    },

    removeAll () {
        while (stickies.length) stickies[0].remove();
    }
};


/*
 * 6. Setup events (unless the polyfill was disabled)
 */
function init () {
    // Watch for scroll position changes and trigger recalc/refresh if needed
    function checkScroll () {
        if (window.pageXOffset != scroll.left) {
            scroll.top = window.pageYOffset;
            scroll.left = window.pageXOffset;

            Stickyfill.refreshAll();
        }
        else if (window.pageYOffset != scroll.top) {
            scroll.top = window.pageYOffset;
            scroll.left = window.pageXOffset;

            // recalc position for all stickies
            stickies.forEach(sticky => sticky._recalcPosition());
        }
    }

    checkScroll();
    window.addEventListener('scroll', checkScroll);

    // Watch for window resizes and device orientation changes and trigger refresh
    window.addEventListener('resize', Stickyfill.refreshAll);
    window.addEventListener('orientationchange', Stickyfill.refreshAll);

    //Fast dirty check for layout changes every 500ms
    let fastCheckTimer;

    function startFastCheckTimer () {
        fastCheckTimer = setInterval(function () {
            stickies.forEach(sticky => sticky._fastCheck());
        }, 500);
    }

    function stopFastCheckTimer () {
        clearInterval(fastCheckTimer);
    }

    let docHiddenKey;
    let visibilityChangeEventName;

    if ('hidden' in document) {
        docHiddenKey = 'hidden';
        visibilityChangeEventName = 'visibilitychange';
    }
    else if ('webkitHidden' in document) {
        docHiddenKey = 'webkitHidden';
        visibilityChangeEventName = 'webkitvisibilitychange';
    }

    if (visibilityChangeEventName) {
        if (!document[docHiddenKey]) startFastCheckTimer();

        document.addEventListener(visibilityChangeEventName, () => {
            if (document[docHiddenKey]) {
                stopFastCheckTimer();
            }
            else {
                startFastCheckTimer();
            }
        });
    }
    else startFastCheckTimer();
}

if (!seppuku) init();


/*
 * 7. Expose Stickyfill
 */
if (typeof module != 'undefined' && module.exports) {
    module.exports = Stickyfill;
}
else {
    window.Stickyfill = Stickyfill;
}
