const Viewer = [
  'access_song_list',
  'access_book_list',
  'access_song_view',
  'search',
  'share_song'
];

const Moderator = [
  ...Viewer,
  'access_schedule',
  'create_schedule',
  'view_requested_songs',
  'edit_schedule',
  'delete_schedule',
  'request_song',
  'remove_requested_song',
  'create_notification',
  "view_requested_songs",
  'view_most_requested_songs'
];

const Editor = [
  ...Viewer,
  'request_song',
  'remove_requested_song',
  'upload_song',
  'edit_song',
  'mark_for_deletion',
  'create_notification',
  'view_most_requested_songs'
];

const Admin = [
  ...new Set([
    ...Viewer,
    ...Moderator,
    ...Editor,
    'upload_song',          // Already in Editor, but explicit here is fine
    'access_settings',
    'delete_song',
    'view_audit_log',
    'add_notes',
    'edit_notes',
    'delete_notes',
    'create_book',
    'delete_book',
    'edit_book',
    'upload_book',
    'view_notifications',
    'delete_notification',
  ])
];

// Superuser inherits Admin plus user management & invite code generation, detailed audit log access, etc.
const Superuser = [
  ...Admin,
  'create_user',
  'edit_user',
  'delete_user',
  'generate_invite_code',
  'view_detailed_audit_log',
  'superuser_access',
  '*'
];

module.exports = {
  roles: {
    Viewer,
    Moderator,
    Editor,
    Admin,
    Superuser,
  }
};
