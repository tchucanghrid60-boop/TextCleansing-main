# Deployment notes

This Node server listens on `0.0.0.0:$PORT` (default `3000`). The container health path is `/healthz`. The managed runtime secret `AIFORTHAI_API_KEY` is injected at process runtime; it must never be added to the image, source code, repository, or client bundle.
