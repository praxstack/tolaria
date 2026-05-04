import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const editorStyles = StyleSheet.create({
  editor: {
    flex: 2,
    minWidth: 0,
    backgroundColor: colors.canvas,
  },
  editorContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 96,
  },
  editorAdapterContent: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 96,
  },
  breadcrumbRow: {
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breadcrumbText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
  },
  breadcrumbDivider: {
    color: colors.border,
    fontSize: 14,
  },
  editorTitle: {
    marginBottom: spacing.xl,
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
  },
  editorParagraph: {
    marginBottom: spacing.lg,
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
  },
  editorBullet: {
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
  },
  tentapEditor: {
    flex: 1,
    overflow: 'hidden',
  },
  tentapToolbar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.canvas,
  },
})
