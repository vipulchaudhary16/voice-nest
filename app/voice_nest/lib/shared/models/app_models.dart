class Session {
  Session({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.tenantId,
    required this.token,
    this.tenantName,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String tenantId;
  final String? tenantName;
  final String token;

  factory Session.fromJson(Map<String, dynamic> json) => Session(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        tenantId: json['tenant_id']?.toString() ?? '',
        tenantName: json['tenant_name']?.toString(),
        token: json['token']?.toString() ?? '',
      );
}

class Contact {
  Contact({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.phoneNo,
    this.email,
    this.tag,
    this.exotelSid,
    this.tenantId,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String phoneNo;
  final String? email;
  final String? tag;
  final String? exotelSid;
  final String? tenantId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName'.trim();

  factory Contact.fromJson(Map<String, dynamic> json) => Contact(
        id: json['_id']?.toString() ?? '',
        firstName: json['first_name']?.toString() ?? '',
        lastName: json['last_name']?.toString() ?? '',
        phoneNo: json['phone_no']?.toString() ?? '',
        email: json['email']?.toString(),
        tag: json['tag']?.toString(),
        exotelSid: json['exotel_sid']?.toString(),
        tenantId: json['tenant_id']?.toString(),
        createdAt: _tryParseDateTime(json['createdAt']),
        updatedAt: _tryParseDateTime(json['updatedAt']),
      );
}

DateTime? _tryParseDateTime(dynamic value) {
  final raw = value?.toString();
  if (raw == null || raw.isEmpty) {
    return null;
  }
  return DateTime.tryParse(raw);
}

class ContactListMembership {
  ContactListMembership({
    required this.id,
    required this.name,
    this.tag,
  });

  final String id;
  final String name;
  final String? tag;

  factory ContactListMembership.fromJson(Map<String, dynamic> json) => ContactListMembership(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        tag: json['tag']?.toString(),
      );
}

class ContactDetail {
  ContactDetail({
    required this.contact,
    required this.belongsToLists,
  });

  final Contact contact;
  final List<ContactListMembership> belongsToLists;

  factory ContactDetail.fromJson(Map<String, dynamic> json) => ContactDetail(
        contact: Contact.fromJson(json),
        belongsToLists: ((json['belongs_to_lists'] as List<dynamic>?) ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(ContactListMembership.fromJson)
            .toList(),
      );
}

class ContactList {
  ContactList({
    required this.id,
    required this.name,
    required this.contacts,
    this.tag,
  });

  final String id;
  final String name;
  final String? tag;
  final List<dynamic> contacts;

  factory ContactList.fromJson(Map<String, dynamic> json) => ContactList(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        tag: json['tag']?.toString(),
        contacts: json['contacts'] as List<dynamic>? ?? const [],
      );
}

class Exophone {
  Exophone({required this.id, required this.name, required this.phoneNo});

  final String id;
  final String name;
  final String phoneNo;

  factory Exophone.fromJson(Map<String, dynamic> json) => Exophone(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        phoneNo: json['phone_no']?.toString() ?? '',
      );
}

class AppFlow {
  AppFlow({
    required this.id,
    required this.name,
    required this.appId,
    required this.tags,
  });

  final String id;
  final String name;
  final String appId;
  final List<String> tags;

  factory AppFlow.fromJson(Map<String, dynamic> json) => AppFlow(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        appId: json['app_id']?.toString() ?? '',
        tags: ((json['tags'] as List<dynamic>?) ?? const [])
            .map((t) => t.toString())
            .toList(),
      );
}

class Campaign {
  Campaign({
    required this.id,
    required this.name,
    required this.status,
    required this.campaignType,
    required this.lists,
    this.createdAt,
  });

  final String id;
  final String name;
  final String status;
  final String campaignType;
  final List<dynamic> lists;
  final DateTime? createdAt;

  factory Campaign.fromJson(Map<String, dynamic> json) => Campaign(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        status: json['status']?.toString() ?? 'Created',
        campaignType: json['campaign_type']?.toString() ?? 'static',
        lists: json['lists'] as List<dynamic>? ?? const [],
        createdAt: _tryParseDateTime(json['createdAt'] ?? json['created_at']),
      );
}
