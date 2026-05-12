import 'dart:convert';
import 'package:dio/dio.dart';

import '../../features/campaigns/domain/campaign_detail_models.dart';
import '../../shared/models/app_models.dart';

class ContactsPageResult {
  ContactsPageResult({
    required this.contacts,
    required this.hasMore,
    required this.page,
    required this.limit,
    required this.total,
  });

  final List<Contact> contacts;
  final bool hasMore;
  final int page;
  final int limit;
  final int total;
}

class ApiClient {
  ApiClient(this.dio);

  final Dio dio;

  /// Matches backend max; load full contact list in one request from list UIs.
  static const int contactsListFetchLimit = 100000;

  Future<Session> login(String email, String password) async {
    final response = await dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = response.data['data'] as Map<String, dynamic>;
    return Session.fromJson(data);
  }

  Future<List<Contact>> getContacts({String? search, String? tag}) async {
    final result = await getContactsPage(search: search, tag: tag, page: 1, limit: contactsListFetchLimit);
    return result.contacts;
  }

  Future<ContactsPageResult> getContactsPage({
    String? search,
    String? tag,
    String? listId,
    int page = 1,
    int limit = contactsListFetchLimit,
    String sortBy = 'name',
    String sortOrder = 'asc',
  }) async {
    final params = <String, dynamic>{};
    if (search != null && search.trim().isNotEmpty) {
      params['q'] = search.trim();
    }
    if (tag != null && tag.trim().isNotEmpty) {
      params['tag'] = tag.trim();
    }
    if (listId != null && listId.trim().isNotEmpty) {
      params['list_id'] = listId.trim();
    }
    params['page'] = page;
    params['limit'] = limit;
    params['sort_by'] = sortBy;
    params['sort_order'] = sortOrder;
    final response = await dio.get('/contacts', queryParameters: params);
    final list = response.data['data'] as List<dynamic>;
    final contacts = list.map((item) => Contact.fromJson(item as Map<String, dynamic>)).toList();
    final pagination = response.data['pagination'] as Map<String, dynamic>?;
    return ContactsPageResult(
      contacts: contacts,
      hasMore: pagination?['hasMore'] == true,
      page: (pagination?['page'] as num?)?.toInt() ?? page,
      limit: (pagination?['limit'] as num?)?.toInt() ?? limit,
      total: (pagination?['total'] as num?)?.toInt() ?? contacts.length,
    );
  }

  Future<ContactDetail> getContactById(String id) async {
    final response = await dio.get('/contacts/$id');
    final data = response.data['data'] as Map<String, dynamic>;
    return ContactDetail.fromJson(data);
  }

  Future<List<String>> getContactTags() async {
    final response = await dio.get('/contacts/tags');
    final list = response.data['data'] as List<dynamic>? ?? const [];
    return list.map((item) => item.toString()).toList();
  }

  Future<void> createContact(Map<String, dynamic> payload) async {
    await dio.post('/contacts', data: payload);
  }

  Future<void> updateContact(String id, Map<String, dynamic> payload) async {
    await dio.put('/contacts/$id', data: payload);
  }

  Future<void> syncContactToExotel(String id) async {
    await dio.post('/sync/contacts/$id');
  }

  /// Pull data from Exotel into local DB. [targets] e.g. `['contacts']`, `['lists']`, `['campaigns']`, or multiple.
  Future<Map<String, dynamic>> syncFromExotel(List<String> targets) async {
    final response = await dio.post<Map<String, dynamic>>(
      '/sync/from-exotel',
      data: {'targets': targets},
    );
    final map = response.data;
    if (map is Map<String, dynamic>) {
      return map;
    }
    return {'success': true};
  }

  Future<void> deleteContact(String id) async {
    await dio.delete('/contacts/$id');
  }

  Future<void> bulkDeleteContacts(List<String> ids) async {
    await Future.wait(ids.map(deleteContact));
  }

  Future<Map<String, dynamic>> importContactsCsv(String csvText, {bool syncToExotel = false}) async {
    final response = await dio.post('/import/run', data: {
      'type': 'contacts',
      'csvText': csvText,
      'sync_to_exotel': syncToExotel,
    });
    final data = response.data['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    return {'message': 'Import completed'};
  }

  Future<String> fetchContactsTemplateCsv() async {
    final response = await dio.get(
      '/import/template',
      queryParameters: {'type': 'contacts'},
      options: Options(responseType: ResponseType.bytes),
    );
    final bytes = response.data as List<int>;
    return utf8.decode(bytes);
  }

  Future<List<ContactList>> getLists() async {
    final response = await dio.get('/lists');
    final list = response.data['data'] as List<dynamic>;
    return list.map((item) => ContactList.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> createList(Map<String, dynamic> payload) async {
    await dio.post('/lists', data: payload);
  }

  Future<void> deleteList(String id) async {
    await dio.delete('/lists/$id');
  }

  Future<void> addContactsToList(String listId, List<String> contactIds) async {
    await dio.post('/lists/$listId/contacts', data: {'contact_ids': contactIds});
  }

  Future<void> removeContactFromList(String listId, String contactId) async {
    await dio.delete('/lists/$listId/contacts/$contactId');
  }

  Future<List<Campaign>> getCampaigns() async {
    final response = await dio.get('/campaigns');
    final list = response.data['data'] as List<dynamic>;
    return list.map((item) => Campaign.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> createCampaign(Map<String, dynamic> payload) async {
    await dio.post('/campaigns', data: payload);
  }

  Future<void> deleteCampaign(String id) async {
    await dio.delete('/campaigns/$id');
  }

  Future<CampaignDetail> getCampaignById(String id) async {
    final response = await dio.get('/campaigns/$id');
    final data = response.data['data'] as Map<String, dynamic>;
    return CampaignDetail.fromJson(data);
  }

  Future<List<Exophone>> getExophones() async {
    final response = await dio.get('/exophones');
    final list = response.data['data'] as List<dynamic>;
    return list.map((item) => Exophone.fromJson(item as Map<String, dynamic>)).toList();
  }
}
