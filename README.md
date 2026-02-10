
# Harmony

Harmony is a simple webapp used by Biserica Emanuel iasi to view, manage and request songs. 



## Features

- Bulk import songs
- Request songs
- Edit songs (To-do)
- Create Schedules (To-do)
- Export songs as PowerPoints/OpenSong/ProPresenter files (To-do)
- Cross platform
- Search lyrics




# Harmony

Harmony is a simple webapp used by Biserica Emanuel Iasi to view, manage and request songs. 



## Authors

- [@AstroTheAstronaut](https://www.github.com/AstroTheAstronaut)
- [@eejdan](https://www.github.com/eejdan)


```
Harmony
├─ app.js
├─ connectors
│  └─ db-connector.js
├─ functions
│  ├─ db-creator.js
│  └─ db.js
├─ i18n.js
├─ locales
│  ├─ en
│  │  └─ translation.json
│  ├─ es
│  │  └─ translation.json
│  ├─ it
│  │  └─ translation.json
│  └─ ro
│     └─ translation.json
├─ middleware
│  ├─ authers.js
│  ├─ notifications.js
│  └─ roleCheck.js
├─ models
│  ├─ Book.js
│  ├─ Note.js
│  ├─ Notification.js
│  ├─ RegisterCode.js
│  ├─ Request.js
│  ├─ Schedule.js
│  ├─ Song.js
│  ├─ SongPart.js
│  └─ User.js
├─ package-lock.json
├─ package.json
├─ permissions.js
├─ public
│  ├─ favicon.ico
│  ├─ img
│  │  ├─ admin-icon.jpg
│  │  ├─ admin-icon.svg
│  │  ├─ editor-icon.jpg
│  │  ├─ login-bg50-min.jpg
│  │  ├─ login-bg50.jpg
│  │  ├─ moderator-icon.jpg
│  │  ├─ viewer-icon.jpg
│  │  ├─ wave.svg
│  │  └─ wave_black.svg
│  ├─ scripts
│  │  ├─ index-script.js
│  │  ├─ notes.js
│  │  ├─ script.min.js
│  │  ├─ superuser.js
│  │  └─ upload-script.js
│  └─ styles
│     ├─ books-style.css
│     ├─ bootstrap.min.css
│     ├─ dark-theme.css
│     ├─ index-style.css
│     ├─ notes.css
│     ├─ sidebar.css
│     ├─ songs-style.css
│     └─ upload-style.css
├─ README.md
├─ routes
│  ├─ books.js
│  ├─ edit-song.js
│  ├─ helpers
│  │  ├─ actions.js
│  │  ├─ auth.js
│  │  ├─ checker.js
│  │  ├─ checkPermission.js
│  │  └─ clippy2.html
│  ├─ index.js
│  ├─ login.js
│  ├─ register.js
│  ├─ search.js
│  ├─ settings.js
│  ├─ setup.js
│  ├─ song-view.js
│  ├─ songs.js
│  ├─ superuser.js
│  └─ upload.js
└─ views
   ├─ books.ejs
   ├─ edit-song.ejs
   ├─ index.ejs
   ├─ login.ejs
   ├─ modals
   │  └─ delete_book.ejs
   ├─ partials
   │  ├─ books.ejs
   │  ├─ create_book.ejs
   │  ├─ footer.ejs
   │  ├─ most_requested.ejs
   │  ├─ navbar.ejs
   │  ├─ notes.ejs
   │  ├─ public-footer.ejs
   │  ├─ requested_songs.ejs
   │  ├─ sidebar.ejs
   │  ├─ superuser
   │  │  ├─ audit_log.ejs
   │  │  ├─ create_reg_codes.ejs
   │  │  ├─ metrics.ejs
   │  │  ├─ registration_codes_card.ejs
   │  │  ├─ users.ejs
   │  │  └─ view_reg_codes_list.ejs
   │  └─ upload_book.ejs
   ├─ public-view.ejs
   ├─ register.ejs
   ├─ schedule.ejs
   ├─ search-results.ejs
   ├─ settings.ejs
   ├─ setup.ejs
   ├─ song-edit.ejs
   ├─ song-view.ejs
   ├─ songs.ejs
   ├─ status
   │  ├─ 401.ejs
   │  ├─ 403.ejs
   │  ├─ 404.ejs
   │  └─ 429.ejs
   ├─ superuser.ejs
   └─ upload.ejs

```