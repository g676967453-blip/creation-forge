shader_type canvas_item;
// 弹射物拖尾特效（方案 A' · 发光光带）
// 用球自身的 alpha 沿运动方向做发光拉伸/光斑，形成明显拖尾。
// 不依赖 UV 采样残影（避免 AnimatedSprite2D 帧采样区域小导致无效果）。
// 注意：canvas_item fragment 内不要用 return，统一条件赋值。

uniform vec4 trail_color : source_color = vec4(1.0, 0.55, 0.3, 0.65);   // 拖尾颜色（暖橙）
uniform float trail_strength : hint_range(0.0, 1.0) = 0.9;              // 浓度
uniform float trail_len = 26.0;                                          // 拖尾长度（像素，局部坐标）
uniform vec2 trail_dir = vec2(0.0, -1.0);                                // 运动方向（取反向为拖尾）
uniform bool enabled = true;

void fragment() {
    // 主角本体
    vec4 src = texture(TEXTURE, UV);
    vec4 out_color = src;

    if (enabled) {
        // 局部像素坐标（UV 原点在纹理左上角，中心为 0）
        vec2 tex_size = vec2(textureSize(TEXTURE, 0));
        vec2 px = (UV - 0.5) * tex_size;

        // 运动方向（屏幕空间），取反得到拖尾方向
        vec2 back = -normalize(trail_dir);

        // 沿 back 方向的投影：越靠拖尾一侧 proj 越大
        float proj = dot(px, back);
        float d = clamp(proj / trail_len, 0.0, 1.0);

        // 只在拖尾方向一侧发光，且随距离衰减
        float forward = smoothstep(0.0, trail_len, proj);
        float alpha = forward * (1.0 - d) * src.a * trail_strength;

        vec4 trail = vec4(trail_color.rgb, trail_color.a * alpha);
        out_color = max(src, trail);
    }

    COLOR = out_color;
}
