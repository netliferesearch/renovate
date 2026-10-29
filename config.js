// Runner configuration for self-hosted Renovate. Policy lives in default.json, not here.
module.exports = {
  platform: 'github',
  repositories: ['Feedsystem/nch', 'Feedsystem/nfi'],
  onboarding: true,
  onboardingConfig: {
    $schema: 'https://docs.renovatebot.com/renovate-schema.json',
    extends: ['github>netliferesearch/renovate'],
  },
  // nch's composer.json allows craftcms/plugin-installer and yiisoft/yii2-composer; the lock
  // update fails without these.
  allowPlugins: true,
  allowScripts: true,
  // Composer 2.9+ refuses to resolve while any locked package has a known advisory. That stops every
  // partial update on a site that is behind (nch: Craft 5.7.11 pins Twig 3.15). Renovate's job is
  // the incremental update; the vulnerable package gets its own security PR and verify gates both.
  customEnvVariables: { COMPOSER_POLICY_ADVISORIES_BLOCK: '0' },
  // DRY_RUN=full is set by the workflow_dispatch input; see .github/workflows/renovate.yml
  dryRun: process.env.DRY_RUN === 'full' ? 'full' : null,
};
