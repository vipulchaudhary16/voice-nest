import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_flows.dart';
import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';

Future<bool?> showFlowFormDialog(
  BuildContext context,
  WidgetRef ref, {
  AppFlow? existing,
}) {
  final nameController = TextEditingController(text: existing?.name ?? '');
  final appIdController = TextEditingController(text: existing?.appId ?? '');
  final tagsController = TextEditingController(
    text: existing == null ? '' : existing.tags.join(', '),
  );
  final isEdit = existing != null;

  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(isEdit ? 'Edit Flow' : 'Create Flow'),
      content: StatefulBuilder(
        builder: (context, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Name'),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: appIdController,
              decoration: const InputDecoration(
                labelText: 'App ID',
                helperText: 'From Exotel → App Bazaar → Installed Apps',
              ),
              keyboardType: TextInputType.text,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: tagsController,
              decoration: const InputDecoration(
                labelText: 'Tags',
                helperText: 'Comma-separated, e.g. onboarding, welcome',
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () async {
            final name = nameController.text.trim();
            final appId = appIdController.text.trim();
            if (name.isEmpty || appId.isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Name and App ID are required')),
              );
              return;
            }
            final tags = tagsController.text
                .split(',')
                .map((t) => t.trim())
                .where((t) => t.isNotEmpty)
                .toList();
            final payload = {'name': name, 'app_id': appId, 'tags': tags};
            final api = ref.read(apiClientProvider);
            try {
              if (isEdit) {
                await api.updateFlow(existing.id, payload);
              } else {
                await api.createFlow(payload);
              }
              ref.invalidate(flowsProvider);
              if (context.mounted) Navigator.pop(context, true);
            } catch (e) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to save flow: $e')),
              );
            }
          },
          child: Text(isEdit ? 'Save' : 'Create'),
        ),
      ],
    ),
  );
}
