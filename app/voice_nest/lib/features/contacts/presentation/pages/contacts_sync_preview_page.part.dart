part of 'contacts_page.dart';

class ContactImportCandidate {
  const ContactImportCandidate({
    required this.displayName,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.previewPhone,
    required this.normalizedPhone,
  });

  final String displayName;
  final String firstName;
  final String lastName;
  final String email;
  final String previewPhone;
  final String normalizedPhone;
}

class ContactSyncPreviewPage extends StatefulWidget {
  const ContactSyncPreviewPage({
    super.key,
    required this.candidates,
    required this.deviceContactCount,
    required this.scannedPhoneCount,
    required this.validCount,
    required this.invalidCount,
    required this.duplicateCount,
    required this.syncToExotel,
  });

  final List<ContactImportCandidate> candidates;
  final int deviceContactCount;
  final int scannedPhoneCount;
  final int validCount;
  final int invalidCount;
  final int duplicateCount;
  final bool syncToExotel;

  @override
  State<ContactSyncPreviewPage> createState() => _ContactSyncPreviewPageState();
}

class _ContactSyncPreviewPageState extends State<ContactSyncPreviewPage> {
  late final Set<int> _selectedIndexes = <int>{...List.generate(widget.candidates.length, (i) => i)};
  bool _summaryExpanded = false;

  @override
  Widget build(BuildContext context) {
    final allSelected = _selectedIndexes.length == widget.candidates.length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Contacts'),
        actions: [
          TextButton(
            onPressed: () => setState(() {
              if (allSelected) {
                _selectedIndexes.clear();
              } else {
                _selectedIndexes.addAll(List.generate(widget.candidates.length, (i) => i));
              }
            }),
            child: Text(allSelected ? 'Clear' : 'Select all'),
          ),
        ],
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Container(
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: Theme.of(context).colorScheme.outlineVariant)),
            child: ExpansionTile(
              initiallyExpanded: _summaryExpanded,
              onExpansionChanged: (expanded) => setState(() => _summaryExpanded = expanded),
              title: const Text('Import Summary', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text('${widget.validCount} ready • ${widget.invalidCount} invalid • ${widget.duplicateCount} duplicate'),
              children: [
                _PreviewRow(label: 'Device contacts found', value: '${widget.deviceContactCount}'),
                _PreviewRow(label: 'Phone numbers scanned', value: '${widget.scannedPhoneCount}'),
                _PreviewRow(label: 'Ready to import', value: '${widget.validCount}'),
                _PreviewRow(label: 'Invalid numbers skipped', value: '${widget.invalidCount}'),
                _PreviewRow(label: 'Duplicates skipped', value: '${widget.duplicateCount}'),
                _PreviewRow(label: 'Sync to Exotel', value: widget.syncToExotel ? 'Yes' : 'No'),
              ],
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: widget.candidates.length,
            itemBuilder: (context, index) {
              final c = widget.candidates[index];
              final selected = _selectedIndexes.contains(index);
              return CheckboxListTile(
                value: selected,
                onChanged: (v) => setState(() => v == true ? _selectedIndexes.add(index) : _selectedIndexes.remove(index)),
                title: Text(c.displayName.isEmpty ? c.firstName : c.displayName),
                subtitle: Text(c.previewPhone),
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(children: [
              Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel'))),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  onPressed: _selectedIndexes.isEmpty
                      ? null
                      : () => Navigator.pop(context, [for (final i in _selectedIndexes) widget.candidates[i]]),
                  child: const Text('Import selected'),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _PreviewRow extends StatelessWidget {
  const _PreviewRow({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 12),
      child: Row(children: [
        Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
        Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
