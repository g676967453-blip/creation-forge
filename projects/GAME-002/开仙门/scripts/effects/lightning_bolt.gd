extends Node2D

const FRAME_H: float = 512.0

@export var bolt_stretch: float = 1.0
@export var bolt_origin: float = 0.5
@export var scale_factor: float = 0.5

@onready var bolt_anim: AnimatedSprite2D = $BoltAnim
@onready var impact: AnimatedSprite2D = $Impact


func _ready() -> void:
	visible = false


func strike(from: Vector2, to: Vector2) -> void:
	var dir := to - from
	var dist := dir.length()
	if dist <= 0.0:
		queue_free()
		return

	global_position = from

	bolt_anim.position = dir.normalized() * (dist * bolt_origin)
	bolt_anim.rotation = dir.angle() + PI / 2.0
	# X controls width; Y must keep matching the hit distance or the ends will appear disconnected.
	bolt_anim.scale = Vector2(bolt_stretch * scale_factor, dist / FRAME_H)
	bolt_anim.modulate.a = 1.0
	bolt_anim.visible = true
	bolt_anim.play("default")

	impact.position = dir
	impact.scale = Vector2(0.2, 0.2)
	impact.modulate.a = 1.0
	impact.visible = true
	impact.play("default")

	visible = true

	var tween := create_tween().set_parallel()
	tween.tween_property(impact, "scale", Vector2(0.6, 0.6), 0.1)
	tween.tween_property(bolt_anim, "modulate:a", 0.0, 0.12).set_delay(0.2)
	tween.tween_property(impact, "modulate:a", 0.0, 0.15).set_delay(0.18)

	var end_tween := create_tween()
	end_tween.tween_callback(queue_free).set_delay(0.4)
