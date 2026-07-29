"""Heuristic post-processing: manga reading-order sort + bubble-type tagging.

PaddleOCR returns raw text boxes with no notion of bubble type or reading
direction. These helpers approximate both from geometry so the output matches
the same item contract the cloud LLM returns: { text, type }.
"""

def _xs(box):
    return [p[0] for p in box]


def _ys(box):
    return [p[1] for p in box]


def _x_center(box):
    return sum(_xs(box)) / len(box)


def _y_center(box):
    return sum(_ys(box)) / len(box)


def _height(box):
    ys = _ys(box)
    return max(ys) - min(ys)


def _width(box):
    xs = _xs(box)
    return max(xs) - min(xs)


def sort_reading_order(items, direction="rtl"):
    """Group boxes into rows, then order rows top-to-bottom.

    Within a row: right-to-left for Japanese manga (rtl), left-to-right
    for manhwa/webtoons/western comics (ltr).
    """
    if not items:
        return items
    items = sorted(items, key=lambda it: _y_center(it["box"]))
    rows = []
    for it in items:
        y = _y_center(it["box"])
        h = max(_height(it["box"]), 1)
        placed = False
        for row in rows:
            if abs(y - row["y"]) < h * 0.7:
                row["items"].append(it)
                placed = True
                break
        if not placed:
            rows.append({"y": y, "items": [it]})
    rows.sort(key=lambda r: r["y"])
    out = []
    for row in rows:
        if direction == "rtl":
            row["items"].sort(key=lambda it: -_x_center(it["box"]))
        else:
            row["items"].sort(key=lambda it: _x_center(it["box"]))
        out.extend(row["items"])
    return out


def classify(items, img_shape):
    """Assign a bubble/element type to each item using geometry heuristics.

    Falls back to 'speech' for anything that does not match a clear cue.
    """
    if not items:
        return items
    heights = sorted(max(_height(it["box"]), 1) for it in items)
    median_h = heights[len(heights) // 2] or 1.0
    img_h = img_shape[0]
    img_w = img_shape[1]

    for it in items:
        box = it["box"]
        h = max(_height(box), 1)
        text = (it.get("text") or "").strip()
        xc = _x_center(box)
        yc = _y_center(box)

        # SFX: large, short, decorative text.
        if h > median_h * 2.2 and len(text) <= 10:
            it["type"] = "sfx"
            continue
        # smalltext: notably smaller than the median line.
        if h < median_h * 0.55:
            it["type"] = "smalltext"
            continue
        # outertext: hugging the outer margins of the page.
        if min(xc, img_w - xc) < img_w * 0.06 or min(yc, img_h - yc) < img_h * 0.05:
            it["type"] = "outertext"
            continue
        # default spoken dialogue.
        it["type"] = "speech"
    return items