# The site as an image, so the VPS deploys it like every other app: deploy-app copies /site out
# of it into /srv/bedroom-planner/site-<sha> and repoints the `current` symlink nginx serves.
FROM scratch
COPY site /site
