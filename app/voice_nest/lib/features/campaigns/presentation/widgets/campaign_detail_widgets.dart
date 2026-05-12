import 'package:flutter/material.dart';

import '../../domain/campaign_detail_models.dart';

class CampaignOverviewTab extends StatelessWidget {
  const CampaignOverviewTab({super.key, required this.campaign});

  final CampaignDetail campaign;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final fields = <MapEntry<String, String>>[
      MapEntry('Campaign Type', campaign.campaignType),
      MapEntry('Flow Type', campaign.flowType),
      MapEntry('Caller ID', campaign.callerPhoneNo.isEmpty ? '-' : campaign.callerPhoneNo),
      MapEntry('Lists', campaign.listNames.isEmpty ? '-' : campaign.listNames.join(', ')),
      MapEntry('Read Via Text', campaign.readViaText.isEmpty ? '-' : campaign.readViaText),
      MapEntry('Retry Count', campaign.retryCount?.toString() ?? '-'),
      MapEntry('Schedule Start', _formatDateTime(campaign.scheduleSendAt)),
      MapEntry('Schedule End', _formatDateTime(campaign.scheduleEndAt)),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                scheme.primary.withValues(alpha: 0.92),
                scheme.primaryContainer.withValues(alpha: 0.9),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Colors.white.withValues(alpha: 0.18),
                child: const Icon(Icons.campaign_outlined, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      campaign.name.isEmpty ? 'Campaign' : campaign.name,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      campaign.status,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _SectionContainer(
          title: 'Campaign Info',
          icon: Icons.info_outline,
          child: Column(
            children: fields
                .map((item) => CampaignDetailRow(label: item.key, value: item.value))
                .toList(),
          ),
        ),
      ],
    );
  }
}

String _formatDateTime(String value) {
  if (value.isEmpty) return '-';
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  return '${date.toLocal()}'.split('.').first;
}

class _SectionContainer extends StatelessWidget {
  const _SectionContainer({required this.title, required this.icon, required this.child});

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: scheme.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class CampaignDetailRow extends StatelessWidget {
  const CampaignDetailRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              value.trim().isEmpty ? '-' : value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
