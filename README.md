# Course Management App
Full stack Vite.js (React + Typescript + Tailwind), Spring Boot and PostgreSQL web app.

Setup

Download the latest release, open CMD in the folder and simply docker-compose build up. If your computer's running any other instance of Vite, Springboot or Postgres locally it overrides the containers and keeps editing locally. Postgres is the most guilty of this, as I had to disable the PostgreSQL start-up service multiple times throughout development. Hot reload/dev mode is enabled for Vite only, since Spring DevTools is inconsistent (doesn't auto-update mapping, pathing and configs without a manual restart).

# Functionality (more like known issues)

Almost all functionality is, well, functional:

    Showing courses and filtering them (by checking off the box) by users participating in them causes an 404 error when fetched, even though the @GetMapping and fetchCourses() getters communicate well.
    Drag and drop media upload/download and previewing work stellar, only thing missing is the image preview when uploaded into the picture container.
    German translation is completely broken in course_details.tsx due to the component using hardcoded english keywords and character delimiters making it hard to implement in a short time.

Thank you for reading!
