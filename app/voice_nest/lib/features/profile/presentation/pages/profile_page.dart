import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/app_providers.dart';
import '../../../flows/presentation/pages/flows_page.dart';
import '../widgets/profile_action_tile.dart';
import '../widgets/profile_hero.dart';
import '../widgets/profile_stats_row.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider).valueOrNull;
    if (session == null) return const SizedBox.shrink();

    final theme = Theme.of(context);
    return ColoredBox(
      color: const Color(0xFFF6F7FB),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          ProfileHero(session: session),
          const SizedBox(height: 14),
          ProfileIdentityBlock(session: session),
          const SizedBox(height: 22),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: Column(
              children: [
                const ProfileStatsRow(),
                const SizedBox(height: 16),
                _SectionLabel(text: 'Workspace'),
                const SizedBox(height: 8),
                _CardShell(
                  child: ProfileActionTile(
                    icon: Icons.account_tree_rounded,
                    title: 'Flows',
                    subtitle: 'Manage Exotel App Bazaar flows',
                    color: const Color(0xFF6366F1),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const FlowsPage()),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _SectionLabel(text: 'Account'),
                const SizedBox(height: 8),
                _CardShell(
                  child: Column(
                    children: [
                      _InfoRow(
                        icon: Icons.alternate_email_rounded,
                        label: 'Email',
                        value: session.email,
                        color: const Color(0xFFEC4899),
                      ),
                      const Divider(height: 1, indent: 66, endIndent: 14),
                      _InfoRow(
                        icon: Icons.business_rounded,
                        label: 'Tenant',
                        value: (session.tenantName?.trim().isNotEmpty ?? false)
                            ? session.tenantName!
                            : '—',
                        color: const Color(0xFF10B981),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        ref.read(sessionControllerProvider.notifier).logout(),
                    icon: const Icon(Icons.logout_rounded),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(50),
                      foregroundColor: theme.colorScheme.error,
                      side: BorderSide(
                        color: theme.colorScheme.error.withValues(alpha: 0.4),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    label: const Text('Logout'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CardShell extends StatelessWidget {
  const _CardShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.6)),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: child,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(left: 4),
        child: Text(
          text.toUpperCase(),
          style: t.textTheme.labelSmall?.copyWith(
              letterSpacing: 1.3, fontWeight: FontWeight.w700, color: t.colorScheme.outline),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyLarge
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
