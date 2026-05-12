import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../../contacts/presentation/pages/contact_detail_page.dart';
import '../../../contacts/presentation/widgets/contacts_grouped_list_view.dart';
import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';

part 'list_detail_page_state.part.dart';
part 'list_detail_page_build.part.dart';
part 'list_detail_page_select_contacts_sheet.part.dart';
part 'list_detail_page_widgets.part.dart';

class ListDetailPage extends ConsumerStatefulWidget {
  const ListDetailPage({super.key, required this.listId});

  final String listId;

  @override
  ConsumerState<ListDetailPage> createState() => _ListDetailPageState();
}

class _ListDetailPageState extends ConsumerState<ListDetailPage> {

  late Future<ContactList> _listFuture;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _debounce;
  List<Contact> _contacts = const [];
  int _contactsTotal = 0;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  String _search = '';
  int _page = 1;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _listFuture = _loadList();
    _loadContacts(reset: true);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _buildPage(context);
}
