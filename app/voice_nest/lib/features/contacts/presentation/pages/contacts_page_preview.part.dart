part of 'contacts_page.dart';

extension _ContactsPageSyncExtension on _ContactsPageState {
  Future<void> _syncPhoneContacts() async {
    final syncToExotel = await _askSyncToExotelForImport();
    if (syncToExotel == null) return;

    final granted = await device_contacts.FlutterContacts.requestPermission(readonly: true);
    if (!granted) return;

    await _runBusy(() async {
      final contacts = await device_contacts.FlutterContacts.getContacts(withProperties: true);
      if (contacts.isEmpty || !mounted) return;

      final candidates = <ContactImportCandidate>[];
      final seenPhone = <String>{};
      int invalid = 0;
      int dupes = 0;
      int scanned = 0;

      for (final contact in contacts) {
        final firstName = contact.name.first.trim();
        final lastName = contact.name.last.trim();
        final email = contact.emails.isNotEmpty ? contact.emails.first.address.trim() : '';
        for (final phone in contact.phones) {
          scanned += 1;
          final normalized = _normalizePhone(phone.number);
          if (normalized == null) {
            invalid += 1;
            continue;
          }
          final dedupeKey = normalized.replaceFirst('+', '');
          if (!seenPhone.add(dedupeKey)) {
            dupes += 1;
            continue;
          }
          final first = firstName.isNotEmpty
              ? firstName
              : contact.displayName.trim().split(RegExp(r'\s+')).firstOrNull ?? 'Contact';
          candidates.add(ContactImportCandidate(
            displayName: contact.displayName.trim().isNotEmpty ? contact.displayName.trim() : first,
            firstName: first,
            lastName: lastName,
            email: email,
            previewPhone: normalized,
            normalizedPhone: normalized,
          ));
        }
      }

      final selected = await _openContactSyncPreviewPage(
        candidates: candidates,
        deviceContactCount: contacts.length,
        scannedPhoneCount: scanned,
        validCount: candidates.length,
        invalidCount: invalid,
        duplicateCount: dupes,
        syncToExotel: syncToExotel,
      );
      if (!mounted || selected == null || selected.isEmpty) return;

      final rows = <String>[
        'first_name,last_name,email,phone_no,tag',
        ...selected.map((c) => '${_csv(c.firstName)},${_csv(c.lastName)},${_csv(c.email)},${_csv(c.normalizedPhone)},'),
      ];
      final result = await ref.read(apiClientProvider).importContactsCsv(
            rows.join('\n'),
            syncToExotel: syncToExotel,
          );
      await _loadInitial();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Synced contacts • New: ${result['inserted'] ?? 0} • Updated: ${result['updated'] ?? 0}')),
      );
    });
  }

  Future<List<ContactImportCandidate>?> _openContactSyncPreviewPage({
    required List<ContactImportCandidate> candidates,
    required int deviceContactCount,
    required int scannedPhoneCount,
    required int validCount,
    required int invalidCount,
    required int duplicateCount,
    required bool syncToExotel,
  }) {
    return Navigator.of(context).push<List<ContactImportCandidate>>(
      MaterialPageRoute(
        builder: (_) => ContactSyncPreviewPage(
          candidates: candidates,
          deviceContactCount: deviceContactCount,
          scannedPhoneCount: scannedPhoneCount,
          validCount: validCount,
          invalidCount: invalidCount,
          duplicateCount: duplicateCount,
          syncToExotel: syncToExotel,
        ),
      ),
    );
  }

  Future<bool?> _askSyncToExotelForImport() async {
    bool syncToExotel = false;
    return showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SwitchListTile.adaptive(
                  value: syncToExotel,
                  onChanged: (v) => setState(() => syncToExotel = v),
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Sync imported contacts to Exotel'),
                ),
                Row(
                  children: [
                    Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel'))),
                    const SizedBox(width: 10),
                    Expanded(child: FilledButton(onPressed: () => Navigator.pop(context, syncToExotel), child: const Text('Continue'))),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
