class_name CharacterDB
extends RefCounted
## 角色元数据（5 角色：小猫/小狗/熊猫/卡皮巴拉/哪吒）
## 纯数据 + 静态查询。拥有/选择状态存 GameState（owned_skins / skin_index）。
## 能力以 kind 字段判定（避免中文字符串 indexOf 脆弱）。

const CAT: int = 0
const DOG: int = 1
const PANDA: int = 2
const CAPY: int = 3
const FOX: int = 4
const COUNT: int = 5

## cost = 金币解锁价；unlock: free=初始 / coins=金币 / ad=广告或金币（按金币处理，广告 mock）
const ROLES: Array = [
	{
		"id": "cat", "name": "小猫", "cost": 0, "unlock": "free",
		"kind": "cat",
		"ability": "敏捷：蹦床移动速度 +25%",
		"tex_ball": null,
	},
	{
		"id": "dog", "name": "小狗", "cost": 0, "unlock": "free",
		"kind": "dog",
		"ability": "救援：救人得分 +50%（含红窗）",
		"tex_ball": null,
	},
	{
		"id": "panda", "name": "熊猫", "cost": 2000, "unlock": "coins",
		"kind": "panda",
		"ability": "力量：灭火伤害 ×2（一次撞击抵两次）",
		"tex_ball": null,
	},
	{
		"id": "capy", "name": "卡皮巴拉", "cost": 3000, "unlock": "coins",
		"kind": "capy",
		"ability": "稳定：蹦床 50% 抗火；着火 3 秒自动熄灭",
		"tex_ball": null,
	},
	{
		"id": "fox", "name": "狐狸", "cost": 5000, "unlock": "ad",
		"kind": "fox",
		"ability": "爆发：影分身——分出 6 个分身（CD 6 秒，可重复）",
		"tex_ball": null,
	},
]


static func role(index: int) -> Dictionary:
	var i := clampi(index, 0, COUNT - 1)
	return ROLES[i] as Dictionary


static func kind(index: int) -> String:
	return str(role(index).get("kind", ""))


static func is_kind(index: int, kind_key: String) -> bool:
	return kind(index) == kind_key


## 当前使用角色的能力判定（GameState.skin_index）
static func cur_is(kind_key: String) -> bool:
	return is_kind(GameState.skin_index, kind_key)
