FROM postgres:16-alpine


ENV POSTGRES_DB=chatapp
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres


COPY init.sql /docker-entrypoint-initdb.d/


EXPOSE 5432


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pg_isready -U postgres -d chatapp
