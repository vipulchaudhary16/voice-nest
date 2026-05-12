import 'package:flutter/material.dart';

import '../../../../shared/models/app_models.dart';

class ProfileHero extends StatelessWidget {
  const ProfileHero({required this.session, super.key});

  final Session session;

  static const double avatarRadius = 42;
  static const double ringPadding = 4;
  static const double avatarSize = (avatarRadius + ringPadding) * 2;
  static const double avatarOverflow = avatarSize / 2;

  String get _initials {
    final parts = session.name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) {
      return session.email.isNotEmpty ? session.email[0].toUpperCase() : '?';
    }
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1)).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200 + avatarOverflow,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 200,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(36)),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFEC4899)],
                ),
              ),
              child: const Stack(
                children: [
                  Positioned(
                    top: -40,
                    right: -40,
                    child: _Glow(size: 180, color: Color(0x335EEAD4)),
                  ),
                  Positioned(
                    bottom: 30,
                    left: -30,
                    child: _Glow(size: 140, color: Color(0x33FBBF24)),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            child: _RingedAvatar(initials: _initials),
          ),
        ],
      ),
    );
  }
}

class _RingedAvatar extends StatelessWidget {
  const _RingedAvatar({required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(ProfileHero.ringPadding),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const SweepGradient(
          colors: [Color(0xFF6366F1), Color(0xFFEC4899), Color(0xFFFBBF24), Color(0xFF6366F1)],
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x336366F1), blurRadius: 20, offset: Offset(0, 6)),
        ],
      ),
      child: CircleAvatar(
        radius: ProfileHero.avatarRadius,
        backgroundColor: Colors.white,
        child: Text(
          initials,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Color(0xFF4338CA),
          ),
        ),
      ),
    );
  }
}

class ProfileIdentityBlock extends StatelessWidget {
  const ProfileIdentityBlock({required this.session, super.key});

  final Session session;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tenant = session.tenantName?.trim();
    final hasTenant = tenant != null && tenant.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          session.name.isNotEmpty ? session.name : 'Account',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 2),
        Text(
          session.email,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline),
        ),
        if (hasTenant) ...[
          const SizedBox(height: 10),
          _TenantPill(text: tenant),
        ],
      ],
    );
  }
}

class _TenantPill extends StatelessWidget {
  const _TenantPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.business_rounded, size: 14, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(
            text,
            style: theme.textTheme.labelMedium
                ?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [color, Colors.transparent]),
      ),
    );
  }
}
