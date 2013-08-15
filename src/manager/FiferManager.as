package manager
{
	import flash.events.Event;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.net.URLRequest;
	
	import javascript.FiferInterface;
	
	public class FiferManager
	{
		private static var _instance : FiferManager;
		private var _files : Object = {};
		private var _playing : Object = {};
		private var _muted : Boolean = false;
		
		public function FiferManager(se : SingletonEnforcer)
		{
			if (se == null)
			{
				throw new Error("[FiferManager] FiferManager is a Singleton. Please retrieve the instance with FiferManager.sharedManager.");
			}
		}
		
		public static function get sharedManager() : FiferManager {
			if (_instance == null) {
				_instance = new FiferManager(new SingletonEnforcer());
			}
			return _instance;
		}
		
		public function registerAudio($name : String, $src : String, $callback : Function) : FiferManager
		{
			var _name : String = $name;
			var _sound : Sound = new Sound();
			
			_sound.load(new URLRequest($src));
			_sound.addEventListener(Event.COMPLETE, registerComplete);
			
			_files[_name] = { s : _sound, st : new SoundTransform() };
			
			function registerComplete(e : Event) : void {
				$callback(_name);
			}
			
			return _instance;
		}
		
		public function play($name : String, $loop : Boolean = false) : FiferManager
		{
			var s : Sound = _files[$name].s;
			_playing[$name] = s.play(0, ($loop) ? int.MAX_VALUE : 0, _files[$name].st);
			_playing[$name].addEventListener(Event.SOUND_COMPLETE, function(e : Event) : void {
				e.currentTarget.removeEventListener(Event.SOUND_COMPLETE, arguments.callee);
				FiferInterface.call(FiferInterface.RS_COMPLETED, $name);
				stop($name);
			});
			return _instance;
		}
		
		public function stop($name : String) : FiferManager
		{
			var sc : SoundChannel = _playing[$name];
			sc.stop();
			delete _playing[$name];
			return _instance;
		}
		
		public function stopAll() : FiferManager
		{
			for (var s : String in _playing) {
				var sc : SoundChannel = _playing[s];
				sc.stop();
				delete _playing[s];
			}
			return _instance;
		}
		
		public function mute($name : String) : FiferManager
		{
			if (_playing.hasOwnProperty($name)) {
				var sc : SoundChannel = _playing[$name];
				sc.soundTransform = new SoundTransform(0);
			}
			if (_files.hasOwnProperty($name)) {
				var st : SoundTransform = _files[$name].st;
				st.volume = 0;
			}
			return _instance;
		}
		
		public function muteAll() : FiferManager
		{
			for (var p : String in _playing) {
				var sc : SoundChannel = _playing[p];
				sc.soundTransform = new SoundTransform(0);
			}
			
			for (var s : String in _files) {
				var st : SoundTransform = _files[s].st;
				st.volume = 0;
			}
			
			_muted = true;
			return _instance;
		}
		
		public function unmute($name : String) : FiferManager
		{
			if (_playing.hasOwnProperty($name)) {
				var sc : SoundChannel = _playing[$name];
				sc.soundTransform = new SoundTransform(1);
			}
			if (_files.hasOwnProperty($name)) {
				var st : SoundTransform = _files[$name].st;
				st.volume = 1;
			}
			return _instance;
		}
		
		public function unmuteAll() : FiferManager
		{
			for (var p : String in _playing) {
				var sc : SoundChannel = _playing[p];
				sc.soundTransform = new SoundTransform(1);
			}
			
			for (var s : String in _files) {
				var st : SoundTransform = _files[s].st;
				st.volume = 1;
			}
			
			_muted = false;
			return _instance;
		}
		
		public function get muted() : Boolean
		{
			return _muted;
		}
	}
}


class SingletonEnforcer {
	
}