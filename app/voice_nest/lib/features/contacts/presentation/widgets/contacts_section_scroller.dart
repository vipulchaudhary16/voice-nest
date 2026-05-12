import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import 'contacts_grouping_utils.dart';

/// Approximate row heights used for offset estimation when the target header
/// hasn't been laid out yet (ListView.builder lazily creates rows).
const double kContactsHeaderRowEstHeight = 38.0;
const double kContactsContactRowEstHeight = 82.0;

class ContactsSectionScroller {
  ContactsSectionScroller({
    required this.controller,
    required this.padding,
    required this.sectionKeys,
  });

  final ScrollController controller;
  final EdgeInsetsGeometry padding;
  final Map<String, GlobalKey> sectionKeys;

  final Map<String, double> _estimatedOffsets = <String, double>{};
  bool _busy = false;

  void rebuildEstimatedOffsets(List<GroupedContactRow> rows) {
    _estimatedOffsets.clear();
    final basePad = padding.resolve(TextDirection.ltr).top;
    double offset = basePad;
    for (final row in rows) {
      if (row.isHeader) {
        _estimatedOffsets[row.header!] = offset;
        offset += kContactsHeaderRowEstHeight;
      } else {
        offset += kContactsContactRowEstHeight;
      }
    }
  }

  Future<void> scrollToSection(String letter) async {
    if (_busy || !controller.hasClients) return;
    _busy = true;
    try {
      // Fast path: header already built.
      final fastCtx = sectionKeys[letter]?.currentContext;
      if (fastCtx != null) {
        await Scrollable.ensureVisible(
          fastCtx,
          alignment: 0.0,
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
        );
        return;
      }
      // Otherwise estimate the offset and jump so the row gets built.
      final position = controller.position;
      final estimated = _estimatedOffsets[letter];
      if (estimated == null) return;
      final target = estimated.clamp(0.0, position.maxScrollExtent);
      await controller.animateTo(
        target,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
      await SchedulerBinding.instance.endOfFrame;
      final ctx = sectionKeys[letter]?.currentContext;
      if (ctx != null) {
        await Scrollable.ensureVisible(
          ctx,
          alignment: 0.0,
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
        );
      }
    } finally {
      _busy = false;
    }
  }
}
