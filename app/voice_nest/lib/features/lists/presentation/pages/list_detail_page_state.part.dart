// ignore_for_file: invalid_use_of_protected_member

part of 'list_detail_page.dart';

extension _ListDetailPageStateExtension on _ListDetailPageState {
  Future<ContactList> _loadList() async {
    final lists = await ref.read(apiClientProvider).getLists();
    final match = lists.where((item) => item.id == widget.listId);
    if (match.isEmpty) {
      throw Exception('List not found');
    }
    return match.first;
  }

  Future<void> _refresh() async {
    final next = _loadList();
    if (mounted) {
      setState(() {
        _listFuture = next;
      });
    }
    await Future.wait([next, _loadContacts(reset: true)]);
    ref.invalidate(listsProvider);
  }

  Future<void> _loadContacts({bool reset = false}) async {
    if (_loadingMore || (!reset && !_hasMore) || !mounted) {
      return;
    }
    setState(() {
      if (reset) {
        _loading = true;
        _page = 1;
        _hasMore = true;
      } else {
        _loadingMore = true;
      }
    });
    try {
      final result = await ref.read(apiClientProvider).getContactsPage(
            search: _search.trim().isEmpty ? null : _search.trim(),
            listId: widget.listId,
            page: _page,
            limit: ApiClient.contactsListFetchLimit,
            sortBy: 'name',
            sortOrder: 'asc',
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _contacts = reset ? result.contacts : [..._contacts, ...result.contacts];
        _contactsTotal = result.total;
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

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 220 &&
        !_loading &&
        !_loadingMore &&
        _hasMore) {
      _loadContacts();
    }
  }

  void _onSearchChanged(String value) {
    _search = value;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _loadContacts(reset: true);
    });
  }

  List<Contact> _extractContacts(ContactList list) {
    return list.contacts
        .whereType<Map<String, dynamic>>()
        .map(Contact.fromJson)
        .toList(growable: false);
  }

  Future<void> _addContacts(ContactList list) async {
    if (_busy) {
      return;
    }
    final existingIds = _extractContacts(list).map((item) => item.id).toSet();

    final selectedIds = await showModalBottomSheet<Set<String>>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => _SelectContactsSheet(existingContactIds: existingIds),
    );
    if (selectedIds == null || selectedIds.isEmpty) {
      return;
    }

    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).addContactsToList(list.id, selectedIds.toList(growable: false));
      await _refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Added ${selectedIds.length} contact(s) to ${list.name}.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to add contacts: ${_errorText(error)}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _removeContact(ContactList list, Contact contact) async {
    if (_busy) {
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove contact?'),
        content: Text(
          'Remove ${contact.fullName.isEmpty ? contact.phoneNo : contact.fullName} from ${list.name}?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Remove')),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }

    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).removeContactFromList(list.id, contact.id);
      await _refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Removed ${contact.fullName.isEmpty ? contact.phoneNo : contact.fullName}.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to remove contact: ${_errorText(error)}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }
}
