import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from make_report import HERE, analyze, generate, render


class ReportTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((HERE / "sample.json").read_text(encoding="utf-8"))

    def test_independent_expected_results(self):
        result = analyze(self.data)
        expected = json.loads((HERE / "expected.json").read_text(encoding="utf-8"))
        for actual, wanted in zip(result["rows"], expected["rows"], strict=True):
            for key, value in wanted.items():
                self.assertEqual(actual[key], value)
        for key in expected:
            if key != "rows":
                self.assertEqual(result[key], expected[key])

    def test_reject_invalid_units_negative_and_conflicting_duplicates(self):
        for key, value in [("unit", "美元"), ("current", "-1"), ("current", "NaN"), ("current", True)]:
            data = copy.deepcopy(self.data)
            data["records"][1][key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                analyze(data)
        self.data["records"][-1]["current"] = "999"
        with self.assertRaisesRegex(ValueError, "冲突"):
            analyze(self.data)

    def test_missing_and_zero_remain_unknown(self):
        result = analyze(self.data)
        self.assertIsNone(result["rows"][2]["yoy_pct"])
        self.assertIsNone(result["rows"][3]["yoy_pct"])
        self.assertEqual(result["comparable_ids"], ["A", "B"])

    def test_period_mixing_and_business_duplicates_rejected(self):
        self.data["records"][1]["period"] = "2024"
        with self.assertRaisesRegex(ValueError, "同一期间"):
            analyze(self.data)
        self.data = json.loads((HERE / "sample.json").read_text(encoding="utf-8"))
        self.data["records"][-1]["id"] = "A2"
        with self.assertRaisesRegex(ValueError, "公司/期间"):
            analyze(self.data)

    def test_escape_untrusted_text(self):
        self.data["records"][1]["company"] = '<script>alert("x")</script>'
        report = render(analyze(self.data), "sample.json", "demo")
        self.assertNotIn("<script>", report)
        self.assertIn("&lt;script&gt;", report)

    def test_paths_overwrite_and_input_unchanged(self):
        with tempfile.TemporaryDirectory(prefix="handbook-report-") as temp:
            root = Path(temp)
            source = root / "合成 input.json"
            raw = (HERE / "sample.json").read_bytes()
            source.write_bytes(raw)
            output = root / "result" / "report.html"
            command = [sys.executable, str(HERE / "make_report.py"), "--input", str(source), "--output", str(output)]
            result = subprocess.run(command, cwd=root, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("6200", output.read_text(encoding="utf-8"))
            self.assertEqual(source.read_bytes(), raw)
            with self.assertRaises(FileExistsError):
                generate(source, output)
            generate(source, output, overwrite=True)
            with self.assertRaisesRegex(ValueError, "不能覆盖输入"):
                generate(source, source, overwrite=True)


if __name__ == "__main__":
    unittest.main()
