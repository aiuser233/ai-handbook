# 合成财报报告练习

全部输入为合成样例。Python 3.10+，仅标准库，不联网、不调模型、不含真实公司或客户资料。本例处理营业收入，负营收/未知单位/冲突重复会停止；不是通用财务系统。

从仓库根目录：

```bash
python examples/financial-report/make_report.py
python -m unittest discover -s examples/financial-report -p "test_*.py"
```

打开生成的 `output/report.html`；报告离线可读。默认输入/输出相对脚本，不依赖启动目录。显式 `--input`/`--output` 参数的相对路径则按当前工作目录解释。已有输出需 `--overwrite`；报告、缓存和测试产物不提交。

`sample.json` 是原始材料；`expected.json` 为独立手算结果；`make_report.py` 是计算/转义/输出逻辑；`test_report.py` 验证期望与边界。金额用 Decimal，JSON 金额为字符串，缺失为 null。

A=20%、B=25%；A+B 本期 6,200 万元、上期 5,000 万元、同比 24%。C 缺本期，D 上期零，二者不进入可比较子集；完全重复 A 去重并披露。不同期间不合计，未知单位、负值及公司/期间冲突重复报错。

报告引用对应输入项、字段、文件名和完整输入摘要值；计算说明给出公式及代码入口。F 表示有来源，仍需独立核验。数据全转义，输入中的 HTML 不执行；只展示文件名，不公开用户绝对目录。

无 Python 电脑可看 HTML，重算需要 Python 或按手册 A3 构建的已验证程序。MIT 许可只适用于本示例源代码和合成数据，见 LICENSE；不涵盖其他第三方资产。
