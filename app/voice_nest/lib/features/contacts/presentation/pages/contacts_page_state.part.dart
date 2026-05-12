// ignore_for_file: invalid_use_of_protected_member

part of 'contacts_page.dart';

extension _ContactsPageStateExtension on _ContactsPageState {
  Future<void> _loadInitial() async {
    setState(() => _loading = true);
    await Future.wait([_loadContacts(reset: true), _loadTags()]);
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadContacts({bool reset = false}) async {
    if (_loadingMore || (!reset && !_hasMore) || !mounted) return;

    setState(() {
      if (reset) {
        _page = 1;
        _hasMore = true;
      } else {
        _loadingMore = true;
      }
    });

    try {
      final result = await ref.read(apiClientProvider).getContactsPage(
            search: _search,
            tag: _tag,
            page: _page,
            limit: ApiClient.contactsListFetchLimit,
            sortBy: 'name',
            sortOrder: 'asc',
          );
      if (!mounted) return;
      setState(() {
        _contacts = reset ? result.contacts : [..._contacts, ...result.contacts];
        _page += 1;
        _hasMore = result.hasMore;
        _loadingMore = false;
        _selectedIds.removeWhere((id) => !_contacts.any((c) => c.id == id));
      });
      widget.onTotalChanged?.call(result.total);
    } catch (error) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load contacts: $error')),
      );
    }
  }

  Future<void> _loadTags() async {
    final tags = await ref.read(apiClientProvider).getContactTags();
    if (mounted) setState(() => _tags = tags);
  }

  void _onSearchChanged(String value) {
    _search = value;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _loadContacts(reset: true));
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 220 &&
        !_loading &&
        !_loadingMore &&
        _hasMore) {
      _loadContacts();
    }
  }

  Future<void> _runBusy(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _setSelectionMode(bool enabled) {
    setState(() {
      _selectionMode = enabled;
      if (!enabled) _selectedIds.clear();
    });
  }

  Future<void> _openTagFilterSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            ListTile(
              title: const Text('All tags'),
              trailing: _tag.isEmpty ? const Icon(Icons.check) : null,
              onTap: () async {
                Navigator.pop(context);
                setState(() => _tag = '');
                await _loadContacts(reset: true);
              },
            ),
            ..._tags.map((tag) => ListTile(
                  title: Text(tag),
                  trailing: _tag == tag ? const Icon(Icons.check) : null,
                  onTap: () async {
                    Navigator.pop(context);
                    setState(() => _tag = tag);
                    await _loadContacts(reset: true);
                  },
                )),
          ],
        ),
      ),
    );
  }
}
