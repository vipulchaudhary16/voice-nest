import 'package:flutter/material.dart';

import '../../../../shared/models/app_models.dart';
import 'contacts_alphabet_index_bar.dart';
import 'contacts_grouping_utils.dart';
import 'contacts_section_scroller.dart';

typedef ContactSelectionToggle = void Function(String contactId, bool selected);
typedef ContactTrailingBuilder = Widget? Function(BuildContext context, Contact contact);

class ContactsGroupedListView extends StatefulWidget {
  const ContactsGroupedListView({
    super.key,
    required this.contacts,
    required this.controller,
    required this.hasMore,
    required this.loadingMore,
    this.selectionMode = false,
    this.selectedIds = const <String>{},
    this.onSelectionToggle,
    this.onTapContact,
    this.trailingBuilder,
    this.padding = const EdgeInsets.fromLTRB(12, 4, 8, 88),
  });

  final List<Contact> contacts;
  final ScrollController controller;
  final bool hasMore;
  final bool loadingMore;
  final bool selectionMode;
  final Set<String> selectedIds;
  final ContactSelectionToggle? onSelectionToggle;
  final ValueChanged<Contact>? onTapContact;
  final ContactTrailingBuilder? trailingBuilder;
  final EdgeInsetsGeometry padding;

  @override
  State<ContactsGroupedListView> createState() => _ContactsGroupedListViewState();
}

class _ContactsGroupedListViewState extends State<ContactsGroupedListView> {
  final Map<String, GlobalKey> _sectionKeys = <String, GlobalKey>{};
  late final ContactsSectionScroller _scroller = ContactsSectionScroller(
    controller: widget.controller,
    padding: widget.padding,
    sectionKeys: _sectionKeys,
  );

  void _syncSectionKeys(Set<String> headers) {
    _sectionKeys.removeWhere((k, _) => !headers.contains(k));
    for (final h in headers) {
      _sectionKeys.putIfAbsent(h, GlobalKey.new);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rows = groupedRowsFromContacts(widget.contacts);
    final headers = {for (final r in rows) if (r.isHeader) r.header!};
    _syncSectionKeys(headers);
    _scroller.rebuildEstimatedOffsets(rows);

    final scheme = Theme.of(context).colorScheme;
    final list = ListView.builder(
      controller: widget.controller,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: widget.padding,
      itemCount: rows.length + (widget.hasMore || widget.loadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= rows.length) {
          return widget.loadingMore
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Center(child: CircularProgressIndicator()),
                )
              : const SizedBox(height: 24);
        }
        final row = rows[index];
        if (row.isHeader) {
          final key = _sectionKeys[row.header!]!;
          return Padding(
            key: key,
            padding: const EdgeInsets.fromLTRB(6, 10, 6, 4),
            child: Text(
              row.header!,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.3,
                    color: scheme.primary,
                  ),
            ),
          );
        }
        final contact = row.contact!;
        final isSelected = widget.selectedIds.contains(contact.id);
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 5),
          elevation: 0.5,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            leading: widget.selectionMode
                ? Checkbox(
                    value: isSelected,
                    onChanged: widget.onSelectionToggle == null
                        ? null
                        : (value) => widget.onSelectionToggle!(contact.id, value == true),
                  )
                : CircleAvatar(
                    backgroundColor: scheme.primaryContainer.withOpacity(0.65),
                    foregroundColor: scheme.onPrimaryContainer,
                    child: Text(
                      (contact.firstName.isNotEmpty ? contact.firstName[0] : contact.phoneNo[0])
                          .toUpperCase(),
                    ),
                  ),
            title: Text(contact.fullName.isEmpty ? 'Unnamed contact' : contact.fullName),
            subtitle: Text(contact.phoneNo),
            onTap: widget.selectionMode || widget.onTapContact == null
                ? null
                : () => widget.onTapContact!(contact),
            trailing: widget.trailingBuilder?.call(context, contact),
          ),
        );
      },
    );

    if (widget.selectionMode || rows.isEmpty) {
      return list;
    }

    // Row (not Stack) so the list stays a normal flex scrollable under RefreshIndicator.
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: list),
        Padding(
          padding: const EdgeInsets.only(right: 2, top: 8, bottom: 96),
          child: ContactsAlphabetIndexBar(
            activeLetters: headers,
            onLetter: _scroller.scrollToSection,
          ),
        ),
      ],
    );
  }
}
