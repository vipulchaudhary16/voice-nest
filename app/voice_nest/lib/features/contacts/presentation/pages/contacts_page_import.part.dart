part of 'contacts_page.dart';

extension _ContactsPageImportExtension on _ContactsPageState {
  Future<void> _deleteSelected() async {
    if (_selectedIds.isEmpty) return;
    await _runBusy(() async {
      final ids = _selectedIds.toList(growable: false);
      await ref.read(apiClientProvider).bulkDeleteContacts(ids);
      await _loadInitial();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Deleted ${ids.length} contacts')),
        );
      }
    });
  }

  Future<void> _exportSelected() async {
    if (_selectedIds.isEmpty) return;
    final selected = _contacts.where((c) => _selectedIds.contains(c.id)).toList(growable: false);
    final rows = <String>[
      'first_name,last_name,email,phone_no,tag',
      ...selected.map(
        (c) =>
            '${_csv(c.firstName)},${_csv(c.lastName)},${_csv(c.email ?? '')},${_csv(c.phoneNo)},${_csv(c.tag ?? '')}',
      ),
    ];
    await Clipboard.setData(ClipboardData(text: rows.join('\n')));
    if (!mounted) return;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Text('Copied CSV for ${selected.length} contacts to clipboard.'),
      ),
    );
  }

  Future<void> _pickAndImportCsvFile() async {
    final syncToExotel = await _askSyncToExotelForImport();
    if (syncToExotel == null) return;
    FilePickerResult? picked;
    try {
      picked = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['csv'],
        withData: true,
      );
    } on MissingPluginException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('File picker unavailable. Restart app and try again.')),
        );
      }
      return;
    }
    if (picked == null || picked.files.isEmpty) return;
    final file = picked.files.first;
    if (file.size > _ContactsPageState._maxCsvBytes) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('CSV too large. Maximum allowed size is 1 MB.')),
        );
      }
      return;
    }
    final csvText = _readCsvText(file).trim();
    if (csvText.isEmpty) return;
    await _runBusy(() async {
      final result = await ref.read(apiClientProvider).importContactsCsv(
            csvText,
            syncToExotel: syncToExotel,
          );
      await _loadInitial();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Import done • New: ${result['inserted'] ?? 0} • Updated: ${result['updated'] ?? 0} • Failed: ${result['failedCount'] ?? 0}',
          ),
        ),
      );
    });
  }

  String _readCsvText(PlatformFile file) {
    if (file.bytes != null) return String.fromCharCodes(file.bytes!);
    final path = file.path;
    if (path != null && path.isNotEmpty) return File(path).readAsStringSync();
    return '';
  }

  Future<void> _downloadTemplateCsvFile() async {
    await _runBusy(() async {
      final csv = await ref.read(apiClientProvider).fetchContactsTemplateCsv();
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/contacts-import-template.csv');
      await file.writeAsString(csv);
      if (!mounted) return;
      final renderBox = context.findRenderObject() as RenderBox?;
      final origin =
          renderBox != null ? renderBox.localToGlobal(Offset.zero) & renderBox.size : const Rect.fromLTWH(0, 0, 1, 1);
      await SharePlus.instance.share(
        ShareParams(files: [XFile(file.path)], text: 'Contacts import template (CSV)', sharePositionOrigin: origin),
      );
    });
  }
}
