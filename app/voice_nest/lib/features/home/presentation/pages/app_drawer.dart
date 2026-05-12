import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/app_providers.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({
    super.key,
    required this.onSelect,
    required this.onOpenFlows,
  });

  final ValueChanged<int> onSelect;
  final VoidCallback onOpenFlows;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider).valueOrNull;
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(session?.name ?? 'User'),
              accountEmail: Text(session?.email ?? '-'),
            ),
            ListTile(
              leading: const Icon(Icons.people_alt_outlined),
              title: const Text('Contacts'),
              onTap: () => onSelect(0),
            ),
            ListTile(
              leading: const Icon(Icons.view_list_outlined),
              title: const Text('Lists'),
              onTap: () => onSelect(1),
            ),
            ListTile(
              leading: const Icon(Icons.campaign_outlined),
              title: const Text('Campaigns'),
              onTap: () => onSelect(2),
            ),
            ListTile(
              leading: const Icon(Icons.account_tree_outlined),
              title: const Text('Flows'),
              onTap: onOpenFlows,
            ),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('Profile'),
              onTap: () => onSelect(3),
            ),
            const Spacer(),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Logout'),
              onTap: () => ref.read(sessionControllerProvider.notifier).logout(),
            ),
          ],
        ),
      ),
    );
  }
}
