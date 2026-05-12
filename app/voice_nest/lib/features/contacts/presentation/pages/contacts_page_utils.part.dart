// ignore_for_file: invalid_use_of_protected_member

part of 'contacts_page.dart';

extension _ContactsPageUiHelpers on _ContactsPageState {
  Widget _buildFab() {
    return ExpandableActionFab(label: 'Action', icon: Icons.tune, items: [
      ExpandableActionItem(label: 'Add', icon: Icons.person_add_alt_1, onTap: () async {
        final created = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const CreateContactPage()));
        if (created == true) await _loadInitial();
      }),
      ExpandableActionItem(label: _selectionMode ? 'Done selecting' : 'Select contacts', icon: _selectionMode ? Icons.close_fullscreen : Icons.checklist, onTap: () => _setSelectionMode(!_selectionMode)),
      ExpandableActionItem(label: 'Import CSV', icon: Icons.upload_file_outlined, onTap: _pickAndImportCsvFile, enabled: !_busy),
      ExpandableActionItem(label: 'Sync my contacts', icon: Icons.contacts_outlined, onTap: _syncPhoneContacts, enabled: !_busy),
      ExpandableActionItem(label: 'Download template', icon: Icons.download_for_offline_outlined, onTap: _downloadTemplateCsvFile, enabled: !_busy),
      ExpandableActionItem(label: 'Export (${_selectedIds.length})', icon: Icons.file_download_outlined, onTap: _exportSelected, enabled: _selectionMode && _selectedIds.isNotEmpty && !_busy),
      ExpandableActionItem(label: 'Delete (${_selectedIds.length})', icon: Icons.delete_outline, onTap: _deleteSelected, enabled: _selectionMode && _selectedIds.isNotEmpty && !_busy),
    ]);
  }

  Widget _buildBottomSearchBar(ColorScheme scheme) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        decoration: BoxDecoration(color: scheme.surface, border: Border(top: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.45)))),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search contacts',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                filled: true,
                fillColor: scheme.surfaceContainerLow,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filledTonal(onPressed: _openTagFilterSheet, icon: const Icon(Icons.filter_alt_outlined)),
        ]),
      ),
    );
  }

  Widget _buildSelectionHeader(bool allSelected) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
        child: Row(children: [
          Expanded(
            child: CheckboxListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 8),
              value: allSelected,
              onChanged: (v) => setState(() {
                _selectedIds.clear();
                if (v == true) _selectedIds.addAll(_contacts.map((c) => c.id));
              }),
              title: Text('Selected ${_selectedIds.length}'),
            ),
          ),
          TextButton(onPressed: () => _setSelectionMode(false), child: const Text('Done')),
        ]),
      );

  Widget _buildTagChip() => Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
        child: Align(
          alignment: Alignment.centerLeft,
          child: Chip(
            label: Text('Tag: $_tag'),
            onDeleted: () async {
              setState(() => _tag = '');
              await _loadContacts(reset: true);
            },
          ),
        ),
      );
}

String _csv(String value) {
  if (value.contains(',') || value.contains('"') || value.contains('\n')) {
    return '"${value.replaceAll('"', '""')}"';
  }
  return value;
}

String? _normalizePhone(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;
  final hasPlusPrefix = trimmed.startsWith('+');
  final digitsOnly = trimmed.replaceAll(RegExp(r'[^0-9]'), '');
  if (digitsOnly.isEmpty || digitsOnly.length < 8) return null;
  return hasPlusPrefix ? '+$digitsOnly' : digitsOnly;
}

extension on List<String> {
  String? get firstOrNull => isEmpty ? null : first;
}
