import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/app_providers.dart';
import '../../../../shared/providers/list_campaign_refresh.dart';
import 'list_detail_page.dart';

class ListsPage extends ConsumerWidget {
  const ListsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listState = ref.watch(listsProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showListDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('New List'),
      ),
      body: listState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => LayoutBuilder(
          builder: (context, constraints) => RefreshIndicator(
            onRefresh: () => refreshLists(ref),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Center(child: Text(error.toString())),
              ),
            ),
          ),
        ),
        data: (lists) {
          Future<void> onRefresh() => refreshLists(ref);
          if (lists.isEmpty) {
            return LayoutBuilder(
              builder: (context, constraints) => RefreshIndicator(
                onRefresh: onRefresh,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: const Center(child: Text('No lists yet.')),
                  ),
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              itemCount: lists.length,
              itemBuilder: (context, index) {
                final list = lists[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsetsDirectional.only(
                      start: 16,
                      end: 4,
                      top: 8,
                      bottom: 8,
                    ),
                    title: Text(list.name),
                    subtitle: Text('Tag: ${list.tag ?? '-'} • Contacts: ${list.contacts.length}'),
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ListDetailPage(listId: list.id),
                        ),
                      );
                      ref.invalidate(listsProvider);
                    },
                    trailing: PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      icon: const Icon(Icons.more_vert),
                      tooltip: 'Actions',
                      onSelected: (value) async {
                        if (value == 'delete') {
                          await ref.read(apiClientProvider).deleteList(list.id);
                          ref.invalidate(listsProvider);
                        }
                      },
                      itemBuilder: (context) => const [
                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

Future<void> _showListDialog(BuildContext context, WidgetRef ref) async {
  final name = TextEditingController();
  final tag = TextEditingController();
  bool sync = true;

  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Create List'),
      content: StatefulBuilder(
        builder: (context, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
            TextField(controller: tag, decoration: const InputDecoration(labelText: 'Tag')),
            CheckboxListTile(
              value: sync,
              onChanged: (value) => setState(() => sync = value ?? true),
              title: const Text('Sync to Exotel'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(
          onPressed: () async {
            await ref.read(apiClientProvider).createList({
              'name': name.text.trim(),
              'tag': tag.text.trim(),
              'sync_to_exotel': sync,
            });
            ref.invalidate(listsProvider);
            if (context.mounted) {
              Navigator.pop(context);
            }
          },
          child: const Text('Save'),
        ),
      ],
    ),
  );
}

