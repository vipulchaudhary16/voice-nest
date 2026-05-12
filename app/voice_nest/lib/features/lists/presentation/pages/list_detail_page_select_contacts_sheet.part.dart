part of 'list_detail_page.dart';

class _SelectContactsSheet extends ConsumerStatefulWidget {
  const _SelectContactsSheet({required this.existingContactIds});

  final Set<String> existingContactIds;

  @override
  ConsumerState<_SelectContactsSheet> createState() => _SelectContactsSheetState();
}

class _SelectContactsSheetState extends ConsumerState<_SelectContactsSheet> {
  final Set<String> _selectedIds = <String>{};
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Contact> _contacts = const [];
  String _search = '';
  int _page = 1;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadContacts(reset: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 220 &&
        !_loading &&
        !_loadingMore &&
        _hasMore) {
      _loadContacts();
    }
  }

  Future<void> _loadContacts({bool reset = false}) async {
    if (_loadingMore) {
      return;
    }
    if (!reset && !_hasMore) {
      return;
    }
    if (mounted) {
      setState(() {
        if (reset) {
          _loading = true;
          _page = 1;
          _hasMore = true;
        } else {
          _loadingMore = true;
        }
      });
    }
    try {
      final result = await ref.read(apiClientProvider).getContactsPage(
            search: _search.trim().isEmpty ? null : _search.trim(),
            page: _page,
            limit: ApiClient.contactsListFetchLimit,
            sortBy: 'name',
            sortOrder: 'asc',
          );
      final fetched = result.contacts
          .where((contact) => !widget.existingContactIds.contains(contact.id))
          .toList(growable: false);
      if (!mounted) {
        return;
      }
      setState(() {
        _contacts = reset ? fetched : [..._contacts, ...fetched];
        _page += 1;
        _hasMore = result.hasMore;
        _loading = false;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loading = false;
        _loadingMore = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to load contacts right now.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.82,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            children: [
              Text(
                'Add Contacts',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _searchController,
                onChanged: (value) async {
                  _search = value;
                  await _loadContacts(reset: true);
                },
                decoration: const InputDecoration(
                  hintText: 'Search by name or phone',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _contacts.isEmpty
                        ? const Center(child: Text('No contacts found'))
                        : ListView.builder(
                            controller: _scrollController,
                            itemCount: _contacts.length + (_loadingMore || _hasMore ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index >= _contacts.length) {
                                if (_loadingMore) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 12),
                                    child: Center(child: CircularProgressIndicator()),
                                  );
                                }
                                return const SizedBox(height: 20);
                              }
                              final contact = _contacts[index];
                              final isSelected = _selectedIds.contains(contact.id);
                              return CheckboxListTile(
                                value: isSelected,
                                onChanged: (value) {
                                  setState(() {
                                    if (value == true) {
                                      _selectedIds.add(contact.id);
                                    } else {
                                      _selectedIds.remove(contact.id);
                                    }
                                  });
                                },
                                title: Text(contact.fullName.isEmpty ? 'Unnamed contact' : contact.fullName),
                                subtitle: Text(contact.phoneNo),
                                controlAffinity: ListTileControlAffinity.leading,
                              );
                            },
                          ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: _selectedIds.isEmpty ? null : () => Navigator.pop(context, _selectedIds),
                      child: Text('Add (${_selectedIds.length})'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
