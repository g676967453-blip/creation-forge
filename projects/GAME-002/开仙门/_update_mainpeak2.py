with open('scripts/main_peak.gd', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Helper: lines[i] is expected to have leading tabs + content
# We'll modify specific line indices

# ============================================================
# 1. Channel dict changes (lines 80-116, 0-indexed)
# ============================================================
# line 87: remove "split_count" key
# line 93: replace "tracking" with cycle fields
# Find exact line numbers by scanning

split_count_idx = None
tracking_idx = None
for i, line in enumerate(lines):
    if '"split_count":' in line:
        split_count_idx = i
    if '"tracking": false' in line:
        tracking_idx = i

if split_count_idx is not None:
    del lines[split_count_idx]
    print(f"Removed split_count at line {split_count_idx + 1}")
    # tracking_idx shifted by -1
    if tracking_idx is not None and tracking_idx > split_count_idx:
        tracking_idx -= 1

if tracking_idx is not None:
    indent = "\t\t\t"
    new_lines = [
        f'{indent}"cycle_count_bonus": 0,\n',
        f'{indent}"cycle_damage_multiplier": 1.0,\n',
        f'{indent}"projectile_speed_multiplier": 1.0,\n',
    ]
    lines[tracking_idx:tracking_idx+1] = new_lines
    print(f"Replaced tracking at line {tracking_idx + 1}")

# ============================================================
# 2. apply_upgrade changes
# ============================================================
for i, line in enumerate(lines):
    if '"combo_max":' in line:
        lines[i] = '\t\t\t\t"cycle_count":\n'
        lines[i+1] = '\t\t\t\t\tchannel["cycle_count_bonus"] += int(effect_value)\n'
        print(f"Fixed combo_max → cycle_count at line {i+1}")
    elif '"combo_bonus":' in line:
        lines[i] = '\t\t\t\t"cycle_damage":\n'
        lines[i+1] = '\t\t\t\t\tchannel["cycle_damage_multiplier"] += effect_value\n'
        print(f"Fixed combo_bonus → cycle_damage at line {i+1}")
    elif '"tracking":' in line and 'channel["tracking"]' in lines[i+1]:
        lines[i] = '\t\t\t\t"projectile_speed":\n'
        lines[i+1] = '\t\t\t\t\tchannel["projectile_speed_multiplier"] += effect_value\n'
        print(f"Fixed tracking → projectile_speed at line {i+1}")

# ============================================================
# 3. _trigger_ultimate: "combo" → "cycle"
# ============================================================
for i, line in enumerate(lines):
    if line.strip() == '"combo":':
        # Check if next line calls _ultimate_sword
        if '_ultimate_sword' in lines[i+1]:
            lines[i] = line.replace('"combo"', '"cycle"')
            print(f"Fixed trigger_ultimate combo → cycle at line {i+1}")
            break

# ============================================================
# 4. _perform_projectile_attack: add cycle logic
# ============================================================
# Find the function and modify it
func_start = None
for i, line in enumerate(lines):
    if 'func _perform_projectile_attack' in line:
        func_start = i
        break

if func_start is not None:
    # Find the line with "var total_count"
    total_count_idx = None
    for i in range(func_start, min(func_start + 80, len(lines))):
        if 'var total_count:' in lines[i]:
            total_count_idx = i
            break

    if total_count_idx is not None:
        indent1 = '\t'
        indent2 = '\t\t'
        indent3 = '\t\t\t'
        indent4 = '\t\t\t\t'

        # Insert after total_count line
        insert_lines = [
            f'{indent2}var is_cycle: bool = config.special_mechanic == "cycle"\n',
            f'{indent2}var base_target_time: float = 0.0\n',
            f'{indent2}var trajectory_types: Array = []\n',
            f'{indent2}if is_cycle:\n',
            f'{indent3}var dist := global_position.distance_to(target.global_position)\n',
            f'{indent3}base_target_time = dist / projectile_speed\n',
            f'{indent3}trajectory_types = _build_trajectory_types(total_count)\n',
            f'\n',
        ]
        lines[total_count_idx+1:total_count_idx+1] = insert_lines
        print(f"Inserted cycle setup after line {total_count_idx+1}")

        # Now modify the projectile creation loop to handle cycle
        # Find the line with "if channel[\"tracking\"]:"
        tracking_if_idx = None
        for i in range(total_count_idx, min(total_count_idx + 60, len(lines))):
            if 'if channel["tracking"]:' in lines[i] or "if channel['tracking']:" in lines[i]:
                tracking_if_idx = i
                break

        if tracking_if_idx is not None:
            # Find the full tracking if/else block
            # if channel["tracking"]:
            #     proj.set_target(...)
            # else:
            #     proj.set_target(...)
            # Replace with cycle-aware targeting
            else_idx = None
            end_idx = None
            for i in range(tracking_if_idx, min(tracking_if_idx + 10, len(lines))):
                if 'else:' in lines[i] and i > tracking_if_idx:
                    else_idx = i
                if else_idx and '_add_to_battlefield(proj)' in lines[i]:
                    end_idx = i
                    break

            if else_idx is not None and end_idx is not None:
                replace_block = [
                    f'{indent3}if is_cycle:\n',
                    f'{indent4}proj.damage *= channel["cycle_damage_multiplier"]\n',
                    f'{indent4}var params := config.get_special_params()\n',
                    f'{indent4}var cycle_count: int = int(params.get("cycle_count", 1)) + int(channel.get("cycle_count_bonus", 0))\n',
                    f'{indent4}var cycle_distance: float = float(params.get("cycle_distance", 30.0))\n',
                    f'{indent4}var arc_min: float = float(params.get("arc_offset_min", 40.0))\n',
                    f'{indent4}var arc_max: float = float(params.get("arc_offset_max", 120.0))\n',
                    f'{indent4}var turn_dur: float = float(params.get("turn_duration", 0.3))\n',
                    f'{indent4}var spd_mult: float = 1.0 + float(channel.get("projectile_speed_multiplier", 0.0))\n',
                    f'{indent4}var use_arc: bool = trajectory_types[i] == "arc"\n',
                    f'{indent4}proj.setup_cycle(target, cycle_count, cycle_distance, arc_min, arc_max, turn_dur, spd_mult, base_target_time, use_arc)\n',
                    f'{indent3}else:\n',
                    f'{indent4}proj.set_target(target.global_position)\n',
                ]
                lines[tracking_if_idx:end_idx] = replace_block
                print(f"Replaced tracking block at line {tracking_if_idx+1}")

# ============================================================
# 5. Rewrite _ultimate_sword
# ============================================================
# Find _ultimate_sword function
ult_start = None
ult_end = None
for i, line in enumerate(lines):
    if 'func _ultimate_sword' in line:
        ult_start = i
    if ult_start is not None and 'func _ultimate_buddha' in line:
        ult_end = i
        break

if ult_start is not None and ult_end is not None:
    indent1 = '\t'
    indent2 = '\t\t'
    indent3 = '\t\t\t'
    indent4 = '\t\t\t\t'
    indent5 = '\t\t\t\t\t'

    new_ultimate = [
        f'{indent1}func _ultimate_sword(channel: Dictionary) -> void:\n',
        f'{indent2}var config: FormConfig = channel["config"] as FormConfig\n',
        f'{indent2}var up := config.get_special_params()\n',
        f'{indent2}var ult_count: int = int(up.get("ultimate_count", 50))\n',
        f'{indent2}var ult_radius: float = float(up.get("ultimate_radius", 230.0))\n',
        f'{indent2}var ult_arc: float = float(up.get("ultimate_arc_degrees", 180.0))\n',
        f'{indent2}var charge_time: float = float(up.get("ultimate_charge_time", 1.0))\n',
        f'{indent2}var dmg_mult: float = float(up.get("ultimate_dmg_mult", 1.5))\n',
        f'{indent2}var cycle_count: int = int(up.get("cycle_count", 1)) + int(channel.get("cycle_count_bonus", 0))\n',
        f'{indent2}var cycle_distance: float = float(up.get("cycle_distance", 30.0))\n',
        f'{indent2}var arc_min: float = float(up.get("arc_offset_min", 40.0))\n',
        f'{indent2}var arc_max: float = float(up.get("arc_offset_max", 120.0))\n',
        f'{indent2}var turn_dur: float = float(up.get("turn_duration", 0.3))\n',
        f'{indent2}var spd_mult: float = 1.0 + float(channel.get("projectile_speed_multiplier", 0.0))\n',
        f'{indent2}var dmg: float = config.damage * channel["damage_multiplier"] * channel["cycle_damage_multiplier"] * (1.0 + (channel["level"] - 1) * 0.1) * dmg_mult\n',
        f'\n',
        f'{indent2}# Charge phase: create swords in fan above spirit\n',
        f'{indent2}var swords: Array = []\n',
        f'{indent2}var half_arc := deg_to_rad(ult_arc / 2.0)\n',
        f'{indent2}for i in range(ult_count):\n',
        f'{indent3}var proj: Projectile = PROJECTILE_SCENE.instantiate() as Projectile\n',
        f'{indent3}proj.damage = dmg\n',
        f'{indent3}proj.speed = projectile_speed\n',
        f'{indent3}proj.projectile_color = config.projectile_color\n',
        f'{indent3}proj.projectile_shape = config.projectile_shape\n',
        f'{indent3}proj.from_peak = self\n',
        f'{indent3}var angle: float = -half_arc + deg_to_rad(ult_arc) * float(i) / float(max(ult_count - 1, 1))\n',
        f'{indent3}var dir := Vector2(sin(angle), -cos(angle))\n',
        f'{indent3}proj.global_position = global_position + dir * ult_radius\n',
        f'{indent3}proj.modulate.a = 0.0\n',
        f'{indent3}_add_to_battlefield(proj)\n',
        f'{indent3}proj.form_channel = channel\n',
        f'{indent3}swords.append({{"proj": proj, "dir": dir}})\n',
        f'\n',
        f'{indent2}# Fade in\n',
        f'{indent2}var elapsed := 0.0\n',
        f'{indent2}while elapsed < charge_time:\n',
        f'{indent3}elapsed += get_process_delta_time()\n',
        f'{indent3}var alpha: float = clamp(elapsed / charge_time, 0.0, 1.0)\n',
        f'{indent3}for s in swords:\n',
        f'{indent4}var p: Projectile = s["proj"] as Projectile\n',
        f'{indent4}if is_instance_valid(p):\n',
        f'{indent5}p.modulate.a = alpha\n',
        f'{indent5}p.global_position = global_position + s["dir"] * ult_radius\n',
        f'{indent3}await get_tree().process_frame\n',
        f'\n',
        f'{indent2}# Launch all simultaneously\n',
        f'{indent2}var targets := get_tree().get_nodes_in_group("enemies")\n',
        f'{indent2}var valid_targets: Array = []\n',
        f'{indent2}for t in targets:\n',
        f'{indent3}if is_instance_valid(t):\n',
        f'{indent4}valid_targets.append(t)\n',
        f'\n',
        f'{indent2}for i in range(swords.size()):\n',
        f'{indent3}var s = swords[i]\n',
        f'{indent3}var proj: Projectile = s["proj"] as Projectile\n',
        f'{indent3}if not is_instance_valid(proj):\n',
        f'{indent4}continue\n',
        f'{indent3}proj.modulate.a = 1.0\n',
        f'{indent3}var sword_target: Node2D = null\n',
        f'{indent3}if valid_targets.size() > 0:\n',
        f'{indent4}sword_target = valid_targets[i % valid_targets.size()]\n',
        f'{indent3}if sword_target:\n',
        f'{indent4}var dist := proj.global_position.distance_to(sword_target.global_position)\n',
        f'{indent4}var target_time: float = dist / projectile_speed\n',
        f'{indent4}proj.setup_cycle(sword_target, cycle_count, cycle_distance, arc_min, arc_max, turn_dur, spd_mult, target_time, false)\n',
        f'{indent3}else:\n',
        f'{indent4}proj.direction = Vector2(randf_range(-0.5, 0.5), -1.0).normalized()\n',
        f'{indent4}proj._is_cycle = false\n',
        f'\n',
    ]
    lines[ult_start:ult_end] = new_ultimate
    print(f"Rewrote _ultimate_sword (lines {ult_start+1}-{ult_end})")

# ============================================================
# 6. Add _build_trajectory_types before _cleanup_summons
# ============================================================
cleanup_idx = None
for i, line in enumerate(lines):
    if 'func _cleanup_summons' in line:
        cleanup_idx = i
        break

if cleanup_idx is not None:
    indent1 = '\t'
    indent2 = '\t\t'
    new_method = [
        f'{indent1}func _build_trajectory_types(count: int) -> Array:\n',
        f'{indent2}var types: Array = []\n',
        f'{indent2}for i in range(count):\n',
        f'{indent2}\ttypes.append("arc" if i % 2 == 1 else "straight")\n',
        f'{indent2}types.shuffle()\n',
        f'{indent2}return types\n',
        f'\n',
    ]
    lines[cleanup_idx:cleanup_idx] = new_method
    print(f"Added _build_trajectory_types before line {cleanup_idx+1}")

with open('scripts/main_peak.gd', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("main_peak.gd updated successfully")
print(f"Total lines: {len(lines)}")
