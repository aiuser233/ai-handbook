"""Generate an offline report from synthetic revenue data. Python 3.10+, stdlib only."""
from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation
import hashlib
import html
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
UNIT_TO_WAN = {"元": Decimal("0.0001"), "万元": Decimal("1"), "亿元": Decimal("10000")}


def number(value: object, field: str) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        raise ValueError(f"{field}: 金额必须是数字字符串或整数；缺失用 null")
    try:
        result = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{field}: 无效金额") from exc
    if not result.is_finite() or result < 0:
        raise ValueError(f"{field}: 本教学样例不接受非有限值或负营收")
    return result


def text_number(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return format(value, "f").rstrip("0").rstrip(".") if "." in format(value, "f") else format(value, "f")


def analyze(data: dict) -> dict:
    if not isinstance(data, dict) or not isinstance(data.get("records"), list) or not data["records"]:
        raise ValueError("需要非空 records 数组")
    seen, business_keys, rows, limitations = {}, set(), [], []
    removed = 0
    for position, record in enumerate(data["records"], 1):
        if not isinstance(record, dict):
            raise ValueError(f"记录 {position}: 需要对象")
        required = ("id", "company", "period", "unit", "source", "current", "previous")
        if any(k not in record for k in required):
            raise ValueError(f"记录 {position}: 字段缺失")
        for key in ("id", "company", "period", "unit", "source"):
            if not isinstance(record[key], str) or not record[key].strip():
                raise ValueError(f"记录 {position}: {key} 必须为非空字符串")
        if record["id"] in seen:
            if record != seen[record["id"]]:
                raise ValueError(f"记录 {record['id']}: 相同 ID 的内容冲突，不能自动取一条")
            removed += 1
            continue
        business_key = (record["company"], record["period"])
        if business_key in business_keys:
            raise ValueError("相同公司/期间出现不同 ID，需确认重复口径")
        seen[record["id"]] = record
        business_keys.add(business_key)
        unit = record["unit"]
        if unit not in UNIT_TO_WAN:
            raise ValueError(f"记录 {record['id']}: 未知单位 {unit}")
        current = number(record["current"], "current")
        previous = number(record["previous"], "previous")
        factor = UNIT_TO_WAN[unit]
        current = current * factor if current is not None else None
        previous = previous * factor if previous is not None else None
        yoy = None
        reason = ""
        if current is None or previous is None:
            reason = "期间数据缺失，不计算同比"
        elif previous == 0:
            reason = "上期为零，同比未定义"
        else:
            yoy = (current / previous - 1) * 100
        if reason:
            limitations.append(f"{record['id']}: {reason}")
        rows.append({"id": record["id"], "company": record["company"], "period": record["period"],
                     "current_wan": text_number(current), "previous_wan": text_number(previous),
                     "yoy_pct": text_number(yoy), "reason": reason, "source": record["source"],
                     "input_position": position})
    if len({r["period"] for r in rows}) != 1:
        raise ValueError("本例只汇总同一期间；不同期间不能直接合计")
    comparable = [r for r in rows if r["yoy_pct"] is not None]
    total_current = sum((Decimal(r["current_wan"]) for r in comparable), Decimal(0))
    total_previous = sum((Decimal(r["previous_wan"]) for r in comparable), Decimal(0))
    total_yoy = (total_current / total_previous - 1) * 100 if total_previous else None
    if removed:
        limitations.append(f"去除 {removed} 条内容完全一致的重复记录；冲突重复会停止处理")
    limitations.append("汇总仅含可比较子集，不代表全部企业或真实财务口径")
    return {"rows": rows, "comparable_ids": [r["id"] for r in comparable],
            "comparable_current_wan": text_number(total_current) if comparable else None,
            "comparable_previous_wan": text_number(total_previous) if comparable else None,
            "comparable_yoy_pct": text_number(total_yoy), "removed_duplicates": removed,
            "limitations": limitations}


def render(result: dict, filename: str, digest: str) -> str:
    e = html.escape
    display = lambda v: e(v) if v is not None else "未知/不适用"
    body_rows, sources = [], []
    for n, row in enumerate(result["rows"], 1):
        source_id = f"source-{n}"
        body_rows.append(f"<tr><td>{e(row['id'])}</td><td>{e(row['company'])}</td>"
                         f"<td>{e(row['period'])}</td><td>{display(row['current_wan'])}</td>"
                         f"<td>{display(row['previous_wan'])}</td><td>{display(row['yoy_pct'])}</td>"
                         f"<td>{e(row['reason']) or '可比较'}</td>"
                         f"<td><a href='#{source_id}'>[{n}]</a></td></tr>")
        sources.append(f"<li id='{source_id}'>[F，有来源；请独立核验] {e(filename)}，"
                       f"records 第 {row['input_position']} 项，ID={e(row['id'])}；"
                       f"字段 current/previous/unit：{e(row['source'])}。"
                       "单位转换见 make_report.py 的 UNIT_TO_WAN；同比公式：(本期/上期−1)×100。</li>")
    limits = "".join(f"<li>{e(item)}</li>" for item in result["limitations"])
    return f"""<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>合成财报练习报告</title><style>
body{{font:16px/1.7 system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;color:#182431}}
.table{{overflow:auto}}table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #ccd5df;padding:10px;text-align:left}}
th{{background:#eef3f8}}code{{overflow-wrap:anywhere}}a{{color:#254bc6}}@media print{{body{{margin:0;font-size:11pt}}}}
</style><h1>合成财报练习报告</h1>
<p>所有公司与数字为教学合成样例；非投资或审计结论。单位：万元，同比：%。</p>
<div class="table"><table><thead><tr><th>ID</th><th>公司</th><th>期间</th><th>本期</th><th>上期</th><th>同比</th><th>状态/限制</th><th>来源</th></tr></thead>
<tbody>{''.join(body_rows)}</tbody></table></div>
<h2>可比较子集汇总</h2><p>[F，脚本计算；待独立复核] 仅 {e(', '.join(result['comparable_ids'])) or '无记录'}：
本期 {display(result['comparable_current_wan'])}、上期 {display(result['comparable_previous_wan'])} 万元，
同比 {display(result['comparable_yoy_pct'])}%。依据上述记录与同一公式；不是各公司同比的简单平均。</p>
<h2>未知与限制</h2><ul>{limits}</ul><h2>来源与复算</h2><ol>{''.join(sources)}</ol>
<p>输入 SHA-256：<code>{e(digest)}</code>。仅用于匹配版本，不证明输入真实。</p>
<p>核验步骤：对照原 JSON、确认万元/元单位、手算 A=20%、B=25%、子集=24%，检查 C/D 处理。
本报告没有声称已由独立审计人签字。</p></html>"""


def generate(input_path: Path, output_path: Path, overwrite: bool = False) -> dict:
    input_path, output_path = input_path.resolve(), output_path.resolve()
    if input_path == output_path:
        raise ValueError("输出不能覆盖输入")
    raw = input_path.read_bytes()
    data = json.loads(raw.decode("utf-8-sig"))
    result = analyze(data)
    report = render(result, input_path.name, hashlib.sha256(raw).hexdigest())
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w" if overwrite else "x", encoding="utf-8", newline="\n") as dest:
        dest.write(report)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=HERE / "sample.json")
    parser.add_argument("--output", type=Path, default=HERE / "output" / "report.html")
    parser.add_argument("--overwrite", action="store_true", help="明确允许替换已有报告")
    args = parser.parse_args()
    try:
        result = generate(args.input, args.output, args.overwrite)
    except (ValueError, OSError) as exc:
        parser.exit(1, f"生成失败：{exc}\n")
    print(f"已生成：{args.output.resolve()}；记录 {len(result['rows'])}，重复去除 {result['removed_duplicates']}")


if __name__ == "__main__":
    main()
