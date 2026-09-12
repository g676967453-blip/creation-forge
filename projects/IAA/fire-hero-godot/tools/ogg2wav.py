# -*- coding: utf-8 -*-
"""将 IAA/audio/*.ogg 转为 16-bit PCM WAV（soundfile），供 Godot 运行时下载后内存播放。"""
import pathlib
import wave
import soundfile as sf

SRC = pathlib.Path(__file__).resolve().parent.parent / "audio"

for ogg in sorted(SRC.glob("*.ogg")):
    data, sr = sf.read(str(ogg), dtype="float32", always_2d=True)
    # 混为 mono（平均声道）
    if data.shape[1] > 1:
        data = data.mean(axis=1, keepdims=True)
    else:
        data = data[:, :1]
    # float32 [-1,1] -> int16
    import numpy as np
    pcm = (np.clip(data[:, 0], -1.0, 1.0) * 32767.0).astype("<i2")
    wav_path = ogg.with_suffix(".wav")
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    ogg.unlink()
    print(f"[OK] {ogg.name} -> {wav_path.name} ({sr}Hz mono)")

print("done")
