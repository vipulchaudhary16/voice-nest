import 'package:flutter/material.dart';

class CreateCampaignCallbacksBlock extends StatelessWidget {
  const CreateCampaignCallbacksBlock({
    required this.wide,
    required this.statusCallbackController,
    required this.callStatusCallbackController,
    required this.callScheduleCallbackController,
    required this.customFieldController,
    required this.repeatMenuController,
    required this.syncToExotel,
    required this.onSyncChanged,
    super.key,
  });

  final bool wide;
  final TextEditingController statusCallbackController;
  final TextEditingController callStatusCallbackController;
  final TextEditingController callScheduleCallbackController;
  final TextEditingController customFieldController;
  final TextEditingController repeatMenuController;
  final bool syncToExotel;
  final ValueChanged<bool?> onSyncChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (wide)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: statusCallbackController,
                  decoration: const InputDecoration(
                    labelText: 'Campaign status callback URL',
                    hintText: 'https://…',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: callStatusCallbackController,
                  decoration: const InputDecoration(
                    labelText: 'Call status callback URL',
                    hintText: 'https://…',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          )
        else ...[
          TextField(
            controller: statusCallbackController,
            decoration: const InputDecoration(
              labelText: 'Campaign status callback URL',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: callStatusCallbackController,
            decoration: const InputDecoration(
              labelText: 'Call status callback URL',
              border: OutlineInputBorder(),
            ),
          ),
        ],
        const SizedBox(height: 8),
        TextField(
          controller: callScheduleCallbackController,
          decoration: const InputDecoration(
            labelText: 'Call schedule callback URL (after retries)',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: customFieldController,
          decoration: const InputDecoration(
            labelText: 'Custom field (metadata)',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: repeatMenuController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'IVR repeat menu attempts',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: syncToExotel,
          onChanged: onSyncChanged,
          title: const Text('Sync to Exotel when creating'),
          subtitle: const Text('Uncheck to save locally only (no outbound dial).'),
        ),
      ],
    );
  }
}
