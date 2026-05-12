import 'package:flutter/material.dart';

import '../../../../shared/models/app_models.dart';
import '../create_campaign_models.dart';
import 'create_campaign_section.dart';

class CreateCampaignContentSection extends StatelessWidget {
  const CreateCampaignContentSection({
    required this.contentMode,
    required this.readTextController,
    required this.flows,
    required this.selectedFlowId,
    required this.exophones,
    required this.selectedCallerId,
    required this.callTypeTrans,
    required this.onContentModeChanged,
    required this.onFlowChanged,
    required this.onCallerIdChanged,
    required this.onCallTypeTransChanged,
    super.key,
  });

  final CreateContentMode contentMode;
  final TextEditingController readTextController;
  final List<AppFlow> flows;
  final String? selectedFlowId;
  final List<Exophone> exophones;
  final String? selectedCallerId;
  final bool callTypeTrans;
  final ValueChanged<CreateContentMode> onContentModeChanged;
  final ValueChanged<String?> onFlowChanged;
  final ValueChanged<String?> onCallerIdChanged;
  final ValueChanged<bool> onCallTypeTransChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wide = MediaQuery.sizeOf(context).width >= 520;
    return CreateCampaignSection(
      title: 'Choose your content',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SegmentedButton<CreateContentMode>(
            segments: const [
              ButtonSegment(value: CreateContentMode.readText, label: Text('Text')),
              ButtonSegment(value: CreateContentMode.selectFlow, label: Text('Flow')),
              ButtonSegment(
                value: CreateContentMode.createIvr,
                label: Text('IVR'),
                tooltip: 'Coming soon',
                enabled: false,
              ),
            ],
            selected: {contentMode},
            onSelectionChanged: (s) {
              final next = s.first;
              if (next == CreateContentMode.createIvr) return;
              onContentModeChanged(next);
            },
          ),
          const SizedBox(height: 10),
          if (contentMode == CreateContentMode.readText) ...[
            TextField(
              controller: readTextController,
              minLines: 4,
              maxLines: 8,
              decoration: const InputDecoration(
                labelText: 'Read-out text',
                hintText: 'Use @@ColumnName for CSV variables (Exotel)',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
              ),
            ),
          ] else if (flows.isEmpty)
            Text('No flows yet. Add one from the drawer → Flows.', style: theme.textTheme.bodySmall)
          else
            DropdownButtonFormField<String>(
              value: selectedFlowId,
              isExpanded: true,
              hint: const Text('Select a flow'),
              decoration: const InputDecoration(labelText: 'ExoML flow', border: OutlineInputBorder()),
              items: flows
                  .map(
                    (f) => DropdownMenuItem<String>(
                      value: f.id,
                      child: Text('${f.name} (${f.appId})', overflow: TextOverflow.ellipsis),
                    ),
                  )
                  .toList(),
              onChanged: onFlowChanged,
            ),
          const SizedBox(height: 12),
          if (wide)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _callerField()),
                const SizedBox(width: 12),
                Expanded(child: _callType(theme)),
              ],
            )
          else ...[
            _callerField(),
            const SizedBox(height: 10),
            _callType(theme),
          ],
        ],
      ),
    );
  }

  Widget _callerField() {
    return DropdownButtonFormField<String>(
      value: selectedCallerId,
      isExpanded: true,
      hint: const Text('Select Caller ID'),
      decoration: const InputDecoration(
        labelText: '* Caller ID',
        border: OutlineInputBorder(),
      ),
      items: exophones
          .map(
            (e) => DropdownMenuItem<String>(
              value: e.id,
              child: Text('${e.name} (${e.phoneNo})', overflow: TextOverflow.ellipsis),
            ),
          )
          .toList(),
      onChanged: onCallerIdChanged,
    );
  }

  Widget _callType(ThemeData theme) {
    return InputDecorator(
      decoration: const InputDecoration(
        labelText: 'Call type',
        border: OutlineInputBorder(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RadioListTile<bool>(
            contentPadding: EdgeInsets.zero,
            dense: true,
            title: const Text('Transactional'),
            value: true,
            groupValue: callTypeTrans,
            onChanged: (_) => onCallTypeTransChanged(true),
          ),
          Tooltip(
            message: 'Enable when your Exotel account supports promotional dialers.',
            child: RadioListTile<bool>(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: Text('Promotional', style: TextStyle(color: theme.disabledColor)),
              value: false,
              groupValue: callTypeTrans,
              onChanged: null,
            ),
          ),
        ],
      ),
    );
  }
}
