import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/config/env_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_flows.dart';
import '../../core/session/session_controller.dart';
import '../models/app_models.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final sessionControllerProvider =
    StateNotifierProvider<SessionController, AsyncValue<Session?>>(
  (ref) => SessionController(
    apiClient: ref.read(apiClientProvider),
    storage: ref.read(secureStorageProvider),
  ),
);

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.read(secureStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: EnvConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Accept': 'application/json'},
    ),
  );
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        options.extra['startedAt'] = DateTime.now().millisecondsSinceEpoch;
        final token = await storage.read(key: SessionController.tokenKey);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        debugPrint(
          '[API][APP][REQ] ${options.method} ${options.baseUrl}${options.path} '
          'params=${options.queryParameters} data=${options.data}',
        );
        handler.next(options);
      },
      onResponse: (response, handler) {
        final startedAt = (response.requestOptions.extra['startedAt'] as int?) ??
            DateTime.now().millisecondsSinceEpoch;
        final elapsedMs = DateTime.now().millisecondsSinceEpoch - startedAt;
        debugPrint(
          '[API][APP][RES] ${response.requestOptions.method} '
          '${response.requestOptions.baseUrl}${response.requestOptions.path} '
          'status=${response.statusCode} ${elapsedMs}ms',
        );
        handler.next(response);
      },
      onError: (error, handler) {
        final startedAt = (error.requestOptions.extra['startedAt'] as int?) ??
            DateTime.now().millisecondsSinceEpoch;
        final elapsedMs = DateTime.now().millisecondsSinceEpoch - startedAt;
        debugPrint(
          '[API][APP][ERR] ${error.requestOptions.method} '
          '${error.requestOptions.baseUrl}${error.requestOptions.path} '
          'status=${error.response?.statusCode} ${elapsedMs}ms '
          'message=${error.response?.data?['message'] ?? error.message}',
        );
        handler.next(error);
      },
    ),
  );
  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));
  }
  return dio;
});

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref.read(dioProvider)));

final contactsProvider = FutureProvider<List<Contact>>((ref) async {
  final session = ref.watch(sessionControllerProvider).valueOrNull;
  if (session == null) {
    return const [];
  }
  return ref.read(apiClientProvider).getContacts();
});

final listsProvider = FutureProvider<List<ContactList>>((ref) async {
  final session = ref.watch(sessionControllerProvider).valueOrNull;
  if (session == null) {
    return const [];
  }
  return ref.read(apiClientProvider).getLists();
});

final campaignsProvider = FutureProvider<List<Campaign>>((ref) async {
  final session = ref.watch(sessionControllerProvider).valueOrNull;
  if (session == null) {
    return const [];
  }
  return ref.read(apiClientProvider).getCampaigns();
});

final flowsProvider = FutureProvider<List<AppFlow>>((ref) async {
  final session = ref.watch(sessionControllerProvider).valueOrNull;
  if (session == null) {
    return const [];
  }
  return ref.read(apiClientProvider).getFlows();
});
