import 'dart:convert';

/// Parses CSV: first column named `number` (case-insensitive), returns comma-separated E.164-ish tokens.
String parseCsvPhoneColumn(String csvText, {int maxNumbers = 5000}) {
  final lines = const LineSplitter().convert(csvText.trim());
  if (lines.isEmpty) return '';

  final header = lines.first.split(',').map((s) => s.trim().toLowerCase()).toList();
  final idx = header.indexOf('number');
  if (idx < 0) {
    throw const FormatException('CSV must have a "number" column header in the first row');
  }

  final out = <String>[];
  for (var i = 1; i < lines.length; i++) {
    if (out.length >= maxNumbers) break;
    final row = _splitCsvLine(lines[i]);
    if (idx >= row.length) continue;
    final raw = row[idx].trim();
    if (raw.isEmpty) continue;
    out.add(raw);
  }
  return out.join(',');
}

List<String> _splitCsvLine(String line) {
  final parts = <String>[];
  final buf = StringBuffer();
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    final c = line[i];
    if (c == '"') {
      inQuotes = !inQuotes;
    } else if (c == ',' && !inQuotes) {
      parts.add(buf.toString().trim());
      buf.clear();
    } else {
      buf.write(c);
    }
  }
  parts.add(buf.toString().trim());
  return parts;
}
