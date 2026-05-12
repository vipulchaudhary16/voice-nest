// ignore_for_file: invalid_use_of_protected_member

part of 'contacts_page.dart';

extension _ContactsPageBuildExtension on _ContactsPageState {
  Widget _buildPage(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final allSelected = _selectionMode && _contacts.isNotEmpty && _selectedIds.length == _contacts.length;

    return Scaffold(
      floatingActionButton: _buildFab(),
      bottomNavigationBar: _buildBottomSearchBar(scheme),
      body: Column(
        children: [
          if (_selectionMode) _buildSelectionHeader(allSelected),
          if (!_selectionMode && _tag.isNotEmpty) _buildTagChip(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _contacts.isEmpty
                    ? const Center(child: Text('No contacts found.'))
                    : RefreshIndicator(onRefresh: _loadInitial, child: _buildContactsList()),
          ),
        ],
      ),
    );
  }

  Widget _buildContactsList() {
    return ContactsGroupedListView(
      contacts: _contacts,
      controller: _scrollController,
      hasMore: _hasMore,
      loadingMore: _loadingMore,
      selectionMode: _selectionMode,
      selectedIds: _selectedIds,
      onSelectionToggle: (contactId, selected) {
        setState(() {
          if (selected) {
            _selectedIds.add(contactId);
          } else {
            _selectedIds.remove(contactId);
          }
        });
      },
      onTapContact: (contact) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ContactDetailPage(contactId: contact.id)),
        );
      },
      trailingBuilder: (context, contact) => PopupMenuButton<String>(
        onSelected: (value) async {
          if (value == 'edit') {
            final updated = await Navigator.of(context).push<bool>(
              MaterialPageRoute(builder: (_) => CreateContactPage(initialContact: contact)),
            );
            if (updated == true) {
              await _loadInitial();
            }
          }
          if (value == 'delete') {
            await ref.read(apiClientProvider).deleteContact(contact.id);
            await _loadInitial();
          }
        },
        itemBuilder: (_) => const [
          PopupMenuItem(value: 'edit', child: Text('Edit')),
          PopupMenuItem(value: 'delete', child: Text('Delete')),
        ],
      ),
    );
  }
}
