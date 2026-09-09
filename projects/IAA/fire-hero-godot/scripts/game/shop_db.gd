class_name ShopDB
extends RefCounted
## 补给队商店数据：商品生成 + 定价 + 道具描述（对齐微创新需求规格 §3.2/§3.3 与 HTML 原型）

## 道具（商品位可售）：key 与 GameItem.Kind 语义对应
## kind 目标：下关开局生效用（game_root._apply_pending_buffs 消费）
const ITEM_DEFS: Dictionary = {
	"wide": {"name": "长条", "desc": "蹦床加长 8 秒", "price": 100, "icon": "W"},
	"extinguish": {"name": "灭火器", "desc": "下关蹦床首次着火自动扑灭", "price": 120, "icon": "E"},
	"up": {"name": "1UP", "desc": "灭火等级 +1（下关生效）", "price": 200, "icon": "+"},
	"boost": {"name": "限时增益", "desc": "穿透无敌 8 秒（下关）", "price": 150, "icon": "B"},
	"bag": {"name": "钱袋", "desc": "即时 +80 分 +8 金币", "price": 80, "icon": "$"},
}
const ITEM_POOL: Array = ["wide", "extinguish", "up", "boost", "bag"]
const ITEM_SLOTS: int = 3

## 一次商品组：{ hero: int(-1 无), items: [key,...] }
static func generate() -> Dictionary:
	# 英雄位：未解锁角色中随机 1 个（全部解锁则无）
	var locked: Array = []
	for i in range(CharacterDB.COUNT):
		if not GameState.has_skin(i):
			locked.append(i)
	var hero: int = -1
	if not locked.is_empty():
		hero = locked[randi_range(0, locked.size() - 1)]

	# 道具位：从道具池随机取 ITEM_SLOTS 个（不重复）
	var pool: Array = ITEM_POOL.duplicate()
	pool.shuffle()
	var items: Array = []
	for i in range(mini(ITEM_SLOTS, pool.size())):
		items.append(pool[i])
	return {"hero": hero, "items": items}


static func item_price(key: String) -> int:
	if ITEM_DEFS.has(key):
		return int((ITEM_DEFS[key] as Dictionary).get("price", 100))
	return 100


static func item_name(key: String) -> String:
	if ITEM_DEFS.has(key):
		return str((ITEM_DEFS[key] as Dictionary).get("name", key))
	return key
