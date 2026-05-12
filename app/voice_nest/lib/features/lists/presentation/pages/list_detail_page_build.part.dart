part of 'list_detail_page.dart';

extension _ListDetailPageBuildExtension on _ListDetailPageState {
  Widget _buildPage(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('List Details')),
      body: FutureBuilder<ContactList>(
        future: _listFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Unable to load list details.',
                  style: theme.textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final list = snapshot.data;
          if (list == null) {
            return const Center(child: Text('List not found'));
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                _buildHeader(theme, scheme, list),
                const SizedBox(height: 16),
                _buildContactsSection(theme, scheme, list),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(ThemeData theme, ColorScheme scheme, ContactList list) {
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            list.name,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StatChip(
                icon: Icons.people_alt_outlined,
                label: '$_contactsTotal contacts',
              ),
              if ((list.tag ?? '').trim().isNotEmpty)
                _StatChip(
                  icon: Icons.sell_outlined,
                  label: list.tag!.trim(),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContactsSection(ThemeData theme, ColorScheme scheme, ContactList list) {
    return _SectionCard(
      title: 'Contacts in this list',
      icon: Icons.groups_2_outlined,
      headerAction: IconButton.filledTonal(
        tooltip: 'Add contacts',
        onPressed: _busy ? null : () => _addContacts(list),
        icon: _busy
            ? const SizedBox.square(
                dimension: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.person_add_alt_1_rounded),
      ),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            decoration: const InputDecoration(
              hintText: 'Search contacts in this list',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 420,
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _contacts.isEmpty
                    ? Text(
                        _search.trim().isEmpty
                            ? 'No contacts added yet. Tap the + button to add contacts.'
                            : 'No contacts match this search.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      )
                    : ContactsGroupedListView(
                        contacts: _contacts,
                        controller: _scrollController,
                        hasMore: _hasMore,
                        loadingMore: _loadingMore,
                        padding: const EdgeInsets.fromLTRB(0, 0, 4, 8),
                        onTapContact: (contact) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ContactDetailPage(contactId: contact.id),
                            ),
                          );
                        },
                        trailingBuilder: (context, contact) => IconButton(
                          tooltip: 'Remove',
                          onPressed: _busy ? null : () => _removeContact(list, contact),
                          icon: const Icon(Icons.remove_circle_outline_rounded),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
