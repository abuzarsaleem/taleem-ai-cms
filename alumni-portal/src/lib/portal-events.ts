/** Fired after RSVP / profile changes so shared rails (My events) reload. */
export const PORTAL_RAILS_REFRESH_EVENT = "taleem:portal-rails-refresh"

export function refreshPortalRails() {
  window.dispatchEvent(new Event(PORTAL_RAILS_REFRESH_EVENT))
}
