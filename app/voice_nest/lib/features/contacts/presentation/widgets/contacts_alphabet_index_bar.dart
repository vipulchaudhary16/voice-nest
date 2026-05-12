import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'contacts_alphabet_index_atoms.dart';

/// iOS-style A–Z + # scrubber with macOS-Dock magnification and side preview bubble.
class ContactsAlphabetIndexBar extends StatefulWidget {
  const ContactsAlphabetIndexBar({
    super.key,
    required this.activeLetters,
    required this.onLetter,
    this.enabled = true,
  });

  final Set<String> activeLetters;
  final ValueChanged<String> onLetter;
  final bool enabled;

  static const List<String> alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#',
  ];

  @override
  State<ContactsAlphabetIndexBar> createState() => _ContactsAlphabetIndexBarState();
}

class _ContactsAlphabetIndexBarState extends State<ContactsAlphabetIndexBar> {
  int? _pressedIndex;
  String? _pressedLetter;

  void _updateAtY(double localY, double height) {
    if (height <= 0) return;
    final count = ContactsAlphabetIndexBar.alphabet.length;
    final i = (localY / height * count).floor().clamp(0, count - 1);
    final letter = ContactsAlphabetIndexBar.alphabet[i];
    if (_pressedIndex == i) return;
    setState(() {
      _pressedIndex = i;
      _pressedLetter = letter;
    });
    if (widget.activeLetters.contains(letter)) {
      widget.onLetter(letter);
      HapticFeedback.selectionClick();
    } else {
      HapticFeedback.lightImpact();
    }
  }

  void _release() {
    if (_pressedIndex == null) return;
    setState(() {
      _pressedIndex = null;
      _pressedLetter = null;
    });
  }

  /// Cosine bell falloff for dock-style magnification.
  double _bump(int i) {
    if (_pressedIndex == null) return 0;
    final d = (i - _pressedIndex!).abs().toDouble();
    final t = (d / 2.6).clamp(0.0, 1.0);
    return math.cos(t * math.pi / 2);
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return const SizedBox.shrink();
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pillBg = isDark ? Colors.white.withOpacity(0.08) : Colors.white.withOpacity(0.82);
    final pillBorder = isDark ? Colors.white.withOpacity(0.12) : Colors.black.withOpacity(0.06);
    final activeColor = scheme.onSurface.withOpacity(isDark ? 0.92 : 0.55);
    final inactiveColor = scheme.onSurface.withOpacity(0.22);

    return LayoutBuilder(
      builder: (context, c) {
        final h = c.maxHeight;
        final count = ContactsAlphabetIndexBar.alphabet.length;
        final rowH = h / count;

        return SizedBox(
          width: 22,
          height: h,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: pillBg,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: pillBorder),
                        boxShadow: [
                          BoxShadow(
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                            color: Colors.black.withOpacity(isDark ? 0.35 : 0.08),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              Positioned.fill(
                child: Listener(
                  behavior: HitTestBehavior.opaque,
                  onPointerDown: (e) => _updateAtY(e.localPosition.dy, h),
                  onPointerMove: (e) => _updateAtY(e.localPosition.dy, h),
                  onPointerUp: (_) => _release(),
                  onPointerCancel: (_) => _release(),
                  child: Column(
                    children: [
                      for (int i = 0; i < count; i++)
                        Expanded(
                          child: ContactsAlphabetLetterCell(
                            letter: ContactsAlphabetIndexBar.alphabet[i],
                            scale: 1 + 0.9 * _bump(i),
                            push: 18 * _bump(i),
                            isActive: widget.activeLetters
                                .contains(ContactsAlphabetIndexBar.alphabet[i]),
                            isPressed: _pressedIndex == i,
                            activeColor: activeColor,
                            inactiveColor: inactiveColor,
                            primary: scheme.primary,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (_pressedIndex != null && _pressedLetter != null)
                Positioned(
                  top: ((_pressedIndex! + 0.5) * rowH) - 28,
                  right: 32,
                  child: IgnorePointer(
                    child: ContactsAlphabetPreviewBubble(letter: _pressedLetter!),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
