"""Hypothetical USD-per-million-token example; not vendor pricing."""
from decimal import Decimal

MILLION = Decimal(1_000_000)
no_cache = (Decimal(9000) * 3 + Decimal(1000) * 15) / MILLION
with_cache = (Decimal(8000) * Decimal("0.3") + Decimal(1000) * 3 + Decimal(1000) * 15) / MILLION
saving = (no_cache - with_cache) / no_cache * 100
assert no_cache == Decimal("0.042")
assert with_cache == Decimal("0.0204")
assert saving.quantize(Decimal("0.1")) == Decimal("51.4")
print(f"假设单次：${no_cache} → ${with_cache}；节省约 {saving:.1f}%")
print(f"假设1000次：${no_cache * 1000:.2f} → ${with_cache * 1000:.2f}")
print("未计缓存写入、失效、工具、税费与重试；不代表当前厂商价格。")
