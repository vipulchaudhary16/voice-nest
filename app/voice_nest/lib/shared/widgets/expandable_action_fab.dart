import 'package:flutter/material.dart';

class ExpandableActionItem {
  const ExpandableActionItem({
    required this.label,
    required this.icon,
    required this.onTap,
    this.enabled = true,
    this.subtitle,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool enabled;
  final String? subtitle;
}

class ExpandableActionFab extends StatefulWidget {
  const ExpandableActionFab({
    super.key,
    required this.items,
    this.label = 'Action',
    this.icon = Icons.tune,
    this.sheetTitle = 'Actions',
  });

  final List<ExpandableActionItem> items;
  final String label;
  final IconData icon;
  final String sheetTitle;

  @override
  State<ExpandableActionFab> createState() => _ExpandableActionFabState();
}

class _ExpandableActionFabState extends State<ExpandableActionFab> {
  Future<void> _openActionsSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final theme = Theme.of(context);
        final scheme = theme.colorScheme;
        final maxHeight = MediaQuery.of(context).size.height * 0.75;
        return SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxHeight),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(6, 2, 6, 10),
                    child: Text(
                      widget.sheetTitle,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: widget.items.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final item = widget.items[index];
                        final enabled = item.enabled;
                        return Material(
                          color: enabled
                              ? scheme.surfaceContainerLow
                              : scheme.surfaceContainerLow.withValues(alpha: 0.55),
                          borderRadius: BorderRadius.circular(16),
                          child: ListTile(
                            enabled: enabled,
                            leading: Icon(item.icon),
                            title: Text(item.label),
                            subtitle: item.subtitle == null ? null : Text(item.subtitle!),
                            onTap: enabled
                                ? () {
                                    Navigator.pop(context);
                                    item.onTap();
                                  }
                                : null,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.extended(
      heroTag: 'expandable_action_fab_root',
      onPressed: _openActionsSheet,
      icon: Icon(widget.icon),
      label: Text(widget.label),
    );
  }
}
