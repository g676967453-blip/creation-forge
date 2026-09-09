extends Node
func _ready() -> void:
	_run()

func _timeout_quit() -> void:
	print("== sfx smoke TIMEOUT ==")
	get_tree().quit(2)

func _run() -> void:
	var guard := Timer.new()
	guard.one_shot = true
	guard.wait_time = 15.0
	guard.timeout.connect(_timeout_quit)
	add_child(guard)
	guard.start()

	await get_tree().create_timer(1.0).timeout
	await get_tree().process_frame
	var cached: int = Sfx._cache.size()
	var names: Array = []
	for k in Sfx._cache.keys():
		names.append(str(k))
	print("== sfx cache size=", cached, " ==")
	for n in names:
		print("[cached] ", n)
	# 触发一个已知音效并检查不崩溃
	Sfx.play("sfx_ui_click")
	Sfx.play("sfx_level_clear")
	await get_tree().create_timer(0.3).timeout
	var ok: bool = cached >= 12
	print("== sfx smoke: ", "PASS" if ok else "FAIL", " ==")
	get_tree().quit(0 if ok else 1)
