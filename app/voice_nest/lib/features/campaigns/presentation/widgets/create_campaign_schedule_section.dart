import 'package:flutter/material.dart';

import '../create_campaign_models.dart';
import 'create_campaign_section.dart';

class CreateCampaignScheduleSection extends StatelessWidget {
  const CreateCampaignScheduleSection({
    required this.scheduleChoice,
    required this.sendAt,
    required this.endAt,
    required this.onScheduleChanged,
    required this.onPickSend,
    required this.onPickEnd,
    super.key,
  });

  final CreateScheduleChoice scheduleChoice;
  final DateTime? sendAt;
  final DateTime? endAt;
  final ValueChanged<CreateScheduleChoice> onScheduleChanged;
  final VoidCallback onPickSend;
  final VoidCallback onPickEnd;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wide = MediaQuery.sizeOf(context).width >= 520;
    return CreateCampaignSection(
      title: 'Schedule your campaign',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('* Schedule type', style: theme.textTheme.labelLarge),
          const SizedBox(height: 6),
          SegmentedButton<CreateScheduleChoice>(
            segments: const [
              ButtonSegment(value: CreateScheduleChoice.now, label: Text('Now')),
              ButtonSegment(value: CreateScheduleChoice.later, label: Text('Later')),
            ],
            selected: {scheduleChoice},
            onSelectionChanged: (s) => onScheduleChanged(s.first),
          ),
          if (scheduleChoice == CreateScheduleChoice.later) ...[
            const SizedBox(height: 12),
            if (wide)
              Row(
                children: [
                  Expanded(child: _dtTile(context, 'Start', sendAt, onPickSend)),
                  const SizedBox(width: 10),
                  Expanded(child: _dtTile(context, 'End', endAt, onPickEnd)),
                ],
              )
            else ...[
              _dtTile(context, 'Start', sendAt, onPickSend),
              const SizedBox(height: 8),
              _dtTile(context, 'End', endAt, onPickEnd),
            ],
            const SizedBox(height: 6),
            Text(
              'RFC 3339 window sent to Exotel (local timezone offset).',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
          ],
        ],
      ),
    );
  }

  Widget _dtTile(BuildContext context, String label, DateTime? v, VoidCallback onTap) {
    final theme = Theme.of(context);
    final text = v == null ? 'Tap to choose' : '${v.toLocal()}'.split('.').first;
    return OutlinedButton(
      onPressed: onTap,
      child: Align(
        alignment: Alignment.centerLeft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.labelSmall),
            Text(text, style: theme.textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
