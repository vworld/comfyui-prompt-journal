/**
 *
 * Any user-configurable setting or application default
 * used by a page should be defined here instead of being
 * hard-coded inside components.
 *
 *  * Convention:
 *
 * pageName -> concern -> ... -> setting
 *
 * Examples:
 *
 * createPage.hierarchyCreation.alwaysEnterAdditionalInformation
 * browsePage.search.defaultLimit
 *
 * Group related settings by concern and use camelCase names.
 *
 */
export const SETTINGS = {
  createPage: {
    hierarchyCreation: {
      alwaysEnterAdditionalInformation: true,
    },
  },
  logging: {
    api: true,
    info: true,
    warn: true,
    error: true,
  },
} as const;
