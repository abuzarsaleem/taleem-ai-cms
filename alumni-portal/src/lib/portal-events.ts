/** Fired after RSVP / profile changes so shared rails (My events) reload. */
export const PORTAL_RAILS_REFRESH_EVENT = "taleem:portal-rails-refresh"

export function refreshPortalRails() {
  window.dispatchEvent(new Event(PORTAL_RAILS_REFRESH_EVENT))
}

/** Fired after the signed-in alumni updates their profile photo or name. */
export const PROFILE_UPDATED_EVENT = "taleem:profile-updated"

export function notifyProfileUpdated() {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}
