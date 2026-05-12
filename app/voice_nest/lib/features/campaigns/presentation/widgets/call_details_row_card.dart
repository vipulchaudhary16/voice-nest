import 'package:flutter/material.dart';

import '../../domain/campaign_detail_models.dart';
import 'campaign_detail_widgets.dart';

class CallDetailsRowCard extends StatelessWidget {
  const CallDetailsRowCard({
    super.key,
    required this.row,
    required this.toTitleCase,
    required this.formatDateTime,
    required this.onPlayTap,
    required this.isPlayLoading,
  });

  final CampaignCallRow row;
  final String Function(String) toTitleCase;
  final String Function(String) formatDateTime;
  final VoidCallback onPlayTap;
  final bool isPlayLoading;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.45)),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        leading: CircleAvatar(
          radius: 16,
          child: isPlayLoading
              ? const SizedBox.square(
                  dimension: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  onPressed: onPlayTap,
                  tooltip: 'Play recording',
                ),
        ),
        title: Text(
          row.number,
          style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700),
        ),
        subtitle: Text('${toTitleCase(row.status)}  •  ${formatDateTime(row.dateCreated)}'),
        childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        children: row.allDetails
            .map((detail) => CampaignDetailRow(label: detail.key, value: detail.value))
            .toList(),
      ),
    );
  }
}
