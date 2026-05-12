# 🐦 FLUTTER PROJECT — SKILLS & QUICK REFERENCE
> Keep this file in the root of your repo. Reference it in Cursor with `@FLUTTER_SKILLS.md`

---

## 1. PROJECT OVERVIEW

| Item              | Value                              |
|-------------------|------------------------------------|
| Flutter Version   | 3.x (stable)                       |
| Dart Version      | 3.x                                |
| State Management  | Riverpod (riverpod_annotation)     |
| Architecture      | Clean Architecture + Feature-First |
| API Style         | REST (Dio + Retrofit)              |
| Navigation        | GoRouter                           |
| DI                | get_it + injectable                |
| Models            | freezed + json_serializable        |
| Local DB          | Hive / Isar                        |
| Env Config        | flutter_dotenv                     |

---

## 2. QUICK COMMAND REFERENCE

```bash
# Run build_runner (models, providers, routes)
dart run build_runner build --delete-conflicting-outputs

# Watch mode during development
dart run build_runner watch --delete-conflicting-outputs

# Format code
dart format lib/ test/

# Analyze
dart analyze

# Run tests
flutter test

# Run tests with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Clean build
flutter clean && flutter pub get

# Generate launcher icons
dart run flutter_launcher_icons

# Generate splash screen
dart run flutter_native_splash:create
```

---

## 3. SNIPPETS CHEAT SHEET

### 3.1 Dio Remote Data Source
```dart
// features/products/data/datasources/product_remote_datasource.dart
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/endpoints.dart';
import '../models/product_model.dart';

abstract interface class ProductRemoteDataSource {
  Future<List<ProductModel>> fetchProducts();
  Future<ProductModel> fetchProductById(String id);
}

@LazySingleton(as: ProductRemoteDataSource)
class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  const ProductRemoteDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<List<ProductModel>> fetchProducts() async {
    final response = await _dio.get(Endpoints.products);
    return (response.data as List)
        .map((j) => ProductModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ProductModel> fetchProductById(String id) async {
    final response = await _dio.get(Endpoints.productById(id));
    return ProductModel.fromJson(response.data as Map<String, dynamic>);
  }
}
```

### 3.2 Use Case
```dart
// features/products/domain/usecases/get_products_usecase.dart
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/product.dart';
import '../repositories/product_repository.dart';

@lazySingleton
class GetProductsUseCase {
  const GetProductsUseCase(this._repository);
  final ProductRepository _repository;

  Future<Either<Failure, List<Product>>> call() =>
      _repository.getProducts();
}
```

### 3.3 Riverpod AsyncNotifier
```dart
// features/products/presentation/providers/products_provider.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/product.dart';
import '../../domain/usecases/get_products_usecase.dart';

part 'products_provider.g.dart';

@riverpod
class ProductsNotifier extends _$ProductsNotifier {
  @override
  FutureOr<List<Product>> build() => _fetch();

  Future<List<Product>> _fetch() =>
      ref.read(getProductsUseCaseProvider)().then(
        (either) => either.fold(
          (failure) => throw Exception(failure.message),
          (products) => products,
        ),
      );

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}
```

### 3.4 ConsumerWidget Screen
```dart
// features/products/presentation/pages/products_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/products_provider.dart';
import '../widgets/product_card.dart';
import '../../../../shared/widgets/app_loader.dart';
import '../../../../shared/widgets/error_view.dart';

class ProductsPage extends ConsumerWidget {
  const ProductsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(productsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Products')),
      body: state.when(
        loading: () => const AppLoader(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.read(productsNotifierProvider.notifier).refresh(),
        ),
        data: (products) => ListView.builder(
          itemCount: products.length,
          itemBuilder: (context, i) => ProductCard(product: products[i]),
        ),
      ),
    );
  }
}
```

### 3.5 GoRouter Setup
```dart
// core/router/app_router.dart
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  return GoRouter(
    initialLocation: '/products',
    redirect: (context, state) {
      final isLoggedIn = ref.read(authStateProvider);
      if (!isLoggedIn && state.matchedLocation != '/login') return '/login';
      return null;
    },
    routes: [
      GoRoute(path: '/login',    builder: (_, __) => const LoginPage()),
      GoRoute(
        path: '/products',
        builder: (_, __) => const ProductsPage(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (_, state) =>
                ProductDetailPage(id: state.pathParameters['id']!),
          ),
        ],
      ),
    ],
  );
}
```

### 3.6 Error Interceptor
```dart
// core/network/error_interceptor.dart
import 'package:dio/dio.dart';
import '../errors/app_exception.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final statusCode = err.response?.statusCode;
    final message = err.response?.data?['message'] as String? ??
        err.message ?? 'Unknown error';

    final exception = switch (statusCode) {
      400       => BadRequestException(message),
      401       => UnauthorizedException(message),
      403       => ForbiddenException(message),
      404       => NotFoundException(message),
      >= 500    => ServerException(message),
      _         => NetworkException(message),
    };

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        error: exception,
        response: err.response,
        type: err.type,
      ),
    );
  }
}
```

### 3.7 Secure Token Storage
```dart
// core/services/token_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:injectable/injectable.dart';

@lazySingleton
class TokenService {
  const TokenService(this._storage);
  final FlutterSecureStorage _storage;

  static const _accessKey  = 'access_token';
  static const _refreshKey = 'refresh_token';

  Future<void> saveTokens({
    required String access,
    required String refresh,
  }) async {
    await Future.wait([
      _storage.write(key: _accessKey,  value: access),
      _storage.write(key: _refreshKey, value: refresh),
    ]);
  }

  Future<String?> getAccessToken()  => _storage.read(key: _accessKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);

  Future<void> clearTokens() => Future.wait([
    _storage.delete(key: _accessKey),
    _storage.delete(key: _refreshKey),
  ]);
}
```

### 3.8 Pagination with Riverpod
```dart
@riverpod
class PaginatedProductsNotifier extends _$PaginatedProductsNotifier {
  static const _pageSize = 20;
  int _page = 1;
  bool _hasMore = true;

  @override
  FutureOr<List<Product>> build() async => _loadPage();

  Future<List<Product>> _loadPage() async {
    final result = await ref
        .read(productRepositoryProvider)
        .getProducts(page: _page, limit: _pageSize);
    return result.fold(
      (f) => throw Exception(f.message),
      (products) {
        if (products.length < _pageSize) _hasMore = false;
        return products;
      },
    );
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading) return;
    _page++;
    final current = state.requireValue;
    state = AsyncData([...current, ...await _loadPage()]);
  }
}
```

---

## 4. FOLDER NAMING CONVENTIONS

| Type            | Convention       | Example                     |
|-----------------|------------------|-----------------------------|
| Files           | snake_case       | `product_model.dart`        |
| Classes         | PascalCase       | `ProductModel`              |
| Variables       | camelCase        | `productList`               |
| Constants       | camelCase        | `baseUrl`                   |
| Enums           | PascalCase       | `OrderStatus`               |
| Enum values     | camelCase        | `OrderStatus.pending`       |
| Providers       | camelCase+Provider | `productsNotifierProvider` |
| Private members | _camelCase       | `_repository`               |

---

## 5. API INTEGRATION CHECKLIST

- [ ] All endpoints declared in `Endpoints` class
- [ ] `DioClient` configured with timeouts (15s connect, 15s receive)
- [ ] `AuthInterceptor` injects Bearer token from secure storage
- [ ] `ErrorInterceptor` maps HTTP codes to typed exceptions
- [ ] `LogInterceptor` only active in debug mode
- [ ] All response models use `freezed` + `json_serializable`
- [ ] Repositories return `Either<Failure, T>` (never raw throws to UI)
- [ ] Token refresh logic handles 401 and retries original request
- [ ] `.env` file is in `.gitignore`
- [ ] API keys loaded via `flutter_dotenv` or `envied`

---

## 6. STATE MANAGEMENT DECISION TREE

```
Need state?
├── Derived from other state / computed?    → use Provider (no notifier)
├── Async data from API?                    → AsyncNotifier
├── Simple toggle / counter / form?         → Notifier
├── Auth / global session?                  → AsyncNotifier (root scoped)
└── Screen-local ephemeral state?           → StatefulWidget setState
```

---

## 7. ENVIRONMENT CONFIGURATION

```
# .env (gitignored)
BASE_URL=https://api.example.com/v1
API_KEY=your_key_here
TIMEOUT_SECONDS=15
```

```dart
// main.dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  await dotenv.load(fileName: '.env');
  runApp(const ProviderScope(child: MyApp()));
}
```

```dart
// core/constants/app_constants.dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

abstract class AppConstants {
  static String get baseUrl => dotenv.env['BASE_URL']!;
  static String get apiKey  => dotenv.env['API_KEY']!;
  static Duration get timeout =>
      Duration(seconds: int.parse(dotenv.env['TIMEOUT_SECONDS'] ?? '15'));
}
```

---

## 8. TESTING REFERENCE

### Unit Test — Repository
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:fpdart/fpdart.dart';

class MockProductRemoteDataSource extends Mock
    implements ProductRemoteDataSource {}

void main() {
  late ProductRepositoryImpl repository;
  late MockProductRemoteDataSource mockDataSource;

  setUp(() {
    mockDataSource = MockProductRemoteDataSource();
    repository = ProductRepositoryImpl(mockDataSource);
  });

  group('getProducts', () {
    final tModels   = [ProductModel(id: '1', name: 'Test', price: 99.0)];
    final tEntities = tModels.map((m) => m.toEntity()).toList();

    test('returns Right(products) on success', () async {
      when(() => mockDataSource.fetchProducts())
          .thenAnswer((_) async => tModels);
      final result = await repository.getProducts();
      expect(result, Right(tEntities));
    });

    test('returns Left(NetworkFailure) on DioException', () async {
      when(() => mockDataSource.fetchProducts())
          .thenThrow(DioException(requestOptions: RequestOptions()));
      final result = await repository.getProducts();
      expect(result.isLeft(), true);
    });
  });
}
```

---

## 9. COMMON ISSUES & FIXES

| Problem | Cause | Fix |
|---------|-------|-----|
| `StateNotifierProviderRef` error | Using old Riverpod API | Migrate to `AsyncNotifier` / `Notifier` |
| Build runner not generating files | Missing `part` directive | Add `part 'file.g.dart';` at top of file |
| `MissingPluginException` on iOS | Pod not installed | Run `cd ios && pod install` |
| Token not sent in headers | `AuthInterceptor` not added to Dio | Add to `dio.interceptors` list |
| Freezed equality not working | Missing `@override` | Ensure `freezed` generates `==` / `hashCode` |
| `GoRouter` redirect loop | Bad redirect logic | Add guard: don't redirect if already on target route |
| `setState` called after dispose | Async gap after unmount | Check `mounted` before `setState` |
| Large list janky scroll | `ListView(children:[])` | Switch to `ListView.builder` |

---

## 10. CURSOR AI TIPS FOR THIS PROJECT

- **`@FLUTTER_SKILLS.md`** — Attach this file when asking for new features.
- **`@.cursorrules`** — Already auto-loaded; no need to tag.
- **Ask for one layer at a time** — e.g., "Generate the domain layer for the Orders feature."
- **Tag specific files** — `@lib/core/network/dio_client.dart` to get context-aware edits.
- **Use `/edit` command** — Highlight a widget and say "refactor to use `ConsumerWidget`".
- **Reference this doc** for snippets, then ask Cursor to adapt them to your feature.
