import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_flows.dart';
import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';
import '../widgets/flow_card.dart';
import '../widgets/flow_form_dialog.dart';

class FlowsPage extends ConsumerWidget {
  const FlowsPage({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(flowsProvider);
    await ref.read(flowsProvider.future);
  }

  Future<void> _confirmAndDelete(BuildContext context, WidgetRef ref, AppFlow flow) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete flow?'),
        content: Text('"${flow.name}" will be removed from your local app.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton.tonal(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiClientProvider).deleteFlow(flow.id);
      ref.invalidate(flowsProvider);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(flowsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Flows')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showFlowFormDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('New Flow'),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => LayoutBuilder(
          builder: (context, constraints) => RefreshIndicator(
            onRefresh: () => _refresh(ref),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Center(child: Text(error.toString())),
              ),
            ),
          ),
        ),
        data: (flows) {
          if (flows.isEmpty) {
            return LayoutBuilder(
              builder: (context, constraints) => RefreshIndicator(
                onRefresh: () => _refresh(ref),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No flows yet.\nTap "New Flow" to add an Exotel App Bazaar flow.',
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () => _refresh(ref),
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              itemCount: flows.length,
              itemBuilder: (context, index) {
                final flow = flows[index];
                return FlowCard(
                  flow: flow,
                  onEdit: () => showFlowFormDialog(context, ref, existing: flow),
                  onDelete: () => _confirmAndDelete(context, ref, flow),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
