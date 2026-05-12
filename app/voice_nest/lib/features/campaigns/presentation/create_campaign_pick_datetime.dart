import 'package:flutter/material.dart';

Future<DateTime?> pickCampaignDateTime(
  BuildContext context, {
  required DateTime initial,
  DateTime? firstDate,
  DateTime? lastDate,
}) async {
  final d = await showDatePicker(
    context: context,
    initialDate: initial,
    firstDate: firstDate ?? DateTime.now().subtract(const Duration(days: 1)),
    lastDate: lastDate ?? DateTime.now().add(const Duration(days: 366)),
  );
  if (d == null || !context.mounted) return null;
  final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial));
  if (t == null || !context.mounted) return null;
  return DateTime(d.year, d.month, d.day, t.hour, t.minute);
}
