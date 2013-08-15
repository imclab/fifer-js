(function(w,d) {

	var _ = {},
		_files = {},
		_playing = {},
		_muted = false,
		_initialised = true,
		_queue = [],
		_loaded = function() {},
		_settings = {
			flash : '../lib/fifer.fallback.swf'
		},
		_scope, _internals;

	_.support = (function() {
		return 'Audio' in window;
	})();

	_.extend = function(o,e)
	{
		for (var p in e) {
			o[p] = (o.hasOwnProperty(p)) ? o[p] : e[p];
		}
		return o;
	};

	_.fallback = function() {

		var html = '<!--[if IE]>';
		html += '<object id="fifer-flash" data="' + _settings.flash + '" type="application/x-shockwave-flash" width="0" height="0">';
		html += ' <param name="movie" value="' + _settings.flash + '"/>';
		html += ' <param name="allowscriptaccess" value="always"/>';
		html += ' <param name="quality" value="high"/>';
		html += ' <param name="wmode" value="transparent"/>';
		html += ' <!-- Black -->';
		html += ' </object>';
		html += '<![endif]--><![if !IE]>';
		html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"';
		html += ' codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" width="0" height="0"';
		html += ' align="middle">';
		html += '<param name="movie" value="' + _settings.flash + '" />';
		html += '<param name="quality" value="high" />';
		html += '<param name="allowScriptAccess" value="always"/>';
		html += '<embed src="' + _settings.flash + '"';
		html += ' allowScriptAccess="always" quality="high" bgcolor="#ffffff" width="0" height="0"';
		html += ' name="fifer-flash" align="middle" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />';
		html += '</object>';
		html += '<![endif]>';

		var p = d.createElement('p');
		d.getElementsByTagName('body')[0].appendChild(p);
		p.innerHTML = html;

		return d.getElementById('fifer-flash');
	};

	_internals = {
		registerAudio : function($name, $src) {
			var a = new Audio();
			a.addEventListener('canplaythrough', function() {
				_internals.loaded($name);
			});
			a.preload = 'metadata';
			if (a.canPlayType('audio/mpeg') === '') {
				console.warn('[Fifer] Looks like you\'re trying this in Firefox, trying to find an .ogg file.');
				$src = $src.split('.mp3').join('.ogg');
				_files[$name].src = $src;
			}
			a.src = $src;
			a.load();
		},
		playAudio : function($name) {
			var id = $name + Math.random() * new Date().getTime();
			var a = new Audio();
			a.addEventListener('ended', function() {
				_internals.ended(id, $name);
			});
			a.src = _files[$name].src;
			a.load();
			_files[$name].playing = _files[$name].playing || [];
			_files[$name].playing.push(id);
			if (_files[$name].muted) {
				a.volume = 0;
			}
			_playing[id] = a;
			_playing[id].play();
		},
		stopAudio : function($name) {
			while (_files[$name].playing.length) {
				var p = _files[$name].playing.shift();
				_playing[p].pause();
				_playing[p].currentTime = 0;
				delete _playing[p];
			}
		},
		stopAll : function() {
			for (var a in _playing) {
				_playing[a].pause();
				_playing[a].currentTime = 0;
			}
			_playing = {};
		},
		mute : function($name) {
			if (_files[$name].playing.length) {
				for (var i = 0, j = _files[$name].playing.length; i < j; i++) {
					var p = _files[$name].playing[i];
					_playing[p].volume = 0;
				}
			}

			if ($name in _files) {
				_files[$name].muted = true;
			}
		},
		unmute : function($name) {
			if (_files[$name].playing.length) {
				for (var i = 0, j = _files[$name].playing.length; i < j; i++) {
					var p = _files[$name].playing[i];
					_playing[p].volume = 0;
				}
			}

			if ($name in _files) {
				_files[$name].muted = false;
			}
		},
		muteAll : function() {
			for (var p in _playing) {
				_playing[p].volume = 0;
			}

			for (var f in _files) {
				_files[f].muted = true;
			}
			_muted = true;
		},
		unmuteAll : function() {
			for (var p in _playing) {
				_playing[p].volume = 1;
			}

			for (var f in _files) {
				_files[f].muted = false;
			}
			_muted = false;
		},
		muted : function() {
			return _muted;
		},
		loaded : function($name) {
			_files[$name].loaded = true;
			for (var f in _files) {
				if (!_files[f].loaded) return;
			}
			var fn = {};
			fn[$name] = function() {
				fF.play($name);
				return fF;
			};
			fF = _.extend(fF, fn);
			_loaded.call(fF, _files);
		},
		ended : function($id,$name) {
			if ($id in _playing) {
				_files[$name].playing.shift();
				delete _playing[$id];
			}
		},
		clearPlaying : function($name) {
			if (!_.support) {
				if (typeof $name === 'undefined') {
					for (var f in _files) {
						_files[f].playing = [];
					}
				} else {
					_files[$name].playing = [];
				}
			}
		}
	};

	var fF = {};

	fF.settings = function(obj) {
		_settings = _.extend(obj, _settings);
		return fF;
	};

	fF.registerAudio = function($name, $src, $multiple) {
		if (!_initialised) {
			_queue.push(['registerAudio', $name, $src, $multiple]);
			return fF;
		}
		_files[$name] = { src : $src, loaded : false, multiple : ($multiple || false), playing : [] };
		_scope.registerAudio($name, $src);
		return fF;
	};

	fF.play = function($name) {
		console.log($name);
		if (_files[$name].playing.length && !_files[$name].multiple) {
			console.warn('[Fifer] Audio: ' + $name + ' is already playing.');
			return fF;
		}
		if (!_files[$name].loaded) return;
		if (!($name in _files)) {
			console.warn('[Fifer] No audio registered with the name: ' + $name);
			return;
		}
		var p = _scope.playAudio($name);
		if (p) {
			_files[$name].playing = p.split(',');
		}
		return fF;
	};

	fF.stop = function($name) {
		if (typeof $name === 'undefined') {
			_internals.clearPlaying();
			_scope.stopAll();
		} else {
			if (!($name in _files)) {
				console.warn('[Fifer] No audio registered with the name: ' + $name);
				return fF;
			}
			if (!_files[$name].playing.length) {
				console.warn('[Fifer] The audio: ' + $name + ' is not currently playing.');
				return fF;
			}
			_internals.clearPlaying($name);
			_scope.stopAudio($name);
		}
		return fF;
	};

	fF.stopAll = function() {
		_internals.clearPlaying();
		_scope.stopAll();
		return fF;
	};

	fF.mute = function($name) {
		if (typeof $name === 'undefined') {
			_scope.muteAll();
		} else {
			if (!($name in _files)) {
				console.warn('[Fifer] No audio registered with the name: ' + $name);
				return;
			}
			_scope.mute($name);
		}
		return fF;
	};

	fF.unmute = function($name) {
		if (typeof $name === 'undefined') {
			_scope.unmuteAll();
		} else {
			if (!($name in _files)) {
				console.warn('[Fifer] No audio registered with the name: ' + $name);
				return;
			}
			_scope.unmute($name);
		}
		return fF;
	};

	fF.muteAll = function() {
		_scope.muteAll();
		return fF;
	};

	fF.unmuteAll = function() {
		_scope.unmuteAll();
		return fF;
	};

	fF.muted = function() {
		return _scope.muted();
	};

	fF.loaded = function(fn) {
		_loaded = fn;
		return fF;
	};

	w.Fifer = fF;

	if (!_.support) {
		_initialised = false;
		fF.interface = {
			responseInitialised : function() {
				console.warn('[Fifer] Fifer is using a Flash Fallback as HTML5 Audio is not supported.');
				_initialised = true;
				while (_queue.length) {
					var q = _queue.shift();
					var m = q.shift();
					fF[m].apply(fF, q);
				}
			},
			responseLoaded : function($name) {
				_internals.loaded($name);
			},
			responseCompleted : function($name) {
				_internals.ended($name);
			}
		};
		_scope = _.fallback();
	} else {
		_scope = _internals;
	}

})(window,document);