/**
 * Enforces Conventional Commits (feat:, fix:, docs(scope): ...), matching the
 * existing history. Scopes are free-form.
 *
 * @type {import("@commitlint/types").UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
};
