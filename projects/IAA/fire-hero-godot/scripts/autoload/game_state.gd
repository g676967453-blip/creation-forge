extends Node
## 全局进度与会话状态（跨场景）

signal coins_changed(value: int)
signal lives_changed(value: int)
signal score_changed(value: int)
signal level_changed(value: int)

const SAVE_PATH: String = "user://fire_hero_save.json"

var level: int = 1
var score: int = 0
var coins: int = 0
var lives: int = 3
var best: int = 0
var power_level: int = 0
var revive_used: bool = false
var skin_index: int = 0
var owned_skins: Array = [0, 1]


func _ready() -> void:
	load_save()


func reset_run() -> void:
	level = 1
	score = 0
	lives = 3
	power_level = 0
	revive_used = false
	_emit_all()


func add_score(amount: int) -> void:
	if amount == 0:
		return
	score += amount
	if score > best:
		best = score
	score_changed.emit(score)


func add_coins(amount: int) -> void:
	if amount == 0:
		return
	coins = maxi(0, coins + amount)
	coins_changed.emit(coins)


func set_lives(value: int) -> void:
	lives = maxi(0, value)
	lives_changed.emit(lives)


func lose_life() -> void:
	lives = maxi(0, lives - 1)
	lives_changed.emit(lives)


func next_level() -> void:
	level += 1
	revive_used = false
	level_changed.emit(level)


func _emit_all() -> void:
	score_changed.emit(score)
	coins_changed.emit(coins)
	lives_changed.emit(lives)
	level_changed.emit(level)


func save() -> void:
	var data: Dictionary = {
		"best": best,
		"coins": coins,
		"skin_index": skin_index,
		"owned_skins": owned_skins,
	}
	var f: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(data))


func load_save() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not f:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	var data: Dictionary = parsed
	best = int(data.get("best", 0))
	coins = int(data.get("coins", 0))
	skin_index = int(data.get("skin_index", 0))
	var owned: Variant = data.get("owned_skins", [0, 1])
	if typeof(owned) == TYPE_ARRAY:
		owned_skins = owned as Array
