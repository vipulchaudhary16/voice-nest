import '../../../../shared/models/app_models.dart';

class GroupedContactRow {
  const GroupedContactRow.header(this.header)
      : contact = null,
        isHeader = true;
  const GroupedContactRow.contact(this.contact)
      : header = null,
        isHeader = false;

  final String? header;
  final Contact? contact;
  final bool isHeader;
}

List<GroupedContactRow> groupedRowsFromContacts(List<Contact> contacts) {
  final sorted = List<Contact>.from(contacts)..sort(compareContactsForList);
  final rows = <GroupedContactRow>[];
  String? currentGroup;
  for (final contact in sorted) {
    final group = groupLetter(contact);
    if (group != currentGroup) {
      rows.add(GroupedContactRow.header(group));
      currentGroup = group;
    }
    rows.add(GroupedContactRow.contact(contact));
  }
  return rows;
}

int compareContactsForList(Contact a, Contact b) {
  final na = sortKeyName(a);
  final nb = sortKeyName(b);
  final byName = na.compareTo(nb);
  if (byName != 0) return byName;
  return a.phoneNo.toLowerCase().compareTo(b.phoneNo.toLowerCase());
}

String sortKeyName(Contact c) {
  final n = c.fullName.trim().toLowerCase();
  if (n.isNotEmpty) return n;
  return c.phoneNo.trim().toLowerCase();
}

String groupLetter(Contact contact) {
  final label = contact.fullName.trim().isNotEmpty ? contact.fullName.trim() : contact.phoneNo.trim();
  if (label.isEmpty) return '#';
  final match = RegExp(r'[A-Za-z]').firstMatch(label);
  if (match == null) return '#';
  return match.group(0)!.toUpperCase();
}
