/// RFC 3339 with explicit local offset (Exotel schedule example format).
String toRfc3339WithOffset(DateTime local) {
  String p2(int n) => n.toString().padLeft(2, '0');
  final off = local.timeZoneOffset;
  final sign = off.isNegative ? '-' : '+';
  final absM = off.inMinutes.abs();
  final h = absM ~/ 60;
  final m = absM % 60;
  return '${local.year}-${p2(local.month)}-${p2(local.day)}'
      'T${p2(local.hour)}:${p2(local.minute)}:${p2(local.second)}'
      '$sign${p2(h)}:${p2(m)}';
}
