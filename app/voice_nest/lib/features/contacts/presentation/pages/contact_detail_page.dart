import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';

class ContactDetailPage extends ConsumerStatefulWidget {
  const ContactDetailPage({super.key, required this.contactId});

  final String contactId;

  @override
  ConsumerState<ContactDetailPage> createState() => _ContactDetailPageState();
}

class _ContactDetailPageState extends ConsumerState<ContactDetailPage> {
  late Future<ContactDetail> _detailFuture;
  bool _listActionBusy = false;
  bool _syncBusy = false;
  ContactDetail? _lastDetail;

  @override
  void initState() {
    super.initState();
    _detailFuture = _loadDetail();
  }

  Future<ContactDetail> _loadDetail() {
    return ref.read(apiClientProvider).getContactById(widget.contactId);
  }

  Future<void> _refreshDetail() async {
    final next = _loadDetail();
    if (mounted) {
      setState(() {
        _detailFuture = next;
      });
    }
    await next;
  }

  Future<void> _addToList(ContactDetail detail) async {
    if (_listActionBusy) {
      return;
    }
    final api = ref.read(apiClientProvider);
    final allLists = await api.getLists();
    final existingIds = detail.belongsToLists.map((list) => list.id).toSet();
    final available = allLists.where((list) => !existingIds.contains(list.id)).toList();
    if (!mounted) {
      return;
    }
    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contact already belongs to all available lists.')),
      );
      return;
    }

    final selectedList = await showModalBottomSheet<ContactList>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView.separated(
          shrinkWrap: true,
          itemCount: available.length,
          separatorBuilder: (context, index) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final list = available[index];
            return ListTile(
              leading: const Icon(Icons.list_alt_rounded),
              title: Text(list.name),
              subtitle: (list.tag != null && list.tag!.trim().isNotEmpty) ? Text(list.tag!) : null,
              onTap: () => Navigator.pop(context, list),
            );
          },
        ),
      ),
    );

    if (selectedList == null) {
      return;
    }

    setState(() => _listActionBusy = true);
    try {
      await api.addContactsToList(selectedList.id, [detail.contact.id]);
      await _refreshDetail();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Added to "${selectedList.name}"')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _listActionBusy = false);
      }
    }
  }

  Future<void> _removeFromList(ContactDetail detail, ContactListMembership membership) async {
    if (_listActionBusy) {
      return;
    }
    final shouldRemove = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove from list?'),
        content: Text('Remove this contact from "${membership.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (shouldRemove != true) {
      return;
    }
    setState(() => _listActionBusy = true);
    try {
      await ref.read(apiClientProvider).removeContactFromList(membership.id, detail.contact.id);
      await _refreshDetail();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Removed from "${membership.name}"')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _listActionBusy = false);
      }
    }
  }

  Future<void> _syncToExotel(ContactDetail detail) async {
    final isSynced = (detail.contact.exotelSid ?? '').trim().isNotEmpty;
    if (_syncBusy || isSynced) {
      return;
    }
    setState(() => _syncBusy = true);
    try {
      await ref.read(apiClientProvider).syncContactToExotel(detail.contact.id);
      await _refreshDetail();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contact synced to Exotel successfully.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync failed: ${_errorText(error)}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _syncBusy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact Detail'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'sync_exotel') {
                final detail = _lastDetail;
                if (detail == null) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Contact details are still loading. Please try again.')),
                    );
                  }
                  return;
                }
                await _syncToExotel(detail);
              }
            },
            itemBuilder: (context) {
              final detail = _lastDetail;
              final isSynced = ((detail?.contact.exotelSid) ?? '').trim().isNotEmpty;
              return [
                PopupMenuItem(
                  value: 'sync_exotel',
                  enabled: detail != null && !isSynced && !_syncBusy,
                  child: Row(
                    children: [
                      if (_syncBusy)
                        const SizedBox.square(
                          dimension: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      else
                        const Icon(Icons.sync_rounded, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        detail == null
                            ? 'Loading...'
                            : (isSynced ? 'Already synced to Exotel' : 'Sync to Exotel'),
                      ),
                    ],
                  ),
                ),
              ];
            },
          ),
        ],
      ),
      body: FutureBuilder(
        future: _detailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 38),
                    const SizedBox(height: 10),
                    Text(
                      'Unable to load contact details.',
                      style: Theme.of(context).textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          final detail = snapshot.data;
          if (detail == null) {
            return const Center(child: Text('Contact not found'));
          }
          _lastDetail = detail;
          final contact = detail.contact;
          final isSynced = (contact.exotelSid ?? '').trim().isNotEmpty;

          final theme = Theme.of(context);
          final scheme = theme.colorScheme;
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
                      child: Text(
                        (contact.firstName.isNotEmpty
                                ? contact.firstName[0]
                                : contact.phoneNo[0])
                            .toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 22,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            contact.fullName.isEmpty ? 'Unnamed contact' : contact.fullName,
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            contact.phoneNo,
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
              const SizedBox(height: 16),
              _SectionCard(
                title: 'Belongs to Lists',
                icon: Icons.format_list_bulleted_rounded,
                headerAction: isSynced
                    ? IconButton(
                        tooltip: 'Add to list',
                        visualDensity: VisualDensity.compact,
                        onPressed: _listActionBusy ? null : () => _addToList(detail),
                        icon: _listActionBusy
                            ? const SizedBox.square(
                                dimension: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.add_rounded),
                      )
                    : null,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isSynced)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: scheme.errorContainer.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: scheme.error.withValues(alpha: 0.25)),
                        ),
                        child: Text(
                          'Sync this contact to Exotel first. Then Add to list will be available.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: scheme.onErrorContainer,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    if (!isSynced) const SizedBox(height: 8),
                    if (detail.belongsToLists.isEmpty)
                      Text(
                        'This contact is not assigned to any list yet.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      )
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: detail.belongsToLists
                            .map(
                              (list) => InputChip(
                                label: Text(
                                  list.tag != null && list.tag!.trim().isNotEmpty
                                      ? '${list.name} • ${list.tag}'
                                      : list.name,
                                ),
                                avatar: const Icon(Icons.list_alt_rounded, size: 18),
                                onDeleted: _listActionBusy
                                    ? null
                                    : () => _removeFromList(detail, list),
                                deleteIcon: const Icon(Icons.close_rounded, size: 18),
                              ),
                            )
                            .toList(),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Contact Info',
                icon: Icons.badge_outlined,
                child: Column(
                  children: [
                    _DetailRow(label: 'First name', value: contact.firstName),
                    _DetailRow(label: 'Last name', value: contact.lastName),
                    _DetailRow(label: 'Phone number', value: contact.phoneNo),
                    _DetailRow(label: 'Email', value: contact.email),
                    _DetailRow(label: 'Tag', value: contact.tag),
                    _DetailRow(label: 'Created', value: _formatDate(contact.createdAt)),
                    _DetailRow(label: 'Updated', value: _formatDate(contact.updatedAt)),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.icon,
    required this.child,
    this.headerAction,
  });

  final String title;
  final IconData icon;
  final Widget child;
  final Widget? headerAction;

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
              const Spacer(),
              ...(headerAction == null ? const <Widget>[] : <Widget>[headerAction!]),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null && value!.trim().isNotEmpty;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 112,
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
              hasValue ? value!.trim() : '-',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

String? _formatDate(DateTime? date) {
  if (date == null) {
    return null;
  }
  final local = date.toLocal();
  final month = local.month.toString().padLeft(2, '0');
  final day = local.day.toString().padLeft(2, '0');
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '${local.year}-$month-$day $hour:$minute';
}

String _errorText(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message']?.toString() ?? data['error']?.toString();
      if (message != null && message.trim().isNotEmpty) {
        return message.trim();
      }
    }
    if ((error.message ?? '').trim().isNotEmpty) {
      return error.message!.trim();
    }
  }
  final text = error.toString().trim();
  if (text.startsWith('Exception:')) {
    return text.replaceFirst('Exception:', '').trim();
  }
  return text;
}
