class_name SfxPlayer
extends Node
## 音效服务：启动时从网络下载 WAV → 缓存到 user:// → 内存播放
## 策略：资源不打包进游戏（res://），运行期按需拉取；满足"音效从网络下载"
## base URL：
##   - Web 版：同源（/audio/ 由托管服务器提供）
##   - 桌面/内网测试：ProjectSettings sfx/base_url 或默认 http://127.0.0.1:8080/audio/

const SETTINGS_KEY: String = "sfx/base_url"

var _players: Array[AudioStreamPlayer] = []
var _cache: Dictionary = {}        # name -> AudioStreamWAV
var _loading: Dictionary = {}      # name -> true（正在拉）
var _pending: Dictionary = {}      # name -> Array[Callable]（拉完回调）
var _max_players: int = 10
var _poll_timer: float = 0.0
var _started_download: bool = false
var _enabled: bool = true


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in range(_max_players):
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_players.append(p)
	download_manifest()


func base_url() -> String:
	# Web 版：同源 origin（H5 由内网服务器托管，音效同域可下）
	if OS.has_feature("web"):
		var origin: String = _web_origin()
		if origin != "":
			return origin + "/audio"
	# 桌面/其它：ProjectSettings 配置（内网测试默认 127.0.0.1:8080）
	var custom: String = ProjectSettings.get_setting(SETTINGS_KEY, "")
	return (custom if custom != "" else "http://127.0.0.1:8080/audio").trim_suffix("/")


func _web_origin() -> String:
	if not OS.has_feature("web"):
		return ""
	# JavaScriptBridge 读 location.origin
	if Engine.has_singleton("JavaScriptBridge"):
		var js: JavaScriptBridge = Engine.get_singleton("JavaScriptBridge")
		if js != null and js.is_available():
			return String(js.eval("window.location.origin"))
	return ""


## 需要播放的音效清单（文件名 = audio/sfx_*.wav）
const MANIFEST: Array[String] = [
	"sfx_ui_click", "sfx_ui_hover", "sfx_ui_confirm",
	"sfx_launch", "sfx_bounce", "sfx_fire_hit", "sfx_fire_out",
	"sfx_rescue_grab", "sfx_rescue_save", "sfx_coin",
	"sfx_item_pos", "sfx_item_neg", "sfx_life_lose", "sfx_level_clear",
]


func download_manifest() -> void:
	if _started_download:
		return
	_started_download = true
	for name: String in MANIFEST:
		_fetch(name)


func _fetch(name: String) -> void:
	if _cache.has(name):
		return
	if _loading.has(name):
		return
	_loading[name] = true
	var http := HTTPRequest.new()
	add_child(http)
	http.timeout = 10.0
	var url: String = "%s/%s.wav" % [base_url(), name]
	http.request_completed.connect(
		func(result: int, _code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
			http.queue_free()
			if result == HTTPRequest.RESULT_SUCCESS and body.size() > 44:
				var wav := AudioStreamWAV.new()
				wav.format = AudioStreamWAV.FORMAT_16_BITS
				wav.mix_rate = _wav_rate(body)
				wav.stereo = _wav_stereo(body)
				wav.data = _wav_pcm(body)
				_cache[name] = wav
				_loading.erase(name)
				_flush_pending(name)
			else:
				_loading.erase(name)
				print("[SfxPlayer] 下载失败: %s (result=%d)" % [name, result])
	)
	http.request(url)


## 简易 WAV 头解析（44 字节标准头 / 可能带 extra）
func _wav_rate(b: PackedByteArray) -> int:
	var off := 12
	# 找 "fmt "
	for i in range(12, mini(b.size() - 8, 80)):
		if b[i] == 0x66 and b[i + 1] == 0x6d and b[i + 2] == 0x74 and b[i + 3] == 0x20:
			off = i
			break
	if off + 24 <= b.size():
		return b.decode_u32(off + 12)  # dwSampleRate
	return 44100


func _wav_stereo(b: PackedByteArray) -> bool:
	# 通道数：在 fmt 块
	for i in range(12, mini(b.size() - 8, 80)):
		if b[i] == 0x66 and b[i + 1] == 0x6d and b[i + 2] == 0x74 and b[i + 3] == 0x20:
			if i + 16 <= b.size():
				return b.decode_u16(i + 10) == 2
			break
	return false


func _wav_pcm(b: PackedByteArray) -> PackedByteArray:
	# 定位 data 块后的 PCM
	for i in range(12, mini(b.size() - 8, b.size())):
		if b[i] == 0x64 and b[i + 1] == 0x61 and b[i + 2] == 0x74 and b[i + 3] == 0x61:
			var sz: int = b.decode_u32(i + 4)
			var start: int = i + 8
			return b.slice(start, mini(b.size(), start + sz))
	return b


func play(name: String, volume_db: float = 0.0, pitch: float = 1.0) -> void:
	if not _enabled:
		return
	var stream: AudioStreamWAV = _cache.get(name, null)
	if stream != null:
		_play_stream(stream, volume_db, pitch)
		return
	if not _loading.has(name):
		_fetch(name)
	# 排队等下载完成后补播
	if not _pending.has(name):
		_pending[name] = []
	(_pending[name] as Array).append(
		func() -> void: _play_stream(_cache.get(name, null), volume_db, pitch)
	)


func _flush_pending(name: String) -> void:
	if _pending.has(name):
		var arr: Array = _pending[name]
		_pending.erase(name)
		for cb: Callable in arr:
			cb.call()


func _play_stream(stream: AudioStreamWAV, volume_db: float, pitch: float) -> void:
	if stream == null:
		return
	for p in _players:
		if not p.playing:
			p.stream = stream
			p.volume_db = volume_db
			p.pitch_scale = pitch
			p.play()
			return
	# 全忙：复用最早释放的（第一个非活跃策略上一条已覆盖；此处轮转第一个）
	var p0: AudioStreamPlayer = _players[0]
	p0.stream = stream
	p0.volume_db = volume_db
	p0.pitch_scale = pitch
	p0.play()
