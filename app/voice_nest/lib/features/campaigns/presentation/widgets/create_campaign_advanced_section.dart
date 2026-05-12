import 'package:flutter/material.dart';

import 'create_campaign_callbacks_block.dart';
import 'create_campaign_retry_controls.dart';
import 'create_campaign_section.dart';

class CreateCampaignAdvancedSection extends StatelessWidget {
  const CreateCampaignAdvancedSection({
    required this.retryCount,
    required this.intervalController,
    required this.mechanism,
    required this.retryBusy,
    required this.retryNoAnswer,
    required this.retryFailed,
    required this.callDuplicates,
    required this.throttleAuto,
    required this.throttleCpmController,
    required this.statusCallbackController,
    required this.callStatusCallbackController,
    required this.callScheduleCallbackController,
    required this.customFieldController,
    required this.repeatMenuController,
    required this.syncToExotel,
    required this.onRetryCountChanged,
    required this.onMechanismChanged,
    required this.onRetryBusy,
    required this.onRetryNoAnswer,
    required this.onRetryFailed,
    required this.onCallDuplicatesChanged,
    required this.onThrottleAutoChanged,
    required this.onSyncChanged,
    super.key,
  });

  final int retryCount;
  final TextEditingController intervalController;
  final String mechanism;
  final bool retryBusy;
  final bool retryNoAnswer;
  final bool retryFailed;
  final bool callDuplicates;
  final bool throttleAuto;
  final TextEditingController throttleCpmController;
  final TextEditingController statusCallbackController;
  final TextEditingController callStatusCallbackController;
  final TextEditingController callScheduleCallbackController;
  final TextEditingController customFieldController;
  final TextEditingController repeatMenuController;
  final bool syncToExotel;
  final ValueChanged<int> onRetryCountChanged;
  final ValueChanged<String?> onMechanismChanged;
  final ValueChanged<bool> onRetryBusy;
  final ValueChanged<bool> onRetryNoAnswer;
  final ValueChanged<bool> onRetryFailed;
  final ValueChanged<bool> onCallDuplicatesChanged;
  final ValueChanged<bool> onThrottleAutoChanged;
  final ValueChanged<bool?> onSyncChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wide = MediaQuery.sizeOf(context).width >= 560;
    final mechEnabled = retryCount > 0;
    return CreateCampaignSection(
      title: 'Additional information',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Number of retries', style: theme.textTheme.labelLarge),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [0, 1, 2, 3]
                .map(
                  (n) => ChoiceChip(
                    label: Text('$n'),
                    selected: retryCount == n,
                    onSelected: (sel) {
                      if (sel) onRetryCountChanged(n);
                    },
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12),
          CreateCampaignRetryControls(
            wide: wide,
            intervalController: intervalController,
            mechanism: mechanism,
            mechEnabled: mechEnabled,
            onMechanismChanged: onMechanismChanged,
          ),
          const SizedBox(height: 8),
          Text('Retry calls with status', style: theme.textTheme.labelLarge),
          Wrap(
            spacing: 4,
            children: [
              FilterChip(
                label: const Text('Busy'),
                selected: retryBusy,
                onSelected: onRetryBusy,
              ),
              FilterChip(
                label: const Text('No answer'),
                selected: retryNoAnswer,
                onSelected: onRetryNoAnswer,
              ),
              FilterChip(
                label: const Text('Failed'),
                selected: retryFailed,
                onSelected: onRetryFailed,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text('Call duplicate numbers', style: theme.textTheme.labelLarge),
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Yes')),
              ButtonSegment(value: false, label: Text('No')),
            ],
            selected: {callDuplicates},
            onSelectionChanged: (s) => onCallDuplicatesChanged(s.first),
          ),
          const SizedBox(height: 12),
          Text('Campaign throttle', style: theme.textTheme.labelLarge),
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Auto')),
              ButtonSegment(value: false, label: Text('Custom CPM')),
            ],
            selected: {throttleAuto},
            onSelectionChanged: (s) => onThrottleAutoChanged(s.first),
          ),
          if (!throttleAuto) ...[
            const SizedBox(height: 8),
            TextField(
              controller: throttleCpmController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Calls per minute',
                border: OutlineInputBorder(),
              ),
            ),
          ],
          const SizedBox(height: 12),
          CreateCampaignCallbacksBlock(
            wide: wide,
            statusCallbackController: statusCallbackController,
            callStatusCallbackController: callStatusCallbackController,
            callScheduleCallbackController: callScheduleCallbackController,
            customFieldController: customFieldController,
            repeatMenuController: repeatMenuController,
            syncToExotel: syncToExotel,
            onSyncChanged: onSyncChanged,
          ),
        ],
      ),
    );
  }
}
