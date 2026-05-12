import 'package:flutter/material.dart';

import '../../../../shared/models/app_models.dart';

Map<String, List<Campaign>> groupCampaignsByDate(List<Campaign> campaigns) {
  final sorted = [...campaigns];
  sorted.sort((a, b) {
    final aTime = a.createdAt;
    final bTime = b.createdAt;
    if (aTime == null && bTime == null) return 0;
    if (aTime == null) return 1;
    if (bTime == null) return -1;
    return bTime.compareTo(aTime);
  });

  final grouped = <String, List<Campaign>>{};
  for (final campaign in sorted) {
    final createdAt = campaign.createdAt;
    final key = createdAt == null
        ? 'unknown'
        : '${createdAt.year.toString().padLeft(4, '0')}-${createdAt.month.toString().padLeft(2, '0')}-${createdAt.day.toString().padLeft(2, '0')}';
    grouped.putIfAbsent(key, () => []).add(campaign);
  }
  return grouped;
}

String campaignSectionTitleForKey(String key) {
  if (key == 'unknown') return 'Unknown date';
  final parts = key.split('-');
  if (parts.length != 3) return key;
  final year = int.tryParse(parts[0]);
  final month = int.tryParse(parts[1]);
  final day = int.tryParse(parts[2]);
  if (year == null || month == null || day == null) return key;

  final date = DateTime(year, month, day);
  final today = DateUtils.dateOnly(DateTime.now());
  final yesterday = today.subtract(const Duration(days: 1));
  if (DateUtils.isSameDay(date, today)) return 'Today';
  if (DateUtils.isSameDay(date, yesterday)) return 'Yesterday';

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '$day ${months[month - 1]} $year';
}
