/**
 * PS 4×4 切图脚本
 * 前提：已手动抠好图（透明底）
 * 用法：运行 → 选目录 → 16 张透明 PNG
 */

#target photoshop
app.preferences.rulerUnits = Units.PIXELS;

var CELL = 256, GRID = 4;

function main() {
    var doc = app.activeDocument;
    var outFolder = Folder.selectDialog("选择输出目录");
    if (!outFolder) return;

    var count = 0;
    for (var row = 0; row < GRID; row++) {
        for (var col = 0; col < GRID; col++) {
            var x = col * CELL, y = row * CELL;

            doc.selection.select([
                [x, y], [x + CELL, y],
                [x + CELL, y + CELL], [x, y + CELL]
            ]);

            doc.selection.copy();

            var nd = app.documents.add(
                CELL, CELL, 72, "tmp",
                NewDocumentMode.RGB, DocumentFill.TRANSPARENT
            );
            nd.paste();

            // 合并图层（保留透明）
            try {
                nd.mergeVisibleLayers();
            } catch (e) {
                // 如果 merge 失败，直接全选复制到新文档
                nd.selection.selectAll();
                nd.selection.copy();
                var nd2 = app.documents.add(CELL, CELL, 72, "tmp2",
                    NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
                nd2.paste();
                nd.close(SaveOptions.DONOTSAVECHANGES);
                nd = nd2;
            }

            // save（不 trim，保持 256×256）
            var f = new File(outFolder + "/item_r" + row + "_c" + col + ".png");
            var o = new PNGSaveOptions(); o.compression = 9;
            nd.saveAs(f, o, true);
            nd.close(SaveOptions.DONOTSAVECHANGES);
            count++;
        }
    }

    doc.selection.deselect();
    alert("Done: " + count + " PNG -> " + outFolder.fsName);
}

main();
