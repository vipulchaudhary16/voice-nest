import 'package:flutter/material.dart';

class CreateCampaignRetryControls extends StatelessWidget {
  const CreateCampaignRetryControls({
    required this.wide,
    required this.intervalController,
    required this.mechanism,
    required this.mechEnabled,
    required this.onMechanismChanged,
    super.key,
  });

  final bool wide;
  final TextEditingController intervalController;
  final String mechanism;
  final bool mechEnabled;
  final ValueChanged<String?> onMechanismChanged;

  @override
  Widget build(BuildContext context) {
    final intervalField = TextField(
      controller: intervalController,
      keyboardType: TextInputType.number,
      decoration: const InputDecoration(
        labelText: 'Retry interval (min)',
        border: OutlineInputBorder(),
      ),
    );
    final mechField = DropdownButtonFormField<String>(
      value: mechanism,
      decoration: const InputDecoration(
        labelText: 'Retry mechanism',
        border: OutlineInputBorder(),
      ),
      items: const [
        DropdownMenuItem(value: 'Linear', child: Text('Linear')),
        DropdownMenuItem(value: 'Exponential', child: Text('Exponential')),
      ],
      onChanged: mechEnabled ? onMechanismChanged : null,
    );
    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: intervalField),
          const SizedBox(width: 10),
          Expanded(child: mechField),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        intervalField,
        const SizedBox(height: 10),
        mechField,
      ],
    );
  }
}
